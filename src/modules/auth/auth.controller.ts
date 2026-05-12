



import type { Request, Response } from "express";

// import project files 
import * as authService from "./auth.service.js";
import type { RegisterUser } from "./auth.types.js";
import { socialAuthLogic } from "./auth.social.js";



// import constants 
import ApiResponse from "../../common/utils/api-response.js";
import type { socialAuth } from "./auth.types.js";

const register = async (req: Request<{}, {}, RegisterUser>, res: Response) => {

    const body = req.body;
    const user = await authService.register(body);
    ApiResponse.created(
        res,
        "Registration successful. Please verify your email.",
        user,
    );
};

const socialAuthentication = async (req: Request<{}, {}, socialAuth>, res: Response) => {
    const user = await socialAuthLogic(req.body);
    ApiResponse.created(res, "Login successful", user);
};

// const login = async (req, res) => {
//     const { user, accessToken, refreshToken } = await authService.login(req.body);

//     // Refresh token goes in httpOnly cookie — not accessible to JS
//     res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     ApiResponse.ok(res, "Login successful", { user, accessToken });
// };

// const refreshToken = async (req, res) => {
//     const token = req.cookies?.refreshToken;
//     const { accessToken } = await authService.refresh(token);
//     ApiResponse.ok(res, "Token refreshed", { accessToken });
// };

// const logout = async (req, res) => {
//     await authService.logout(req.user.id);
//     res.clearCookie("refreshToken");
//     ApiResponse.ok(res, "Logged out successfully");
// };

// const verifyEmail = async (req, res) => {
//     await authService.verifyEmail(req.params.token);
//     ApiResponse.ok(res, "Email verified successfully");
// };

// const forgotPassword = async (req, res) => {
//     await authService.forgotPassword(req.body.email);
//     ApiResponse.ok(res, "Password reset email sent");
// };

// const resetPassword = async (req, res) => {
//     await authService.resetPassword(req.params.token, req.body.password);
//     ApiResponse.ok(res, "Password reset successful");
// };

// const getMe = async (req, res) => {
//     const user = await authService.getMe(req.user.id);
//     ApiResponse.ok(res, "User profile", user);
// };

export {
    register,
    socialAuthentication,
    // login,
    // refreshToken,
    // logout,
    // verifyEmail,
    // forgotPassword,
    // resetPassword,
    // getMe,
};
