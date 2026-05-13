import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { pollsTable, questionsTable, questionOptionsTable, responsesTable, responseAnswersTable } from "../../common/config/schema.js";
import type { CreatePollType, GetPollType, AnswerPollType } from "./dto/index.js";

import ApiError from "../../common/utils/api-error.js";
import { hashToken } from "../../common/utils/hashToken.js";



/* =========================
    Handle multiple questions & answers 
    descrture from array object to normal rows and columns
========================= */
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
            .returning({ id: questionsTable.id });

        if (insertedQuestions.length !== questions.length) {
            throw ApiError.conflict("Failed to insert all questions");
        }

        /* =========================
           4. PREPARE OPTIONS
        ========================= */
        const optionsToInsert = insertedQuestions.flatMap(
            (insertedQuestion, questionIndex) => {

                const originalQuestion = questions[questionIndex];


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

/* =========================
    Fetch a poll by its shareSlug
    Includes nested questions and options
========================= */
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


/* =========================
    Answer a poll by its shareSlug
========================= */

const answerPollBySlugLogic = async ({ slug, answers, anonymousId, userId }: AnswerPollType & { slug: string }) => {

    if (!slug) throw ApiError.badRequest("Poll slug is required");

    // Require either a logged-in user OR an anonymousId
    if (!userId && !anonymousId) throw ApiError.badRequest("You must provide ID to answer this poll.");


    // Fetch only the specific poll data we need based on the slug
    const [poll] = await db
        .select({
            id: pollsTable.id,
            requireAuth: pollsTable.requireAuth,
            status: pollsTable.status,
            expiresAt: pollsTable.expiresAt
        })
        .from(pollsTable)
        .where(eq(pollsTable.shareSlug, slug))
        .limit(1);

    if (!poll) throw ApiError.notFound("Poll not found");


    // Verify Auth (if the poll requireAuth is true so, user id have to be provided)
    if (poll.requireAuth && !userId) throw ApiError.unauthorized("You must be logged in to answer this poll.");


    // Check if the poll is expired
    if (poll.status === "expired" && poll.expiresAt) throw ApiError.conflict(`Poll has expired on ${poll.expiresAt.toLocaleString()}. cannot answer.`);


    // if question has required is true, then answer length much be same with question length (later add)

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

};


export { createPollLogic, getPollBySlugLogic, answerPollBySlugLogic };
