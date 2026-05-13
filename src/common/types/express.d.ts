declare global {
  namespace Express {
    export interface Request {
      user?: string; // It's now a string (userId), not an object
    }
  }
}

export {};
