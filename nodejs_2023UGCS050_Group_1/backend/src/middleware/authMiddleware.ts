import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
    };
}

interface JwtPayloadCustom {
    id: string;
    email: string;
    name: string;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'Server configuration error' });
            return;
        }

        const decoded = jwt.verify(token, jwtSecret) as unknown as JwtPayloadCustom;

        const [rows] = await pool.query<import('mysql2').RowDataPacket[]>(
            'SELECT id FROM users WHERE id = ? LIMIT 1',
            [decoded.id]
        );

        if (!rows[0]) {
            res.status(401).json({ message: 'User no longer exists' });
            return;
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
