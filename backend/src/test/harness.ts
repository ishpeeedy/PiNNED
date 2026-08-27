import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import type { Express } from 'express';

/**
 * Integration harness: a real express app against a real (in-memory) MongoDB.
 *
 * Route handlers are mostly ownership checks and database writes, which unit
 * tests cannot meaningfully cover. This runs the actual stack.
 */

let memoryServer: MongoMemoryServer | undefined;

export const TEST_JWT_SECRET = 'test-secret';

export async function startTestServer(): Promise<Express> {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.CLIENT_URL = 'http://localhost:5173';
    // Cloudinary and Gemini are never reached by these tests, but the modules
    // read their config at import time.
    process.env.CLOUDINARY_CLOUD_NAME ??= 'test';
    process.env.CLOUDINARY_API_KEY ??= 'test';
    process.env.CLOUDINARY_API_SECRET ??= 'test';
    process.env.GEMINI_API_KEY ??= 'test';

    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());

    const { createApp } = await import('../app.ts');
    return createApp();
}

export async function stopTestServer(): Promise<void> {
    await mongoose.disconnect();
    await memoryServer?.stop();
    memoryServer = undefined;
}

export async function resetDatabase(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const name of Object.keys(collections)) {
        await collections[name].deleteMany({});
    }
}

export function tokenFor(userId: string): string {
    return jwt.sign({ userId, email: `${userId}@example.com` }, TEST_JWT_SECRET);
}

export function authHeader(userId: string): [string, string] {
    return ['Authorization', `Bearer ${tokenFor(userId)}`];
}
