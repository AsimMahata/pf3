import { Router } from 'express';
import type { Response } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(authMiddleware);

interface VaultRow extends RowDataPacket {
    id: number;
    user_id: number;
    name: string;
    description: string;
    color: string;
    created_at: Date;
}

const formatVault = (v: VaultRow) => ({
    id: v.id,
    name: v.name,
    description: v.description,
    color: v.color,
    createdAt: v.created_at,
    credentialCount: 0
});

// GET /api/vaults
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<VaultRow[]>(
            'SELECT * FROM vaults WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ vaults: rows.map(formatVault) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching vaults' });
    }
});

// GET /api/vaults/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<VaultRow[]>(
            'SELECT * FROM vaults WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        const vault = rows[0];
        if (!vault) { res.status(404).json({ message: 'Vault not found' }); return; }

        res.json({ vault: formatVault(vault) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching vault' });
    }
});

// POST /api/vaults
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const { name, description, color } = req.body as { name?: string; description?: string; color?: string };
        if (!name) { res.status(400).json({ message: 'Vault name is required' }); return; }

        const vaultColor = color || `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO vaults (user_id, name, description, color) VALUES (?, ?, ?, ?)',
            [req.user.id, name.trim(), description?.trim() ?? '', vaultColor]
        );
        const vaultId = result.insertId;

        const [rows] = await pool.query<VaultRow[]>('SELECT * FROM vaults WHERE id = ? LIMIT 1', [vaultId]);
        const vault = rows[0];
        if (!vault) { res.status(500).json({ message: 'Error creating vault' }); return; }


        res.status(201).json({ message: 'Vault created successfully', vault: formatVault(vault) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating vault' });
    }
});

// PUT /api/vaults/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const { name, description, color } = req.body as { name?: string; description?: string; color?: string };

        const [result] = await pool.query<ResultSetHeader>(
            'UPDATE vaults SET name = ?, description = ?, color = ? WHERE id = ? AND user_id = ?',
            [name, description ?? '', color, req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) { res.status(404).json({ message: 'Vault not found' }); return; }

        const [rows] = await pool.query<VaultRow[]>('SELECT * FROM vaults WHERE id = ? LIMIT 1', [req.params.id]);
        const vault = rows[0];
        if (!vault) { res.status(404).json({ message: 'Vault not found' }); return; }


        res.json({ message: 'Vault updated successfully', vault: formatVault(vault) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating vault' });
    }
});

// DELETE /api/vaults/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM vaults WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) { res.status(404).json({ message: 'Vault not found' }); return; }


        res.json({ message: 'Vault deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting vault' });
    }
});

export default router;
