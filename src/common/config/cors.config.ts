// Example of what would go in cors.config.ts
import type { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
    origin: process.env.NODE_ENV === "development" ? "*" : process.env.CORS_CLIENT_URL,
    credentials: true,
};