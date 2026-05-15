import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response.js";
import * as pollService from "./poll.service.js";

const createPoll = async (req: Request, res: Response) => {
    const user = await pollService.createPollLogic({ ...req.body, userId: req.user });
    ApiResponse.created(
        res,
        "Poll created successfully",
        user,
    );
};

const getPollBySlug = async (req: Request<{ slug: string }>, res: Response) => {
    // req.user will be populated if they are logged in (via checkAuthenticate)
    // If they aren't logged in, req.user will be undefined (which is fine if requireAuth is false)
    const poll = await pollService.getPollBySlugLogic({ slug: req.params.slug, userId: req.user });

    ApiResponse.ok(
        res,
        "Poll fetched successfully",
        poll
    );
};

const answerPoll = async (req: Request<{ slug: string }>, res: Response) => {
    // req.user will be populated if they are logged in (via checkAuthenticate) 
    // req.user will get user id from jwt decode 
    const poll = await pollService.answerPollBySlugLogic(
        {
            slug: req.params.slug,
            answers: req.body.answers,
            anonymousId: req.body.anonymousId,
            userId: req.user
        });
    ApiResponse.ok(
        res,
        "Poll answered successfully",
        poll
    );
};

const getPollAnalytics = async (req: Request<{ slug: string }>, res: Response) => {
    const analytics = await pollService.getPollAnalyticsLogic({ slug: req.params.slug });

    ApiResponse.ok(
        res,
        "Poll analytics fetched successfully",
        analytics
    );
};

const getPollData = async (req: Request, res: Response) => {
    // Validate user ID is provided via the validated req.body
    const polls = await pollService.getPollDataLogic({ userId: req.user! });

    ApiResponse.ok(
        res,
        "User polls fetched successfully",
        polls
    );
};

const deletePoll = async (req: Request<{ id: string }>, res: Response) => {
    const result = await pollService.deletePollLogic({ pollId: req.params.id, userId: req.user! });

    ApiResponse.ok(
        res,
        result.message,
        null
    );
};

const makePollPublic = async (req: Request<{ id: string }>, res: Response) => {
    const result = await pollService.makePollPublicLogic({ pollId: req.params.id, userId: req.user! });

    ApiResponse.ok(
        res,
        result.message,
        null
    );
};

const getPublicPolls = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    const result = await pollService.getPublicPollsLogic({ page, limit });

    ApiResponse.ok(
        res,
        "Public polls fetched successfully",
        result
    );
};

export { createPoll, getPollBySlug, answerPoll, getPollAnalytics, getPollData, deletePoll, makePollPublic, getPublicPolls };