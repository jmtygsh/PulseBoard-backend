import crypto from "crypto";
import { db } from "../../common/config/db.js";
import { pollsTable, questionsTable, questionOptionsTable } from "../../common/config/schema.js";
import type { CreatePollType } from "./dto/dto.poll.js";
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

    // unique sharable url
    const shareSlug = hashToken(userId)

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
            .returning({ id: pollsTable.id });

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



export { createPollLogic };
