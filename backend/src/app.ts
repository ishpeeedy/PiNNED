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

    // Render terminates TLS at a proxy, so req.ip would otherwise be the
    // proxy's address for every caller and the rate limiters would key all
    // traffic to a single bucket. One hop only — trusting the whole chain
    // would let clients spoof X-Forwarded-For.
    app.set('trust proxy', 1);

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
