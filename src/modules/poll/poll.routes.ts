import { Router } from "express";
import * as controller from "./poll.controller.js";
import { validateMiddleware, checkAuthenticate } from "../../common/middleware/validate.middleware.js";
import { CreatePollSchema } from "./dto/dto.poll.js";


const router: Router = Router();

// Create a new poll (Requires Auth)
router.post("/", checkAuthenticate, validateMiddleware(CreatePollSchema), controller.createPoll);

export default router;
