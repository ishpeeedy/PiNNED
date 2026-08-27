import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import type { Express } from 'express';
import Board from '../models/board.ts';
import Tile from '../models/tile.ts';
import {
    authHeader,
    resetDatabase,
    startTestServer,
    stopTestServer,
} from '../test/harness.ts';

let app: Express;

const owner = new mongoose.Types.ObjectId().toString();
const stranger = new mongoose.Types.ObjectId().toString();
const oid = () => new mongoose.Types.ObjectId().toString();

let boardId: string;

beforeAll(async () => {
    app = await startTestServer();
}, 120_000);

afterAll(async () => {
    await stopTestServer();
});

beforeEach(async () => {
    await resetDatabase();
    const board = await Board.create({ userId: owner, title: 'Board' });
    boardId = board._id.toString();
});

async function seedTile(overrides: Record<string, unknown> = {}) {
    const tile = await Tile.create({
        boardId,
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 240, height: 200 },
        ...overrides,
    });
    return tile._id.toString();
}

describe('GET tiles', () => {
    it('requires authentication', async () => {
        await request(app).get(`/api/boards/${boardId}/tiles`).expect(401);
    });

    it('returns the board’s tiles to its owner', async () => {
        await seedTile();
        await seedTile();

        const response = await request(app)
            .get(`/api/boards/${boardId}/tiles`)
            .set(...authHeader(owner))
            .expect(200);

        expect(response.body).toHaveLength(2);
    });

    it('refuses a caller who does not own the board', async () => {
        await request(app)
            .get(`/api/boards/${boardId}/tiles`)
            .set(...authHeader(stranger))
            .expect(403);
    });

    it('404s for a board that does not exist', async () => {
        await request(app)
            .get(`/api/boards/${oid()}/tiles`)
            .set(...authHeader(owner))
            .expect(404);
    });

    it('never exposes the embedding vector', async () => {
        await seedTile({ embedding: [0.1, 0.2, 0.3] });

        const response = await request(app)
            .get(`/api/boards/${boardId}/tiles`)
            .set(...authHeader(owner))
            .expect(200);

        expect(response.body[0].embedding).toBeUndefined();
    });
});

describe('POST tiles', () => {
    it('creates a tile and increments the board count', async () => {
        const response = await request(app)
            .post(`/api/boards/${boardId}/tiles`)
            .set(...authHeader(owner))
            .send({
                type: 'text',
                position: { x: 5, y: 5 },
                size: { width: 100, height: 100 },
                data: {},
            })
            .expect(201);

        expect(response.body.type).toBe('text');
        expect((await Board.findById(boardId))!.tileCount).toBe(1);
    });

    it('rejects an unknown tile type', async () => {
        await request(app)
            .post(`/api/boards/${boardId}/tiles`)
            .set(...authHeader(owner))
            .send({ type: 'video', data: {} })
            .expect(400);
    });

    it('refuses a caller who does not own the board', async () => {
        await request(app)
            .post(`/api/boards/${boardId}/tiles`)
            .set(...authHeader(stranger))
            .send({ type: 'text', data: {} })
            .expect(403);
    });
});

describe('PATCH a single tile', () => {
    it('updates the writable fields', async () => {
        const tileId = await seedTile();

        await request(app)
            .patch(`/api/boards/${boardId}/tiles/${tileId}`)
            .set(...authHeader(owner))
            .send({ position: { x: 40, y: 50 }, zIndex: 9 })
            .expect(200);

        const tile = await Tile.findById(tileId);
        expect(tile!.position).toMatchObject({ x: 40, y: 50 });
        expect(tile!.zIndex).toBe(9);
    });

    // Previously $set: req.body, so any field could be written.
    it('rejects server-owned fields', async () => {
        const tileId = await seedTile();

        await request(app)
            .patch(`/api/boards/${boardId}/tiles/${tileId}`)
            .set(...authHeader(owner))
            .send({ boardId: oid(), embedding: [1, 2] })
            .expect(400);

        const tile = await Tile.findById(tileId);
        expect(tile!.boardId.toString()).toBe(boardId);
    });

    it('refuses a caller who does not own the board', async () => {
        const tileId = await seedTile();

        await request(app)
            .patch(`/api/boards/${boardId}/tiles/${tileId}`)
            .set(...authHeader(stranger))
            .send({ zIndex: 3 })
            .expect(403);
    });

    it('404s for a tile that does not exist', async () => {
        await request(app)
            .patch(`/api/boards/${boardId}/tiles/${oid()}`)
            .set(...authHeader(owner))
            .send({ zIndex: 3 })
            .expect(404);
    });
});

describe('DELETE a single tile', () => {
    it('removes the tile and decrements the board count', async () => {
        const tileId = await seedTile();
        await Board.findByIdAndUpdate(boardId, { tileCount: 1 });

        await request(app)
            .delete(`/api/boards/${boardId}/tiles/${tileId}`)
            .set(...authHeader(owner))
            .expect(200);

        expect(await Tile.findById(tileId)).toBeNull();
        expect((await Board.findById(boardId))!.tileCount).toBe(0);
    });

    it('refuses a caller who does not own the board', async () => {
        const tileId = await seedTile();

        await request(app)
            .delete(`/api/boards/${boardId}/tiles/${tileId}`)
            .set(...authHeader(stranger))
            .expect(403);

        expect(await Tile.findById(tileId)).not.toBeNull();
    });

    // Cloudinary credentials are fake in tests, so the destroy call fails.
    // A failed asset cleanup must not leave an undeletable tile behind.
    it('still deletes an image tile when Cloudinary cleanup fails', async () => {
        const tileId = await seedTile({
            type: 'image',
            data: { cloudinaryPublicId: 'pinned/does-not-exist' },
        });

        await request(app)
            .delete(`/api/boards/${boardId}/tiles/${tileId}`)
            .set(...authHeader(owner))
            .expect(200);

        expect(await Tile.findById(tileId)).toBeNull();
    });
});
