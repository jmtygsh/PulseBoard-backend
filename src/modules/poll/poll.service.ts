import crypto from "crypto";
import { eq, and, inArray, desc, countDistinct } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { pollsTable, questionsTable, questionOptionsTable, responsesTable, responseAnswersTable } from "../../common/config/schema.js";
import type { CreatePollType, GetPollType, AnswerPollType, GetPollDataType } from "./dto/index.js";

import ApiError from "../../common/utils/api-error.js";
import { hashToken } from "../../common/utils/hashToken.js";
import { io } from "../../common/config/socket.io.js";



const createPollLogic = async ({
    userId,
    title,
    description,
    requireAuth,
    status,
    expiresAt,
    questions,
}: CreatePollType) => {

    // unique sharable url (using userId, timestamp, and random UUID to guarantee uniqueness)
    const shareSlug = hashToken(`${userId}-${Date.now()}-${crypto.randomUUID()}`);

    // opening on database transection method if anything goes failed just rollback
    const newPoll = await db.transaction(async (tx) => {

        /* =========================
           1. INSERT POLL
        ========================= */
        const [insertedPoll] = await tx
            .insert(pollsTable)
            .values({
                userId,
                title,
                description,
                requireAuth,
                status,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                publishedAt: status === "published" ? new Date() : null,
                shareSlug,
            })
            .returning({ id: pollsTable.id, shareSlug: pollsTable.shareSlug });

        if (!insertedPoll?.id) {
            throw ApiError.conflict("Failed to insert poll");
        }

        /* =========================
           2. PREPARE QUESTIONS
        ========================= */
        const questionsToInsert = questions.map((q, index) => ({
            pollId: insertedPoll.id,
            questionText: q.questionText,
            isRequired: q.isRequired,
            displayOrder: index + 1,
        }));

        /* =========================
           3. BULK INSERT QUESTIONS
        ========================= */
        const insertedQuestions = await tx
            .insert(questionsTable)
            .values(questionsToInsert)
            .returning({ id: questionsTable.id, displayOrder: questionsTable.displayOrder });

        if (insertedQuestions.length !== questions.length) {
            throw ApiError.conflict("Failed to insert all questions");
        }

        /* =========================
           4. PREPARE OPTIONS
        ========================= */
        const optionsToInsert = insertedQuestions.flatMap(
            (insertedQuestion) => {

                // Safely match the inserted question with the original question using displayOrder
                const originalQuestion = questions.find(q => (questions.indexOf(q) + 1) === insertedQuestion.displayOrder);


                if (!originalQuestion) {
                    throw ApiError.conflict(
                        "Failed to insert all questions & answers"
                    );
                }

                return originalQuestion.options.map((optionText, optionIndex) => ({
                    questionId: insertedQuestion.id,
                    optionText,
                    displayOrder: optionIndex + 1,
                }));
            }
        );

        /* =========================
           5. BULK INSERT OPTIONS
        ========================= */
        if (optionsToInsert.length > 0) {
            await tx
                .insert(questionOptionsTable)
                .values(optionsToInsert);
        }

        return insertedPoll;
    });

    return newPoll;
};

const getPollBySlugLogic = async ({ slug, userId }: GetPollType) => {

    // I decided to use drizel relation api to arrange nested data in one db query 
    const poll = await db.query.pollsTable.findFirst({
        where: (pollsTable, { eq }) => eq(pollsTable.shareSlug, slug),
        with: {
            questions: {
                orderBy: (questionsTable, { asc }) => [asc(questionsTable.displayOrder)],
                with: {
                    options: {
                        orderBy: (questionOptionsTable, { asc }) => [asc(questionOptionsTable.displayOrder)]
                    }
                }
            }
        }
    });

    if (!poll) {
        throw ApiError.notFound("Poll not found");
    }

    // Verify Auth (if the poll requireAuth is true so, user id have to be provided)
    if (poll.requireAuth && !userId) {
        throw ApiError.unauthorized("You must be logged in to view and answer this poll.");
    }

    return poll;
};

