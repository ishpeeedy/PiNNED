import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.ts';
import boardRoutes from './routes/board.ts';
import tileRoutes from './routes/tile.ts';

dotenv.config();
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
