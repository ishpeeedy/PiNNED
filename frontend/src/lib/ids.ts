/**
 * Client-side generation of MongoDB ObjectId-compatible identifiers.
 *
 * Letting the client mint tile IDs solves three problems:
 *
 *   1. Undoing a delete used to recreate the tile server-side, which assigned a
 *      brand-new _id. Every reference to the old ID — selection, history
 *      entries, in-flight requests — silently broke.
 *   2. A newly created tile is interactive immediately, rather than only once
 *      the server has replied with its ID.
 *   3. Duplicating N tiles becomes one batch request instead of N.
 *
 * Layout matches the ObjectId spec so Mongo accepts them as _id values:
 *   4-byte timestamp (seconds) | 5-byte per-process random | 3-byte counter
 */

const HEX = '0123456789abcdef';

function toHex(value: number, bytes: number): string {
    let out = '';
    for (let i = bytes * 2 - 1; i >= 0; i--) {
        out += HEX[(value >>> (i * 4)) & 0xf];
    }
    return out;
}

function randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
}

// Stable for the lifetime of the page, per the ObjectId spec.
const PROCESS_RANDOM = Array.from(randomBytes(5))
    .map((byte) => toHex(byte, 1))
    .join('');

// Random starting point so two tabs opened in the same second don't collide.
let counter = new DataView(randomBytes(4).buffer).getUint32(0) & 0xffffff;

export function createObjectId(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    counter = (counter + 1) & 0xffffff;
    return toHex(timestamp, 4) + PROCESS_RANDOM + toHex(counter, 3);
}

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/;

export function isObjectId(value: string): boolean {
    return OBJECT_ID_PATTERN.test(value);
}
