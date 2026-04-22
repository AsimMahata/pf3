import express from 'express';
import cors from 'cors';
import type { Express } from 'express';
import authRoutes from './routes/auth.js';
import vaultRoutes from './routes/vaults.js';
import credentialRoutes from './routes/credentials.js';
import documentRoutes from './routes/documents.js';

const app: Express = express();

app.use(
    cors({
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true,
        exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
    })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/documents', documentRoutes);

app.get('/', (_req, res) => {
    res.send('SQL backend working');
});

app.get('/api/test', (_req, res) => {
    res.status(200).json({ hello: 'hi from backend' });
});

export { app };
