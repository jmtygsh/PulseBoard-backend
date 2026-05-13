// import third party libraries
import { eq, gt, and } from "drizzle-orm";

// import project files
import { db } from "../../common/config/db.js";
import { usersTable } from "../../common/config/schema.js";
import {
  hashPassword,
  comparePassword,
  hashToken,
} from "../../common/utils/hashToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
} from "../../common/utils/jwt.utils.js";

// import {
//   sendVerificationEmail,
//   sendResetPasswordEmail,
// } from "../../common/config/email.js";

// import constants
import ApiError from "../../common/utils/api-error.js";
import type { RegisterUserType, LoginUserType, RefreshTokenType, LogoutUserType, VerifyEmailType, ForgotPasswordType, ResetPasswordType } from "./dto/index.js";

const register = async ({ name, email, password }: RegisterUserType) => {
  // 1. Check if email already exists
  const existingUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw ApiError.conflict("Email already registered");
  }

  // 2. Generate tokens & hash password
  // hashedToken goes to the Database: You save "x9y8z7" into usersTable.verificationToken.
  // If your database is hacked, the hacker only sees "x9y8z7" and cannot figure out the real token.

  // - rawToken goes to the User's Email: You send the link https://yourapp.com/verify?token=a1b2c3d4 to the user.
  const { rawToken, hashedToken } = generateResetToken();
  const hashedPassword = await hashPassword(password);

  // 3. Insert into database using Drizzle
  const [newUser] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      password: hashedPassword,
      verificationToken: hashedToken, // Save the hashed version
    })
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      createdAt: usersTable.createdAt,
    });

  // 4. Send email (wrapped in try/catch so failure doesn't break registration)
  // try {
  //   await sendVerificationEmail(email, rawToken); // Send the raw version
  // } catch (err: any) {
  //   console.error("Failed to send verification email:", err.message);
  // }

  return newUser;
};

const login = async ({ email, password }: LoginUserType) => {
  // 1. Fetch user from DB
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      password: usersTable.password,
      isVerified: usersTable.isVerified,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    throw ApiError.notFound("Email is not found");
  }

  if (!user.password) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // 2. Check Password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // 3. Check Verification
  if (!user.isVerified) {
    throw ApiError.forbidden("Please verify your email before logging in");
  }

  // 4. Generate Tokens
  const accessToken = generateAccessToken({ id: user.id });
  const refreshToken = generateRefreshToken({ id: user.id });

  // 5. Store hashed refresh token in DB
  // Simply setting user.refreshToken = ... only updates the local object.
  // You must run an update query to save it to the database.
  await db
    .update(usersTable)
    .set({ refreshToken: hashToken(refreshToken) })
    .where(eq(usersTable.id, user.id))
    .returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      refreshToken: usersTable.refreshToken,
    });

  return {
    user: { id: user.id, name: user.name, email: user.email },
    accessToken,
    refreshToken
  };

};

// Issues a new access token using a valid refresh token
const refresh = async ({ token }: RefreshTokenType) => {
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  // 1. Verify token and extract payload (token is actually made by user id so, we decode it got user id)
  const { id } = verifyRefreshToken(token);

  // 2. Fetch user from DB
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  // 3. Verify the refresh token matches what's stored (prevents reuse of old tokens)
  if (user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized("Invalid refresh token — please log in again");
  }

  // 4. Generate Tokens
  const accessToken = generateAccessToken({ id: user.id });

  return { accessToken };
};

const logout = async ({ userId }: LogoutUserType) => {
  // Clear stored refresh token so it can't be reused
  await db
    .update(usersTable)
    .set({ refreshToken: null })
    .where(eq(usersTable.id, userId));
};

const verifyEmail = async ({ token }: VerifyEmailType) => {
  const trimmed = String(token).trim();

  if (!trimmed) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  // DB stores SHA256(raw). Links / email use the raw token — we hash for lookup.
  const hashedInput = hashToken(trimmed);

  // 1. Fetch user by hashed token OR raw token directly
  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      eq(usersTable.verificationToken, hashedInput)
    )
    .limit(1);

  // Fallback to check raw token (for backwards compatibility/testing)
  let foundUser = user;
  if (!foundUser) {
    const [userRaw] = await db
      .select()
      .from(usersTable)
      .where(
        eq(usersTable.verificationToken, trimmed)
      )
      .limit(1);
    foundUser = userRaw;
  }

  if (!foundUser) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  // 2. Update user to verified and clear the token
  await db
    .update(usersTable)
    .set({
      isVerified: true,
      verificationToken: null
    })
    .where(eq(usersTable.id, foundUser.id));

  return foundUser;
};

const forgotPassword = async ({ email }: ForgotPasswordType) => {

  // 1. Fetch user from DB where email matches
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      resetPasswordToken: usersTable.resetPasswordToken,
      resetPasswordExpiresAt: usersTable.resetPasswordExpiresAt,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);


  if (!user) throw ApiError.notFound("No account with that email");

  // 2. Generate reset token
  const { rawToken, hashedToken } = generateResetToken();

  await db
    .update(usersTable)
    .set({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    .where(eq(usersTable.id, user.id));

  // try {
  //   await sendResetPasswordEmail(email, rawToken);
  // } catch (err) {
  //   console.error("Failed to send reset email:", err.message);
  // }

};

const resetPassword = async ({ token, password }: ResetPasswordType) => {
  const hashedToken = hashToken(token);

  // 1. Find user with valid token and unexpired timestamp
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      resetPasswordToken: usersTable.resetPasswordToken,
      resetPasswordExpiresAt: usersTable.resetPasswordExpiresAt,
    })
    .from(usersTable)
    .where(
      and(
        // Condition 1: Does the token match?
        eq(usersTable.resetPasswordToken, hashedToken),

        // Condition 2: Is the expiration time in the future?
        gt(usersTable.resetPasswordExpiresAt, new Date())
      )
    )
    .limit(1);

  if (!user) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  // 2. Hash the new password
  const hashedPassword = await hashPassword(password);

  // 3. Update the password and clear the reset tokens
  await db
    .update(usersTable)
    .set({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    })
    .where(eq(usersTable.id, user.id));
};

// const getMe = async (userId) => {
//   const user = await User.findById(userId);
//   if (!user) throw ApiError.notFound("User not found");
//   return user;
// };

export {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  // getMe,
};
