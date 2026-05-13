// import node features files


// import third party library files 
import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";


// import local files 
import { verifyAccessToken } from "../utils/jwt.utils.js";


// import local constants files
import ApiError from "../utils/api-error.js";


/* ---------------------------------------------------------
  check only does the request body data is what we expect
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
  check only if user is authenticated or not,
  allow authenticated users to access the protected routes
  allow unauthenticated users to access the unprotected routes
--------------------------------------------------------- */

const checkAuthenticate = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        return next();
    }

    const token = header.split(' ')[1];
    if (!token) {
        return next();
    }

    try {
        const userId = verifyAccessToken(token).id;
        if (userId) {
            // req.user ===  undefined then we assign userId to req.user
            req.user = userId;
        }
    } catch (error) {
        // Ignoring token verification errors to allow unauthenticated access
    }

    return next();
};


/* ---------------------------------------------------------
  check only if user is authenticated or not,
  if not do not allow access to the protected routes
--------------------------------------------------------- */
const protectedRoute = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized("Authentication Required");
    return next();
};

export { validateMiddleware, checkAuthenticate, protectedRoute };

/* ---------------------------------------------------------
 "checkAuthenticate" softly identifies users while "protectedRoute" strictly blocks unauthenticated access, 
 enabling flexible anonymous or authenticated poll responses without duplicate logic.

 Due to, i need to use "checkAuthenticate" middleware on every routes, but if i keep strick then anonomous users can not access.
 Business logic poll should be answerable by authenticated users & anonymous users. 
 (base on condition set in the poll creation time) allow anonymous users to answer the poll or not.
--------------------------------------------------------- */

