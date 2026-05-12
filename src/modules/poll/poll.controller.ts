import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response.js";
import * as pollService from "./poll.service.js";

const createPoll = async (req: Request, res: Response) => {

    const user = await pollService.createPollLogic(req.body);
    ApiResponse.created(
        res,
        "Poll created successfully",
        user,
    );
};


export { createPoll };