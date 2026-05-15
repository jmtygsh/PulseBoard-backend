// Example of what would go in cors.config.ts
import type { CorsOptions } from "cors";

export const corsConfig: CorsOptions = {
    // When credentials is true, origin cannot be "*". It must be explicitly defined.
    origin: process.env.NODE_ENV === "development" ? "http://localhost:5173" : process.env.CORS_CLIENT_URL,
    credentials: true,
};