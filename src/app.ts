

// import third party 
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";


// import modules
import authRoute from "./modules/auth/auth.routes.js";
import pollRoute from "./modules/poll/poll.routes.js";

// file import 
import ApiError from "./common/utils/api-error.js";
import { corsConfig } from "./common/config/cors.config.js";
import { globalErrorHandler } from "./common/middleware/validate.middleware.js";

const app: Express = express();

// Middlewares
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/health", (_, res) => {
    res.status(200).json({ message: "Healthy", success: true, code: 200 });
});

app.use("/api/auth", authRoute);
app.use("/api/polls", pollRoute);

// Catch-all for undefined routes
app.all("{*path}", (req, _) => {
    throw ApiError.notFound(`Route ${req.originalUrl} not found`);
});



// Global error handling middleware
app.use(globalErrorHandler);

export default app;
