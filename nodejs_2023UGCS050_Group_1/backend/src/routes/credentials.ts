import { Router } from 'express';
import type { Response } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authMiddleware);

interface CredentialRow extends RowDataPacket {
    id: number;
    user_id: number;
    vault_id: number | null;
    title: string;
    username: string;
    password: string;
    url: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

const formatCred = (c: CredentialRow) => ({
    id: c.id,
    vaultId: c.vault_id ?? null,
    title: c.title,
    username: c.username,
    password: c.password,
    url: c.url,
    notes: c.notes,
    createdAt: c.created_at,
    updatedAt: c.updated_at
});

// GET /api/credentials
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<CredentialRow[]>(
            'SELECT * FROM credentials WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ credentials: rows.map(formatCred) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching credentials' });
    }
});

// GET /api/credentials/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<CredentialRow[]>(
            'SELECT * FROM credentials WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        const cred = rows[0];
        if (!cred) { res.status(404).json({ message: 'Credential not found' }); return; }

        res.json({ credential: formatCred(cred) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching credential' });
    }
});

// POST /api/credentials
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const { title, username, password, url, notes, vaultId } = req.body as {
            title?: string; username?: string; password?: string;
            url?: string; notes?: string; vaultId?: string | number | null;
        };

        if (!title || !username || !password) {
            res.status(400).json({ message: 'Title, username, and password are required' });
            return;
        }

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO credentials (user_id, vault_id, title, username, password, url, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, vaultId ?? null, title.trim(), username.trim(), password, url ?? null, notes ?? null]
        );
        const credId = result.insertId;

        const [rows] = await pool.query<CredentialRow[]>(
            'SELECT * FROM credentials WHERE id = ? LIMIT 1',
            [credId]
        );
        const cred = rows[0];
        if (!cred) { res.status(500).json({ message: 'Error creating credential' }); return; }


        res.status(201).json({ message: 'Credential created successfully', credential: formatCred(cred) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating credential' });
    }
});

// PUT /api/credentials/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const { title, username, password, url, notes, vaultId } = req.body as {
            title?: string; username?: string; password?: string;
            url?: string; notes?: string; vaultId?: string | number | null;
        };

        const setClauses: string[] = [];
        const values: unknown[] = [];

        if (title !== undefined) { setClauses.push('title = ?'); values.push(title); }
        if (username !== undefined) { setClauses.push('username = ?'); values.push(username); }
        if (password !== undefined) { setClauses.push('password = ?'); values.push(password); }
        if (url !== undefined) { setClauses.push('url = ?'); values.push(url); }
        if (notes !== undefined) { setClauses.push('notes = ?'); values.push(notes); }
        if (vaultId !== undefined) { setClauses.push('vault_id = ?'); values.push(vaultId ?? null); }

        if (setClauses.length === 0) {
            res.status(400).json({ message: 'Nothing to update' });
            return;
        }

        values.push(req.params.id, req.user.id);
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE credentials SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        if (result.affectedRows === 0) { res.status(404).json({ message: 'Credential not found' }); return; }

        const [rows] = await pool.query<CredentialRow[]>(
            'SELECT * FROM credentials WHERE id = ? LIMIT 1',
            [req.params.id]
        );
        const cred = rows[0];
        if (!cred) { res.status(404).json({ message: 'Credential not found' }); return; }

        res.json({ message: 'Credential updated successfully', credential: formatCred(cred) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating credential' });
    }
});

// DELETE /api/credentials/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM credentials WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) { res.status(404).json({ message: 'Credential not found' }); return; }

        res.json({ message: 'Credential deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting credential' });
    }
});

export default router;
