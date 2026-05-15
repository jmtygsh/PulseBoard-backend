// import project files
import { User } from "./auth.model.js";
import {
  comparePassword,
  hashToken,
} from "../../common/utils/hashToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} from "../../common/utils/jwt.utils.js";

import {
  sendVerificationEmail,
  sendResetPasswordEmail,
} from "../../common/config/email.js";

// import constants
import ApiError from "../../common/utils/api-error.js";
import type { RegisterUserType, LoginUserType, RefreshTokenType, LogoutUserType, VerifyEmailType, ForgotPasswordType, ResetPasswordType } from "./dto/index.js";

const register = async ({ name, email, password }: RegisterUserType) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw ApiError.conflict("Email already registered");
  }

  const { rawToken, hashedToken } = generateResetToken();

  const newUser = await User.create({
    name,
    email,
    password, // Hashed automatically by Mongoose pre-save hook
    provider: "credential",
    providerUserId: email,
    verificationToken: hashedToken,
  });

  try {
    await sendVerificationEmail(email, rawToken);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Even if the email fails (e.g. SMTP config issue), we want the user creation to succeed
    // so they aren't stuck unable to create the account.
  }

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt,
  };
};

const login = async ({ email, password }: LoginUserType) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw ApiError.notFound("Email is not found");
  }

  if (!user.password) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isVerified) {
    throw ApiError.forbidden("Please verify your email before logging in");
  }

  const accessToken = generateAccessToken({ id: user.id });
  const refreshToken = generateRefreshToken({ id: user.id });

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken
  };
};

const refresh = async ({ token }: RefreshTokenType) => {
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  const { id } = verifyRefreshToken(token);

  const user = await User.findById(id).select("+refreshToken");

  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  if (user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized("Invalid refresh token — please log in again");
  }

  const accessToken = generateAccessToken({ id: user.id });
  const newRefreshToken = generateRefreshToken({ id: user.id });

  user.refreshToken = hashToken(newRefreshToken);
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async ({ userId }: LogoutUserType) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

const verifyEmail = async ({ token }: VerifyEmailType) => {
  const trimmed = String(token).trim();

  if (!trimmed) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  const hashedInput = hashToken(trimmed);

  let user = await User.findOne({ verificationToken: hashedInput }).select("+verificationToken");

  if (!user) {
    user = await User.findOne({ verificationToken: trimmed }).select("+verificationToken");
  }

  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  user.isVerified = true;
  delete user.verificationToken;
  await user.save();

  return user;
};

const forgotPassword = async ({ email }: ForgotPasswordType) => {
  const user = await User.findOne({ email });

  if (!user) throw ApiError.notFound("email & password not found");

  const { rawToken, hashedToken } = generateResetToken();

  await sendResetPasswordEmail(email, rawToken);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
};

const resetPassword = async ({ token, password }: ResetPasswordType) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: { $gt: new Date() }
  }).select("+resetPasswordToken +resetPasswordExpiresAt");

  if (!user) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  user.password = password; // Hashed automatically by Mongoose pre-save hook
  delete user.resetPasswordToken;
  delete user.resetPasswordExpiresAt;
  await user.save();
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) throw ApiError.notFound("User not found");
  return user;
};

export {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
};
