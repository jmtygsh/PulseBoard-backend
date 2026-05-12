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

    const header = req.headers['authorization']
    if (!header) next()

    if (!header?.startsWith('Bearer')) {
        throw ApiError.unauthorized("Authentication token must start with Bearer");
    }

    const token = header.split(' ')[1]

    if (!token) throw ApiError.unauthorized("Authentication token is missing");

    const user = verifyAccessToken(token)

    if (!user) throw ApiError.unauthorized("Invalid or expired token");

    req.user = user;

    next();

};


/* ---------------------------------------------------------
  check only if user is authenticated or not,
  if not do not allow access to the protected routes
--------------------------------------------------------- */
function restrictToAuthenticatedUser() {
    return function (req: Request, res: Response, next: NextFunction) {
        // @ts-ignore
        if (!req.user) throw ApiError.unauthorized("Authentication Required");
        next()
    }
}


export { validateMiddleware, checkAuthenticate, restrictToAuthenticatedUser };
