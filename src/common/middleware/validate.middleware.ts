import ApiError from "../utils/api-error.js";
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

const validateMiddleware = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
            throw ApiError.badRequest(errors.join("; "));
        }
        req.body = result.data;
        next();
    }
}

export default validateMiddleware;