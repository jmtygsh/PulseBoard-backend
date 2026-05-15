import type { Request, Response } from "express";

// import project files 
import * as authService from "./auth.service.js";


// import constants 
import ApiResponse from "../../common/utils/api-response.js";
import type { RegisterUserType, SocialAuthType } from "./dto/dto.register.js";
import { socialAuthLogic } from "./auth.social.js";


const register = async (req: Request<{}, {}, RegisterUserType>, res: Response) => {

    const user = await authService.register(req.body);
    ApiResponse.created(
        res,
        "Registration successful. Please verify your email.",
        user,
    );
};

const socialAuthentication = async (req: Request<{}, {}, SocialAuthType>, res: Response) => {
    const { user, accessToken, refreshToken } = await socialAuthLogic(req.body);

    // Refresh token goes in httpOnly cookie — not accessible to JS
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.created(res, "Login successful", { user, accessToken });
};

const login = async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    // Refresh token goes in httpOnly cookie — not accessible to JS
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.ok(res, "Login successful", { user, accessToken });
};

const refreshToken = async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } = await authService.refresh({ token });

    // Set new refresh token in cookie (Rolling Sessions)
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.ok(res, "Token refreshed", { accessToken });
};

const logout = async (req: Request, res: Response) => {
    await authService.logout({ userId: req.user! });
    res.clearCookie("refreshToken");
    ApiResponse.ok(res, "Logged out successfully");
};

const verifyEmail = async (req: Request<{ token: string }>, res: Response) => {
    await authService.verifyEmail({ token: req.params.token });
    ApiResponse.ok(res, "Email verified successfully");
};

const forgotPassword = async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    ApiResponse.ok(res, "Password reset email sent successfully");
};

const resetPassword = async (req: Request<{ token: string }>, res: Response) => {
    // Take the token from the URL params and the new password from the body
    await authService.resetPassword({ token: req.params.token, password: req.body.password });
    ApiResponse.ok(res, "Password reset successful");
};

const getMe = async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!);
    ApiResponse.ok(res, "User profile", user);
};

export {
    register,
    socialAuthentication,
    login,
    refreshToken,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    getMe,
};
