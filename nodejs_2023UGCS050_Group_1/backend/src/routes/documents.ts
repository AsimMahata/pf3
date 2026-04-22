import { Router } from 'express';
import type { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {

    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml', 'application/pdf'
];

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

interface DocumentRow extends RowDataPacket {
    id: number;
    user_id: number;
    vault_id: number;
    name: string;
    original_name: string;
    mime_type: string;
    size: number;
    file_path: string;
    upload_date: Date;

    vault_name: string | null;
    vault_color: string | null;
}

interface VaultRow extends RowDataPacket {
    id: number;
    user_id: number;
}

const formatDoc = (d: DocumentRow) => ({
    id: d.id,
    vaultId: d.vault_id,
    name: d.name,
    originalName: d.original_name,
    type: d.mime_type,
    size: d.size,
    uploadDate: d.upload_date
});

// GET /api/documents
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<DocumentRow[]>(
            `SELECT d.*, v.name AS vault_name, v.color AS vault_color
             FROM documents d
             LEFT JOIN vaults v ON v.id = d.vault_id
             WHERE d.user_id = ?
             ORDER BY d.upload_date DESC`,
            [req.user.id]
        );
        res.json({ documents: rows.map(formatDoc) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

// GET /api/documents/vault/:vaultId
router.get('/vault/:vaultId', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [vaultRows] = await pool.query<VaultRow[]>(
            'SELECT id FROM vaults WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.vaultId, req.user.id]
        );
        if (!vaultRows[0]) { res.status(404).json({ message: 'Vault not found' }); return; }

        const [rows] = await pool.query<DocumentRow[]>(
            'SELECT * FROM documents WHERE user_id = ? AND vault_id = ? ORDER BY upload_date DESC',
            [req.user.id, req.params.vaultId]
        );
        res.json({ documents: rows.map(formatDoc) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching documents' });
    }
});

// GET /api/documents/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<DocumentRow[]>(
            'SELECT * FROM documents WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        const doc = rows[0];
        if (!doc) { res.status(404).json({ message: 'Document not found' }); return; }

        res.json({ document: formatDoc(doc) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching document' });
    }
});

// GET /api/documents/:id/download
router.get('/:id/download', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<DocumentRow[]>(
            'SELECT * FROM documents WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        const doc = rows[0];
        if (!doc) { res.status(404).json({ message: 'Document not found' }); return; }

        if (!fs.existsSync(doc.file_path)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }

        res.download(doc.file_path, doc.original_name, (err) => {
            if (err) console.error(err);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error downloading document' });
    }
});

// GET /api/documents/:id/preview
router.get('/:id/preview', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<DocumentRow[]>(
            'SELECT * FROM documents WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        const doc = rows[0];
        if (!doc) { res.status(404).json({ message: 'Document not found' }); return; }

        if (!fs.existsSync(doc.file_path)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }

        res.setHeader('Content-Type', doc.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${doc.original_name}"`);
        const fileStream = fs.createReadStream(doc.file_path);
        fileStream.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error previewing document' });
    }
});

// POST /api/documents
router.post('/', upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const vaultId = req.body.vaultId as string | undefined;
        if (!vaultId) {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(400).json({ message: 'Please select a vault to organize your document' });
            return;
        }

        const [vaultRows] = await pool.query<VaultRow[]>(
            'SELECT id FROM vaults WHERE id = ? AND user_id = ? LIMIT 1',
            [vaultId, req.user.id]
        );
        if (!vaultRows[0]) {
            if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(404).json({ message: 'Vault not found' });
            return;
        }

        const docName = (req.body.name as string | undefined) || req.file.originalname;

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO documents (user_id, vault_id, name, original_name, mime_type, size, file_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, vaultId, docName, req.file.originalname, req.file.mimetype, req.file.size, req.file.path]
        );
        const docId = result.insertId;

        const [rows] = await pool.query<DocumentRow[]>('SELECT * FROM documents WHERE id = ? LIMIT 1', [docId]);
        const doc = rows[0];
        if (!doc) { res.status(500).json({ message: 'Error saving document' }); return; }


        res.status(201).json({ message: 'Document uploaded successfully', document: formatDoc(doc) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading document' });
    }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {

    try {
        if (!req.user?.id) { res.status(401).json({ message: 'Unauthorized' }); return; }

        const [rows] = await pool.query<DocumentRow[]>(
            'SELECT * FROM documents WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        const doc = rows[0];
        if (!doc) { res.status(404).json({ message: 'Document not found' }); return; }

        await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);

        if (fs.existsSync(doc.file_path)) {

            fs.unlinkSync(doc.file_path);
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting document' });
    }
});

export default router;
