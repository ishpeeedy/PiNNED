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

beforeAll(async () => {
    app = await startTestServer();
}, 120_000);

afterAll(async () => {
    await stopTestServer();
});

beforeEach(async () => {
    await resetDatabase();
});

async function makeBoard(userId = owner, title = 'Board') {
    const board = await Board.create({ userId, title });
    return board._id.toString();
}

describe('boards', () => {
    it('requires authentication', async () => {
        await request(app).get('/api/boards').expect(401);
    });

    it('lists only the caller’s own boards', async () => {
        await makeBoard(owner, 'Mine');
        await makeBoard(stranger, 'Theirs');

        const response = await request(app)
            .get('/api/boards')
            .set(...authHeader(owner))
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Mine');
    });

    it('creates a board and rejects one without a title', async () => {
        await request(app)
            .post('/api/boards')
            .set(...authHeader(owner))
            .send({ title: 'New board' })
            .expect(201);

        await request(app)
            .post('/api/boards')
            .set(...authHeader(owner))
            .send({})
            .expect(400);
    });

    it('fetches a board the caller owns, and refuses one they do not', async () => {
        const mine = await makeBoard(owner);
        const theirs = await makeBoard(stranger);

        await request(app)
            .get(`/api/boards/${mine}`)
            .set(...authHeader(owner))
            .expect(200);

        await request(app)
            .get(`/api/boards/${theirs}`)
            .set(...authHeader(owner))
            .expect(403);

        await request(app)
            .get(`/api/boards/${oid()}`)
            .set(...authHeader(owner))
            .expect(404);
    });

    it('updates a board only for its owner', async () => {
        const boardId = await makeBoard(owner);

        await request(app)
            .patch(`/api/boards/${boardId}`)
            .set(...authHeader(owner))
            .send({ title: 'Renamed' })
            .expect(200);

        await request(app)
            .patch(`/api/boards/${boardId}`)
            .set(...authHeader(stranger))
            .send({ title: 'Hijacked' })
            .expect(403);

        const board = await Board.findById(boardId);
        expect(board!.title).toBe('Renamed');
    });

    it('deletes a board and cascades to its tiles', async () => {
        const boardId = await makeBoard(owner);
        const otherBoardId = await makeBoard(owner, 'Untouched');

        for (let i = 0; i < 3; i++) {
            await Tile.create({
                boardId,
                type: 'text',
                position: { x: 0, y: 0 },
                size: { width: 10, height: 10 },
            });
        }
        await Tile.create({
            boardId: otherBoardId,
            type: 'text',
            position: { x: 0, y: 0 },
            size: { width: 10, height: 10 },
        });

        await request(app)
            .delete(`/api/boards/${boardId}`)
            .set(...authHeader(owner))
            .expect(200);

        expect(await Board.findById(boardId)).toBeNull();
        // The cascade: tiles used to be orphaned in the collection forever.
        expect(await Tile.countDocuments({ boardId })).toBe(0);
        // ...but only this board's tiles.
        expect(await Tile.countDocuments({ boardId: otherBoardId })).toBe(1);
    });

    it('still deletes a board whose Cloudinary cleanup fails', async () => {
        const boardId = await makeBoard(owner);
        await Tile.create({
            boardId,
            type: 'image',
            position: { x: 0, y: 0 },
            size: { width: 10, height: 10 },
            // Credentials are fake in tests, so the Cloudinary call will fail.
            data: { cloudinaryPublicId: 'pinned/does-not-exist' },
        });

        await request(app)
            .delete(`/api/boards/${boardId}`)
            .set(...authHeader(owner))
            .expect(200);

        expect(await Board.findById(boardId)).toBeNull();
        expect(await Tile.countDocuments({ boardId })).toBe(0);
    });

    it('refuses to delete someone else’s board', async () => {
        const theirs = await makeBoard(stranger);

        await request(app)
            .delete(`/api/boards/${theirs}`)
            .set(...authHeader(owner))
            .expect(403);

        expect(await Board.findById(theirs)).not.toBeNull();
    });
});
