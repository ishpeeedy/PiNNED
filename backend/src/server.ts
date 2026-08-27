import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env with explicit path
dotenv.config({ path: resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { createApp } from './app.ts';
import { initializeCloudinary } from './config/cloudinary.ts';
import { initializeGemini } from './config/gemini.ts';

// Initialize Cloudinary and Gemini AFTER env is loaded
initializeCloudinary();
initializeGemini();

const app = createApp();
const PORT = process.env.PORT || 5000;

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
