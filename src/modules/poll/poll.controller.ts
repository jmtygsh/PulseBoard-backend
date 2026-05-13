import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response.js";
import * as pollService from "./poll.service.js";

const createPoll = async (req: Request, res: Response) => {

    // console.log(req.body);

    const user = await pollService.createPollLogic(req.body);
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
        "Poll answered successfully submitted",
        poll
    );
};


export { createPoll, getPollBySlug, answerPoll };