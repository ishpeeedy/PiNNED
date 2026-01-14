import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env with explicit path
dotenv.config({ path: resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.ts';
import boardRoutes from './routes/board.ts';
import tileRoutes from './routes/tile.ts';
import uploadRoutes from './routes/upload.ts';
import metadataRoutes from './routes/metadata.ts';
import { initializeCloudinary } from './config/cloudinary.ts';

// Initialize Cloudinary AFTER env is loaded
initializeCloudinary();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    })
);
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api', tileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/metadata', metadataRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'PINNED API is running smoothly',
        timestamp: new Date().toISOString(),
    });
});

async function run() {
    try {
        await mongoose.connect(process.env.DATABASE_URL || '');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

run();

app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
