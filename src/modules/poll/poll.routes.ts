import { Router } from "express";
import * as controller from "./poll.controller.js";
import { validateMiddleware, checkAuthenticate, protectedRoute } from "../../common/middleware/validate.middleware.js";
import { CreatePollSchema, AnswerPollSchema } from "./dto/index.js";


const router: Router = Router();

// Create a new poll (Requires Auth)
router.post("/create", checkAuthenticate, protectedRoute, validateMiddleware(CreatePollSchema), controller.createPoll);

// Fetch a poll by its share slug
// Notice: We ONLY use checkAuthenticate here (soft check) so anonymous users can still fetch it if requireAuth is false
router.get("/questions/:slug", checkAuthenticate, controller.getPollBySlug);

router.post("/answers/:slug", checkAuthenticate, validateMiddleware(AnswerPollSchema), controller.answerPoll);

// Fetch poll analytics/results
router.get("/analytics/:slug", checkAuthenticate, controller.getPollAnalytics);

// Fetch user's created polls
router.get("/data/list", checkAuthenticate, protectedRoute, controller.getPollData);

// Delete a poll (Soft Delete)
router.delete("/:id", checkAuthenticate, protectedRoute, controller.deletePoll);


// Make poll results public
router.post("/public/:id", checkAuthenticate, protectedRoute, controller.makePollPublic);

// Get paginated public polls
router.get("/public", controller.getPublicPolls);

export default router;
