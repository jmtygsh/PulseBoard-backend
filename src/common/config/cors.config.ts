// Example of what would go in cors.config.ts
import type { CorsOptions } from "cors";

const allowedOrigins = [
    "http://localhost:5173", // For local development
    process.env.CORS_CLIENT_URL, // e.g. https://pulse-board.ygshjm.dev
].filter(Boolean); // Filter out any undefined values

export const corsConfig: CorsOptions = {
    // When credentials is true, origin cannot be "*". It must be explicitly defined.
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};