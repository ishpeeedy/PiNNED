import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.ts';
import boardRoutes from './routes/board.ts';
import tileRoutes from './routes/tile.ts';
import uploadRoutes from './routes/upload.ts';
import metadataRoutes from './routes/metadata.ts';
import healthRoutes from './routes/health.ts';

/**
 * Builds the express app without binding a port or connecting to a database,
 * so tests can drive it against an in-memory MongoDB. `server.ts` remains the
 * production entry point.
 */
export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(healthRoutes);

    app.use('/api/auth', authRoutes);
    app.use('/api/boards', boardRoutes);
    app.use('/api', tileRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/metadata', metadataRoutes);

    return app;
}
