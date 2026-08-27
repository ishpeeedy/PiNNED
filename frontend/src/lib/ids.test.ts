import { describe, it, expect } from 'vitest';
import { createObjectId, isObjectId } from './ids';

describe('createObjectId', () => {
    it('produces a 24-character lowercase hex string', () => {
        const id = createObjectId();
        expect(id).toHaveLength(24);
        expect(isObjectId(id)).toBe(true);
    });

    it('never collides across a large batch', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 50_000; i++) ids.add(createObjectId());
        expect(ids.size).toBe(50_000);
    });

    it('encodes the current time in the leading 4 bytes', () => {
        const before = Math.floor(Date.now() / 1000);
        const stamp = parseInt(createObjectId().slice(0, 8), 16);
        const after = Math.floor(Date.now() / 1000);
        expect(stamp).toBeGreaterThanOrEqual(before);
        expect(stamp).toBeLessThanOrEqual(after);
    });

    it('shares a process-random section across ids from the same page', () => {
        expect(createObjectId().slice(8, 18)).toBe(
            createObjectId().slice(8, 18)
        );
    });

    it('wraps the counter without producing an invalid id', () => {
        for (let i = 0; i < 1000; i++) {
            expect(isObjectId(createObjectId())).toBe(true);
        }
    });
});

describe('isObjectId', () => {
    it('rejects malformed values', () => {
        expect(isObjectId('')).toBe(false);
        expect(isObjectId('xyz')).toBe(false);
        expect(isObjectId('A'.repeat(24))).toBe(false); // uppercase
        expect(isObjectId('a'.repeat(23))).toBe(false);
        expect(isObjectId('a'.repeat(25))).toBe(false);
    });

    it('accepts a real ObjectId', () => {
        expect(isObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });
});
