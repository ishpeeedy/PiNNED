import { describe, it, expect } from 'vitest';
import {
    MAX_BATCH_OPS,
    tileBatchSchema,
    tilePatchSchema,
    tileUpsertSchema,
} from './tile.ts';

const id = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';

const validTile = {
    _id: id,
    type: 'text' as const,
    position: { x: 10, y: 20 },
    size: { width: 240, height: 200 },
};

describe('tilePatchSchema', () => {
    it('accepts the writable fields', () => {
        const result = tilePatchSchema.safeParse({
            position: { x: 1, y: 2 },
            size: { width: 100, height: 100 },
            style: { backgroundColor: '#fff' },
            data: { header: 'hi' },
            zIndex: 3,
        });
        expect(result.success).toBe(true);
    });

    it('accepts an empty patch', () => {
        expect(tilePatchSchema.safeParse({}).success).toBe(true);
    });

    // The whole point of the schema: server-owned fields must not get through.
    it.each([
        ['boardId', { boardId: otherId }],
        ['embedding', { embedding: [0.1, 0.2] }],
        ['createdAt', { createdAt: '2020-01-01' }],
        ['_id', { _id: otherId }],
        ['unknown field', { somethingElse: true }],
    ])('rejects %s', (_label, payload) => {
        expect(tilePatchSchema.safeParse(payload).success).toBe(false);
    });

    it('rejects nested unknown keys in data', () => {
        expect(tilePatchSchema.safeParse({ data: { evil: 'x' } }).success).toBe(
            false
        );
    });

    it('rejects non-finite and wrongly typed numbers', () => {
        expect(
            tilePatchSchema.safeParse({ position: { x: 'abc', y: 0 } }).success
        ).toBe(false);
        expect(
            tilePatchSchema.safeParse({ position: { x: NaN, y: 0 } }).success
        ).toBe(false);
        expect(
            tilePatchSchema.safeParse({ position: { x: Infinity, y: 0 } })
                .success
        ).toBe(false);
    });

    it('rejects non-positive sizes', () => {
        expect(
            tilePatchSchema.safeParse({ size: { width: 0, height: 10 } })
                .success
        ).toBe(false);
        expect(
            tilePatchSchema.safeParse({ size: { width: -5, height: 10 } })
                .success
        ).toBe(false);
    });

    it('bounds text length', () => {
        expect(
            tilePatchSchema.safeParse({ data: { text: 'a'.repeat(20_000) } })
                .success
        ).toBe(true);
        expect(
            tilePatchSchema.safeParse({ data: { text: 'a'.repeat(20_001) } })
                .success
        ).toBe(false);
    });
});

describe('tileUpsertSchema', () => {
    it('accepts a minimal tile', () => {
        expect(tileUpsertSchema.safeParse(validTile).success).toBe(true);
    });

    it('requires a valid ObjectId', () => {
        expect(
            tileUpsertSchema.safeParse({ ...validTile, _id: 'nope' }).success
        ).toBe(false);
        expect(
            tileUpsertSchema.safeParse({ ...validTile, _id: 'g'.repeat(24) })
                .success
        ).toBe(false);
    });

    it('requires a known tile type', () => {
        expect(
            tileUpsertSchema.safeParse({ ...validTile, type: 'video' }).success
        ).toBe(false);
    });

    it('requires position and size', () => {
        const { position, ...noPosition } = validTile;
        expect(tileUpsertSchema.safeParse(noPosition).success).toBe(false);
    });

    it('rejects a client-supplied boardId', () => {
        expect(
            tileUpsertSchema.safeParse({ ...validTile, boardId: otherId })
                .success
        ).toBe(false);
    });
});

describe('tileBatchSchema', () => {
    it('defaults the three lists so a partial body is usable', () => {
        const result = tileBatchSchema.safeParse({ deletes: [id] });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.upserts).toEqual([]);
            expect(result.data.patches).toEqual([]);
            expect(result.data.deletes).toEqual([id]);
        }
    });

    it('accepts a mixed batch', () => {
        const result = tileBatchSchema.safeParse({
            upserts: [validTile],
            patches: [{ id: otherId, changes: { zIndex: 2 } }],
            deletes: [id],
        });
        expect(result.success).toBe(true);
    });

    it('rejects an empty batch', () => {
        expect(tileBatchSchema.safeParse({}).success).toBe(false);
        expect(
            tileBatchSchema.safeParse({
                upserts: [],
                patches: [],
                deletes: [],
            }).success
        ).toBe(false);
    });

    it('accepts a batch at the size limit', () => {
        const result = tileBatchSchema.safeParse({
            deletes: Array.from({ length: MAX_BATCH_OPS }, () => id),
        });
        expect(result.success).toBe(true);
    });

    it('rejects a batch over the size limit', () => {
        const result = tileBatchSchema.safeParse({
            deletes: Array.from({ length: MAX_BATCH_OPS + 1 }, () => id),
        });
        expect(result.success).toBe(false);
    });

    it('counts the limit across all three lists', () => {
        const third = Math.ceil((MAX_BATCH_OPS + 3) / 3);
        const result = tileBatchSchema.safeParse({
            upserts: Array.from({ length: third }, () => validTile),
            patches: Array.from({ length: third }, () => ({
                id,
                changes: { zIndex: 1 },
            })),
            deletes: Array.from({ length: third }, () => id),
        });
        expect(result.success).toBe(false);
    });

    it('rejects unknown top-level keys', () => {
        expect(
            tileBatchSchema.safeParse({ deletes: [id], sneaky: true }).success
        ).toBe(false);
    });

    it('rejects malformed ids in deletes', () => {
        expect(
            tileBatchSchema.safeParse({ deletes: ['not-an-id'] }).success
        ).toBe(false);
    });
});
