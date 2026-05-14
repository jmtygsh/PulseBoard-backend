import crypto from "crypto";
import jwt from "jsonwebtoken";


// Define the shape of your payload
export interface TokenPayload extends jwt.JwtPayload {
  id: string;
}

const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_EXPIRES_IN!, { expiresIn: '15m' });
};

const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
};

const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_EXPIRES_IN!, { expiresIn: '7d' });
};

const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
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
