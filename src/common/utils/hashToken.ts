import crypto from "crypto";
import bcrypt from "bcrypt";

// for normal tokens (like refresh tokens, verification tokens at email etc)
const hashToken = (token: string) =>
    crypto.createHash("sha256").update(token).digest("hex");


// for passwords
// we hash them to store them in the database
// and compare them when we receive them from the client
const hashPassword = async (password: string) =>
    await bcrypt.hash(password, 10);

const comparePassword = async (password: string, hashedPassword: string) =>
    await bcrypt.compare(password, hashedPassword);


export { hashToken, hashPassword, comparePassword };