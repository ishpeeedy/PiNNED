import { getEmbedding } from '../config/gemini.ts';
import type { ITile } from '../models/tile.ts';

const TEXT_FIELDS = [
    'header',
    'text',
    'caption',
    'linkTitle',
    'linkDescription',
    'author',
] as const;

export function buildTileText(tile: ITile): string {
    const d = tile.data || {};
    return TEXT_FIELDS.map((f) => d[f])
        .filter(Boolean)
        .join(' ')
        .trim();
}

export async function generateAndSaveEmbedding(tile: ITile): Promise<void> {
    try {
        const text = buildTileText(tile);
        if (!text) return;
        const embedding = await getEmbedding(text);
        tile.embedding = embedding;
        await tile.save();
    } catch (err) {
        console.error('Embedding generation failed:', err);
    }
}

// Per-tile debounce: cancels any pending embedding request for the same tile
// and schedules a fresh one after `delay` ms of inactivity.
const pendingEmbeddings = new Map<string, ReturnType<typeof setTimeout>>();

export function debouncedGenerateAndSaveEmbedding(
    tile: ITile,
    delay = 5000
): void {
    const tileId = tile._id.toString();
    const existing = pendingEmbeddings.get(tileId);
    if (existing) clearTimeout(existing);
    const handle = setTimeout(() => {
        pendingEmbeddings.delete(tileId);
        generateAndSaveEmbedding(tile).catch(() => {});
    }, delay);
    pendingEmbeddings.set(tileId, handle);
}
