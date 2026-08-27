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

/**
 * The ownership check used to be copy-pasted into ten handlers. These tests
 * assert it behaves identically on every route that now shares the middleware,
 * so a future route cannot quietly regress.
 */

let app: Express;

const owner = new mongoose.Types.ObjectId().toString();
const stranger = new mongoose.Types.ObjectId().toString();
const oid = () => new mongoose.Types.ObjectId().toString();

let boardId: string;
let tileId: string;

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
    const tile = await Tile.create({
        boardId,
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
    });
    tileId = tile._id.toString();
});

/** Every board-scoped route, as [method, path builder]. */
const routes = () => [
    ['get', `/api/boards/${boardId}`],
    ['patch', `/api/boards/${boardId}`],
    ['delete', `/api/boards/${boardId}`],
    ['get', `/api/boards/${boardId}/tiles`],
    ['patch', `/api/boards/${boardId}/tiles`],
    ['post', `/api/boards/${boardId}/tiles`],
    ['get', `/api/boards/${boardId}/tiles/${tileId}`],
    ['patch', `/api/boards/${boardId}/tiles/${tileId}`],
    ['delete', `/api/boards/${boardId}/tiles/${tileId}`],
] as const;

describe('board ownership middleware', () => {
    it('rejects every board-scoped route without a token', async () => {
        for (const [method, path] of routes()) {
            const response = await (request(app) as never as Record<
                string,
                (p: string) => request.Test
            >)[method](path).send({});
            expect(
                response.status,
                `${method.toUpperCase()} ${path}`
            ).toBe(401);
        }
    });

    it('rejects every board-scoped route for a non-owner', async () => {
        for (const [method, path] of routes()) {
            const response = await (
                request(app) as never as Record<
                    string,
                    (p: string) => request.Test
                >
            )
                [method](path)
                .set(...authHeader(stranger))
                .send({});
            expect(
                response.status,
                `${method.toUpperCase()} ${path}`
            ).toBe(403);
        }
    });

    it('404s a board id that does not exist', async () => {
        await request(app)
            .get(`/api/boards/${oid()}/tiles`)
            .set(...authHeader(owner))
            .expect(404);
    });

    // Previously a CastError surfaced as a 500.
    it('404s a malformed board id rather than erroring', async () => {
        await request(app)
            .get('/api/boards/not-an-object-id/tiles')
            .set(...authHeader(owner))
            .expect(404);
    });

    it('a tile id from another board is unreachable', async () => {
        const otherBoard = await Board.create({
            userId: owner,
            title: 'Other',
        });
        const otherTile = await Tile.create({
            boardId: otherBoard._id,
            type: 'text',
            position: { x: 3, y: 3 },
            size: { width: 10, height: 10 },
        });

        // Owner of both boards, but the tile does not belong to `boardId`.
        await request(app)
            .patch(`/api/boards/${boardId}/tiles/${otherTile._id}`)
            .set(...authHeader(owner))
            .send({ zIndex: 99 })
            .expect(404);

        expect((await Tile.findById(otherTile._id))!.zIndex).not.toBe(99);
    });
});
