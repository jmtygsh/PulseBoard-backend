

// import third party 
import express from "express";
import type { Express } from "express";
import authRoute from "./modules/auth/auth.routes.js";
import pollRoute from "./modules/poll/poll.routes.js";

// file import 
import ApiError from "./common/utils/api-error.js";

const app: Express = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/health", (req, res) => {
    res.status(200).json({ message: "Healthy" });
});

app.use("/api/auth", authRoute);
app.use("/api/polls", pollRoute);

// Catch-all for undefined routes
app.all("{*path}", (req, res) => {
    throw ApiError.notFound(`Route ${req.originalUrl} not found`);
});



export default app;
