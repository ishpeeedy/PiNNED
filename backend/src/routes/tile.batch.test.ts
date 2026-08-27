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

let boardId: string;

const oid = () => new mongoose.Types.ObjectId().toString();

async function seedBoard(userId = owner) {
    const board = await Board.create({ userId, title: 'Test board' });
    return board._id.toString();
}

async function seedTile(overrides: Record<string, unknown> = {}) {
    const tile = await Tile.create({
        boardId,
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 240, height: 200 },
        data: {},
        zIndex: 1,
        ...overrides,
    });
    return tile._id.toString();
}

const batch = (body: object, userId = owner) =>
    request(app)
        .patch(`/api/boards/${boardId}/tiles`)
        .set(...authHeader(userId))
        .send(body);

beforeAll(async () => {
    app = await startTestServer();
}, 120_000);

afterAll(async () => {
    await stopTestServer();
});

beforeEach(async () => {
    await resetDatabase();
    boardId = await seedBoard();
});

describe('PATCH /api/boards/:boardId/tiles — access control', () => {
    it('rejects an unauthenticated request', async () => {
        await request(app)
            .patch(`/api/boards/${boardId}/tiles`)
            .send({ deletes: [oid()] })
            .expect(401);
    });

    it('rejects a user who does not own the board', async () => {
        await batch({ deletes: [oid()] }, stranger).expect(403);
    });

    it('404s for a board that does not exist', async () => {
        const missing = oid();
        await request(app)
            .patch(`/api/boards/${missing}/tiles`)
            .set(...authHeader(owner))
            .send({ deletes: [oid()] })
            .expect(404);
    });

    it('cannot touch a tile belonging to another board', async () => {
        const otherBoardId = await seedBoard(stranger);
        const victim = await Tile.create({
            boardId: otherBoardId,
            type: 'text',
            position: { x: 1, y: 1 },
            size: { width: 10, height: 10 },
        });

        // Authenticated, owns `boardId`, but targets a tile on another board.
        await batch({
            patches: [
                {
                    id: victim._id.toString(),
                    changes: { position: { x: 999, y: 999 } },
                },
            ],
        }).expect(200);

        const untouched = await Tile.findById(victim._id);
        expect(untouched!.position).toMatchObject({ x: 1, y: 1 });
    });
});

describe('PATCH /api/boards/:boardId/tiles — validation', () => {
    it('rejects an empty batch', async () => {
        await batch({}).expect(400);
    });

    it('rejects a batch over the operation cap', async () => {
        await batch({
            deletes: Array.from({ length: 501 }, () => oid()),
        }).expect(400);
    });

    it('rejects server-owned fields', async () => {
        const tileId = await seedTile();
        await batch({
            patches: [{ id: tileId, changes: { embedding: [1, 2, 3] } }],
        }).expect(400);
    });

    it('rejects a malformed id', async () => {
        await batch({ deletes: ['not-an-id'] }).expect(400);
    });
});

describe('PATCH /api/boards/:boardId/tiles — operations', () => {
    it('patches many tiles in one request — the group drag case', async () => {
        const ids = [];
        for (let i = 0; i < 5; i++) {
            ids.push(await seedTile({ position: { x: i, y: i } }));
        }

        await batch({
            patches: ids.map((id, i) => ({
                id,
                changes: { position: { x: 100 + i, y: 200 + i } },
            })),
        }).expect(200);

        const tiles = await Tile.find({ boardId }).sort({ 'position.x': 1 });
        expect(tiles.map((t) => t.position.x)).toEqual([
            100, 101, 102, 103, 104,
        ]);
        expect(tiles.map((t) => t.position.y)).toEqual([
            200, 201, 202, 203, 204,
        ]);
    });

    it('creates tiles under client-supplied ids', async () => {
        const id = oid();
        await batch({
            upserts: [
                {
                    _id: id,
                    type: 'text',
                    position: { x: 5, y: 6 },
                    size: { width: 240, height: 200 },
                },
            ],
        }).expect(200);

        const tile = await Tile.findById(id);
        expect(tile).not.toBeNull();
        expect(tile!.boardId.toString()).toBe(boardId);
        expect(tile!.position).toMatchObject({ x: 5, y: 6 });
    });

    it('deletes a whole multi-selection — the ghost tile case', async () => {
        const ids = [await seedTile(), await seedTile(), await seedTile()];

        await batch({ deletes: ids }).expect(200);

        expect(await Tile.countDocuments({ boardId })).toBe(0);
    });

    it('restores a deleted tile under its original id, as undo does', async () => {
        const id = await seedTile({ position: { x: 42, y: 42 } });
        await batch({ deletes: [id] }).expect(200);
        expect(await Tile.findById(id)).toBeNull();

        await batch({
            upserts: [
                {
                    _id: id,
                    type: 'text',
                    position: { x: 42, y: 42 },
                    size: { width: 240, height: 200 },
                },
            ],
        }).expect(200);

        const restored = await Tile.findById(id);
        expect(restored).not.toBeNull();
        expect(restored!.position).toMatchObject({ x: 42, y: 42 });
    });

    it('applies upserts, patches and deletes in one call', async () => {
        const keep = await seedTile({ position: { x: 1, y: 1 } });
        const remove = await seedTile();
        const create = oid();

        const response = await batch({
            upserts: [
                {
                    _id: create,
                    type: 'image',
                    position: { x: 9, y: 9 },
                    size: { width: 100, height: 100 },
                },
            ],
            patches: [{ id: keep, changes: { zIndex: 7 } }],
            deletes: [remove],
        }).expect(200);

        expect(response.body.tileCount).toBe(2);
        expect(await Tile.findById(remove)).toBeNull();
        expect((await Tile.findById(keep))!.zIndex).toBe(7);
        expect(await Tile.findById(create)).not.toBeNull();
    });

    it('keeps tileCount accurate across creates and deletes', async () => {
        const a = await seedTile();
        await seedTile();

        let response = await batch({ deletes: [a] }).expect(200);
        expect(response.body.tileCount).toBe(1);

        response = await batch({
            upserts: [
                {
                    _id: oid(),
                    type: 'text',
                    position: { x: 0, y: 0 },
                    size: { width: 10, height: 10 },
                },
                {
                    _id: oid(),
                    type: 'text',
                    position: { x: 0, y: 0 },
                    size: { width: 10, height: 10 },
                },
            ],
        }).expect(200);
        expect(response.body.tileCount).toBe(3);

        const board = await Board.findById(boardId);
        expect(board!.tileCount).toBe(3);
    });

    it('leaves unrelated tiles alone', async () => {
        const target = await seedTile();
        const bystander = await seedTile({ position: { x: 77, y: 88 } });

        await batch({
            patches: [{ id: target, changes: { position: { x: 0, y: 0 } } }],
        }).expect(200);

        const untouched = await Tile.findById(bystander);
        expect(untouched!.position).toMatchObject({ x: 77, y: 88 });
    });
});
