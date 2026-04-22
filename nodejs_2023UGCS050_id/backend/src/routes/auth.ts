import { Router } from 'express';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

interface UserRow extends RowDataPacket {
    id: number;
    name: string;
    email: string;
    password: string;
    created_at: Date;
}

const generateToken = (user: { id: number | string; email: string; name: string }): string => {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'] & string;

    if (!jwtSecret) throw new Error('JWT_SECRET is not defined');

    const token = jwt.sign(
        { id: String(user.id), email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: jwtExpiresIn }
    );
    return token;
};

router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

        if (!name || !email || !password) {
            res.status(400).json({ message: 'Name, email, and password are required' });
            return;
        }

        // Validate lengths
        if (name.trim().length < 2 || name.trim().length > 50) {
            res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ message: 'Password must be at least 6 characters' });
            return;
        }

        const emailLower = email.toLowerCase().trim();

        const [existing] = await pool.query<UserRow[]>(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [emailLower]
        );
        if (existing[0]) {
            res.status(400).json({ message: 'Email already registered' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), emailLower, hashedPassword]
        );
        const userId = result.insertId;

        const [rows] = await pool.query<UserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
        const user = rows[0];
        if (!user) {
            res.status(500).json({ message: 'Error fetching created user' });
            return;
        }

        const token = generateToken({ id: userId, email: user.email, name: user.name });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: userId,
                name: user.name,
                email: user.email,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {

    try {
        const { email, password } = req.body as { email?: string; password?: string };

        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }

        const emailLower = email.toLowerCase().trim();

        const [rows] = await pool.query<UserRow[]>(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [emailLower]
        );
        const user = rows[0];
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const token = generateToken({ id: user.id, email: user.email, name: user.name });


        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        const [rows] = await pool.query<UserRow[]>(
            'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
            [req.user?.id]
        );
        const user = rows[0];
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

router.post('/logout', (_req: Request, res: Response): void => {

    res.json({ message: 'Logged out successfully' });
});

export default router;
