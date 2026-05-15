import crypto from "crypto";
import mongoose from "mongoose";
import { Poll, Response } from "./poll.model.js";
import type { CreatePollType, GetPollType, AnswerPollType, GetPollDataType } from "./dto/index.js";

import ApiError from "../../common/utils/api-error.js";
import { hashToken } from "../../common/utils/hashToken.js";
import { io } from "../../common/config/socket.io.js";


// create poll
const createPollLogic = async ({
    userId,
    title,
    description,
    requireAuth,
    status,
    expiresAt,
    questions,
}: CreatePollType & { userId: string }) => {

    // unique sharable url (using userId, timestamp, and random UUID to guarantee uniqueness)
    const shareSlug = hashToken(`${userId}-${Date.now()}-${crypto.randomUUID()}`);

    // With Mongoose and our embedded schema, we can insert everything in a single document
    const newPoll = await Poll.create({
        userId,
        title,
        description,
        requireAuth,
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        publishedAt: status === "published" ? new Date() : null,
        shareSlug,
        questions: questions.map((q, index) => ({
            questionText: q.questionText,
            isRequired: q.isRequired,
            displayOrder: index + 1,
            options: q.options.map((optText, optIndex) => ({
                optionText: optText,
                displayOrder: optIndex + 1
            }))
        }))
    });

    return newPoll;
};

// to display poll questions
const getPollBySlugLogic = async ({ slug, userId }: GetPollType) => {
    const poll = await Poll.findOne({ shareSlug: slug }).lean();

    if (!poll) {
        throw ApiError.notFound("Poll not found");
    }

    // Verify Auth (if the poll requireAuth is true so, user id have to be provided)
    if (poll.requireAuth && !userId) {
        throw ApiError.unauthorized("You must be logged in to view and answer this poll.");
    }

    return poll;
};


// to get poll answer from user
const answerPollBySlugLogic = async ({ slug, answers, anonymousId, userId }: AnswerPollType & { slug: string }) => {
    if (!slug) throw ApiError.badRequest("Poll slug is required");

    // Require either a logged-in user OR an anonymousId
    if (!userId && !anonymousId) throw ApiError.badRequest("You must provide ID to answer this poll.");

    const poll = await Poll.findOne({ shareSlug: slug });

    if (!poll) throw ApiError.notFound("Poll not found");

    // Verify Auth (if the poll requireAuth is true so, user id have to be provided)
    if (poll.requireAuth && !userId) throw ApiError.unauthorized("You must be logged in to answer this poll.");

    // Check if the poll is expired
    if (poll.status === "expired" && poll.expiresAt) throw ApiError.conflict(`Poll has expired on ${poll.expiresAt.toLocaleString()}. cannot answer.`);


    // Check for duplicate response
    const existingResponse = await Response.findOne({
        pollId: poll._id,
        [userId ? 'userId' : 'anonymousId']: userId || anonymousId,
    });

    if (existingResponse) {
        throw ApiError.conflict("You have already answered this poll.");
    }

    // Validate that all submitted answers belong to this poll
    const validQuestionsMap = new Map(
        poll.questions.map(q => [
            q._id.toString(),
            new Set(q.options.map(opt => opt._id.toString()))
        ])
    );

    const isValid = Object.entries(answers).every(([questionId, selectedOptionId]) => {
        const validOptions = validQuestionsMap.get(questionId);
        return validOptions && validOptions.has(selectedOptionId);
    });

    if (!isValid) {
        throw ApiError.badRequest("One or more submitted answers contain invalid questions or options for this poll.");
    }

    // Prepare the answers array for Mongoose
    const answersToInsert = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
    }));

    const newResponse = await Response.create({
        pollId: poll._id,
        ...(userId && { userId }),
        ...(anonymousId && { anonymousId }),
        answers: answersToInsert,
    });


    // After successful submission, broadcast only the new answer data (Delta Update)
    if (io) {
        try {
            const deltaUpdate = {
                isAuth: !!userId,
                data: newResponse.toJSON()
            };

            // Push the incremental update to anyone listening in this poll's room
            io.to(`poll_${slug}`).emit("new_response", deltaUpdate);
        } catch (error) {
            console.error("Failed to emit socket event:", error);
        }
    }

};

// to get poll analytics/results
const getPollAnalyticsLogic = async ({ slug }: { slug: string }) => {
    if (!slug) throw ApiError.badRequest("Poll slug is required");

    // Fetch poll skeleton
    const poll = await Poll.findOne({ shareSlug: slug });
    if (!poll) throw ApiError.notFound("Poll not found");

    // Aggregation pipeline to calculate stats
    const aggregationResult = await Response.aggregate([
        { $match: { pollId: poll._id } },
        {
            $facet: {
                // 1. Calculate overall response stats
                overallStats: [
                    {
                        $group: {
                            _id: null,
                            total: { $sum: 1 },
                            auth: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 1, 0] } },
                            ano: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 0, 1] } }
                        }
                    }
                ],
                // 2. Unwind answers to calculate stats per option
                optionStats: [
                    { $unwind: "$answers" },
                    {
                        $group: {
                            _id: "$answers.selectedOptionId",
                            totalVotes: { $sum: 1 },
                            authVotes: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 1, 0] } },
                            anoVotes: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 0, 1] } }
                        }
                    }
                ]
            }
        }
    ]);

    const stats = aggregationResult[0];
    const overallStats = stats.overallStats[0] || { total: 0, auth: 0, ano: 0 };

    // Convert optionStats array to a map for quick lookup O(1)
    const optionStatsMap = new Map(
        stats.optionStats.map((stat: any) => [
            stat._id.toString(),
            { total: stat.totalVotes, auth: stat.authVotes, ano: stat.anoVotes }
        ])
    );

    // Format results matching original structure
    const formattedResults = {
        pollId: poll._id,
        title: poll.title,
        status: poll.status,
        responses: {
            total: overallStats.total,
            auth: overallStats.auth,
            ano: overallStats.ano
        },
        questions: poll.questions.map((q) => {
            return {
                id: q._id,
                questionText: q.questionText,
                options: q.options.map((opt) => {
                    const votes = optionStatsMap.get(opt._id.toString()) || { total: 0, auth: 0, ano: 0 };

                    return {
                        id: opt._id,
                        optionText: opt.optionText,
                        voteCount: votes
                    };
                })
            };
        })
    };

    return formattedResults;
};


// to show all polls created by user to own data
const getPollDataLogic = async ({ userId }: GetPollDataType) => {
    if (!userId) throw ApiError.unauthorized("User ID is required");

    // Fetch polls CREATED by the user and count total responses for each
    const polls = await Poll.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "responses", // Mongoose collection name for Response model
                localField: "_id",
                foreignField: "pollId",
                as: "pollResponses"
            }
        },
        {
            $project: {
                id: "$_id",
                title: 1,
                description: 1,
                status: 1,
                requireAuth: 1,
                expiresAt: 1,
                publishedAt: 1,
                shareSlug: 1,
                createdAt: 1,
                updatedAt: 1,
                responseCount: { $size: "$pollResponses" },
                questionCount: { $size: "$questions" } // since questions is embedded, $size works directly on it
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    // Format the _id to id to match the expected return type
    return polls.map(poll => ({
        ...poll,
        id: poll._id.toString(),
    }));
};

export { createPollLogic, getPollBySlugLogic, answerPollBySlugLogic, getPollAnalyticsLogic, getPollDataLogic };