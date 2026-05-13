import { Router } from "express";
import * as controller from "./auth.controller.js";
// import { authenticate } from "./auth.middleware.js";
// import validate from "../../common/middleware/validate.middleware.js";
import { RegisterUserSchema, LoginUserSchema, RefreshTokenSchema, LogoutUserSchema, VerifyEmailSchema, ForgotPasswordSchema, ResetPasswordSchema } from "./dto/index.js";
import { checkAuthenticate, validateMiddleware } from "../../common/middleware/validate.middleware.js";
// import LoginDto from "./dto/login.dto.js";
// import ForgotPasswordDto from "./dto/forgot-password.dto.js";
// import ResetPasswordDto from "./dto/reset-password.dto.js";

const router: Router = Router();

router.post("/register", checkAuthenticate, validateMiddleware(RegisterUserSchema), controller.register);
router.post("/login", checkAuthenticate, validateMiddleware(LoginUserSchema), controller.login);
router.post("/refresh-token", checkAuthenticate, validateMiddleware(RefreshTokenSchema), controller.refreshToken);
router.post("/logout", checkAuthenticate, validateMiddleware(LogoutUserSchema), controller.logout);
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
// router.get("/me", authenticate, controller.getMe);

export default router;
