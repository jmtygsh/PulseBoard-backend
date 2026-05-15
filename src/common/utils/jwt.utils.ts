import crypto from "crypto";
import jwt from "jsonwebtoken";


// Define the shape of your payload
export interface TokenPayload extends jwt.JwtPayload {
  id: string;
}

const generateAccessToken = (payload: TokenPayload) => {
  // Check if JWT_ACCESS_SECRET is set
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not set");
  }

  // @ts-ignore
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

const verifyAccessToken = (token: string): TokenPayload => {
  // Check if JWT_ACCESS_SECRET is set
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET environment variable is not set");
  }

  return jwt.verify(token, process.env.JWT_ACCESS_SECRET) as TokenPayload;
};

const generateRefreshToken = (payload: TokenPayload) => {
  // Check if JWT_REFRESH_SECRET is set
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  // @ts-ignore
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

const verifyRefreshToken = (token: string): TokenPayload => {
  // Check if JWT_REFRESH_SECRET is set
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as TokenPayload;
};

const generateResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return { rawToken, hashedToken };
};

export {
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
};