const answerPollBySlugLogic = async ({ slug, answers, anonymousId, userId }: AnswerPollType & { slug: string }) => {

    if (!slug) throw ApiError.badRequest("Poll slug is required");

    // Require either a logged-in user OR an anonymousId
    if (!userId && !anonymousId) throw ApiError.badRequest("You must provide ID to answer this poll.");


    // Fetch only the specific poll data we need based on the slug
    const poll = await db.query.pollsTable.findFirst({
        where: (pollsTable, { eq }) => eq(pollsTable.shareSlug, slug),
        with: {
            questions: {
                columns: { id: true, isRequired: true }
            }
        }
    });

    if (!poll) throw ApiError.notFound("Poll not found");

    // Verify Auth (if the poll requireAuth is true so, user id have to be provided)
    if (poll.requireAuth && !userId) throw ApiError.unauthorized("You must be logged in to answer this poll.");

    // Check if the poll is expired
    if (poll.status === "expired" && poll.expiresAt) throw ApiError.conflict(`Poll has expired on ${poll.expiresAt.toLocaleString()}. cannot answer.`);

    // Verify that all required questions have been answered
    const requiredQuestions = poll.questions.filter(q => q.isRequired);
    const answeredQuestionIds = Object.keys(answers);
    const missingQuestions = requiredQuestions.filter(q => !answeredQuestionIds.includes(q.id));

    if (missingQuestions.length > 0) {
        throw ApiError.badRequest("Please answer all required questions.");
    }

    // Check for duplicate response
    const existingResponse = await db
        .select({ id: responsesTable.id })
        .from(responsesTable)
        .where(
            and(
                eq(responsesTable.pollId, poll.id),
                userId ? eq(responsesTable.userId, userId) : eq(responsesTable.anonymousId, anonymousId!)
            )
        )
        .limit(1);

    if (existingResponse.length > 0) {
        throw ApiError.conflict("You have already answered this poll.");
    }

    // Insert response and answers in a transaction
    await db.transaction(async (tx) => {
        // 1. Insert the response record
        const [insertedResponse] = await tx
            .insert(responsesTable)
            .values({
                pollId: poll.id,
                userId: userId || null,
                anonymousId: userId ? null : anonymousId,
            })
            .returning({ id: responsesTable.id });

        if (!insertedResponse?.id) {
            throw ApiError.conflict("Failed to record your response.");
        }

        // 2. Prepare the answers array
        // transform answers to array of object
        const answersToInsert = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
            responseId: insertedResponse.id,
            questionId,
            selectedOptionId,
        }));

        // 3. Bulk insert the answers
        if (answersToInsert.length > 0) {
            await tx.insert(responseAnswersTable).values(answersToInsert);
        }
    });

    // After successful submission, broadcast only the new answer data (Delta Update)
    if (io) {
        try {
            // Transform answers object into an array of { questionId, optionId } for easier frontend mapping
            const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
                questionId,
                selectedOptionId
            }));

            const deltaUpdate = {
                isAuth: !!userId,
                // Provide the specific ID used for this vote (either userId or anonymousId)
                voterId: userId || anonymousId,
                answers: formattedAnswers
            };

            // Push the incremental update to anyone listening in this poll's room
            io.to(`poll_${slug}`).emit("new_response", deltaUpdate);
        } catch (error) {
            console.error("Failed to emit socket event:", error);
        }
    }
};

const getPollAnalyticsLogic = async ({ slug }: { slug: string }) => {
    if (!slug) throw ApiError.badRequest("Poll slug is required");


    //  fetch poll skeleton
    const poll = await db.query.pollsTable.findFirst({
        where: (pollsTable, { eq }) => eq(pollsTable.shareSlug, slug),
        with: {
            questions: {
                orderBy: (questionsTable, { asc }) => [asc(questionsTable.displayOrder)],
                with: {
                    options: {
                        orderBy: (questionOptionsTable, { asc }) => [asc(questionOptionsTable.displayOrder)]
                    }
                }
            }
        }
    });

    if (!poll) throw ApiError.notFound("Poll not found");

    //  fetch responses
    const responses = await db
        .select({
            id: responsesTable.id,
            userId: responsesTable.userId
        })
        .from(responsesTable)
        .where(eq(responsesTable.pollId, poll.id));

    //  fetch answers
    const responseIds = responses.map((r) => r.id);

    let answers: { selectedOptionId: string, responseId: string }[] = [];

    if (responseIds.length > 0) {
        answers = await db
            .select({
                selectedOptionId: responseAnswersTable.selectedOptionId,
                responseId: responseAnswersTable.responseId
            })
            .from(responseAnswersTable)
            .where(inArray(responseAnswersTable.responseId, responseIds));
    }

    //  calculate stats
    const totalResponses = responses.length;
    const authResponses = responses.filter((r) => r.userId !== null).length;
    const anoResponses = responses.filter((r) => r.userId === null).length;

    //  format results
    const formattedResults = {
        pollId: poll.id,
        title: poll.title,
        status: poll.status,
        responses: {
            total: totalResponses,
            auth: authResponses,
            ano: anoResponses
        },
        questions: poll.questions.map((q) => {
            return {
                id: q.id,
                questionText: q.questionText,
                options: q.options.map((opt) => {

                    // Filter answers for this specific option
                    const optionAnswers = answers.filter((a) => a.selectedOptionId === opt.id);

                    // Count auth vs ano votes by checking the response it belongs to
                    const authVotes = optionAnswers.filter((a) => {
                        const response = responses.find((r) => r.id === a.responseId);
                        return response && response.userId !== null;
                    }).length;

                    const anoVotes = optionAnswers.filter((a) => {
                        const response = responses.find((r) => r.id === a.responseId);
                        return response && response.userId === null;
                    }).length;

                    return {
                        id: opt.id,
                        optionText: opt.optionText,
                        voteCount: {
                            total: optionAnswers.length,
                            auth: authVotes,
                            ano: anoVotes
                        }
                    };
                })
            };
        })
    };

    return formattedResults;
};

const getPollDataLogic = async ({ userId }: GetPollDataType) => {

    if (!userId) throw ApiError.unauthorized("User ID is required");

    // Fetch polls CREATED by the user and count total responses for each
    const polls = await db
        .select({
            id: pollsTable.id,
            title: pollsTable.title,
            description: pollsTable.description,
            status: pollsTable.status,
            requireAuth: pollsTable.requireAuth,
            expiresAt: pollsTable.expiresAt,
            publishedAt: pollsTable.publishedAt,
            shareSlug: pollsTable.shareSlug,
            createdAt: pollsTable.createdAt,
            updatedAt: pollsTable.updatedAt,
            // Use countDistinct to prevent cross-join multiplication
            responseCount: countDistinct(responsesTable.id),
            questionCount: countDistinct(questionsTable.id),
        })
        .from(pollsTable)
        .leftJoin(responsesTable, eq(pollsTable.id, responsesTable.pollId))
        .leftJoin(questionsTable, eq(pollsTable.id, questionsTable.pollId))
        .where(eq(pollsTable.userId, userId))
        .groupBy(pollsTable.id)
        .orderBy(desc(pollsTable.createdAt));

    return polls;
};

export { createPollLogic, getPollBySlugLogic, answerPollBySlugLogic, getPollAnalyticsLogic, getPollDataLogic };
