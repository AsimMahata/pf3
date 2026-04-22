import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';

type AsyncRouteHandler = (req: Request | AuthRequest, res: Response, next: NextFunction) => Promise<void>;

const asyncHandler = (fn: AsyncRouteHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
