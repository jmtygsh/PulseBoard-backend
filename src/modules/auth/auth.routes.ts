import { Router } from "express";
import * as controller from "./auth.controller.js";
import { RegisterUserSchema, LoginUserSchema, LogoutUserSchema, ForgotPasswordSchema, ResetPasswordSchema, RefreshTokenSchema, VerifyEmailSchema } from "./dto/index.js";
import { checkAuthenticate, protectedRoute, validateMiddleware } from "../../common/middleware/validate.middleware.js";


const router: Router = Router();

// public routes (No authentication required)
router.post("/register", checkAuthenticate, validateMiddleware(RegisterUserSchema), controller.register);
router.post("/login", checkAuthenticate, validateMiddleware(LoginUserSchema), controller.login);
router.post("/refresh-token", checkAuthenticate, controller.refreshToken);
router.get("/verify-email/:token", checkAuthenticate, validateMiddleware(VerifyEmailSchema), controller.verifyEmail);
router.post(
    "/forgot-password",
    checkAuthenticate,
    validateMiddleware(ForgotPasswordSchema),
    controller.forgotPassword,
);
router.put(
    "/reset-password/:token",
    checkAuthenticate,
    validateMiddleware(ResetPasswordSchema),
    controller.resetPassword,
);



// Protected Routes (Require user to be logged in)
router.post("/logout", checkAuthenticate, protectedRoute, controller.logout);

router.get("/me", checkAuthenticate, protectedRoute, controller.getMe);

export default router;
