/**
 * Command-based undo/redo.
 *
 * The previous design snapshotted the whole tile array before every change,
 * then reconciled that array against the server on undo — roughly 60 sequential
 * requests to undo a delete on a 30-tile board.
 *
 * Here an entry stores only what changed plus how to reverse it, so undo is a
 * local state update plus a single batch request, and a 40-tile group drag is
 * one entry rather than forty.
 *
 * Constraint worth knowing: a patch replaces whole top-level fields
 * (`position`, `size`, `style`, `data`), never individual keys inside them.
 * That is what makes the inverse a straight capture of the previous value.
 */

import type { Tile } from '@/types';

export const HISTORY_LIMIT = 50;

/** The tile fields a command may change. Mirrors the server's whitelist. */
export type TilePatch = Partial<
    Pick<Tile, 'position' | 'size' | 'style' | 'data' | 'zIndex'>
>;

export type TileOp =
    /**
     * `index` is where the tile sat before it was removed. Restoring it there
     * makes undo an exact inverse rather than an approximate one; without it a
     * deleted tile reappears at the end of the array.
     */
    | { kind: 'upsert'; tile: Tile; index?: number }
    | { kind: 'patch'; id: string; changes: TilePatch }
    | { kind: 'remove'; id: string };

export interface Command {
    label: string;
    do: TileOp[];
    undo: TileOp[];
}

export interface History {
    entries: Command[];
    /** Index of the last applied command. -1 means nothing has been applied. */
    index: number;
}

export const emptyHistory: History = { entries: [], index: -1 };

// ---------------------------------------------------------------------------
// Applying operations
// ---------------------------------------------------------------------------

export function applyOps(tiles: Tile[], ops: TileOp[]): Tile[] {
    let next = tiles;

    for (const op of ops) {
        switch (op.kind) {
            case 'upsert': {
                const existing = next.findIndex((t) => t._id === op.tile._id);
                if (existing !== -1) {
                    next = next.map((tile, i) =>
                        i === existing ? op.tile : tile
                    );
                } else if (op.index === undefined) {
                    next = [...next, op.tile];
                } else {
                    const at = Math.max(0, Math.min(op.index, next.length));
                    next = [...next.slice(0, at), op.tile, ...next.slice(at)];
                }
                break;
            }
            case 'patch': {
                next = next.map((tile) =>
                    tile._id === op.id ? { ...tile, ...op.changes } : tile
                );
                break;
            }
            case 'remove': {
                next = next.filter((tile) => tile._id !== op.id);
                break;
            }
        }
    }

    return next;
}

// ---------------------------------------------------------------------------
// Building commands
// ---------------------------------------------------------------------------

/** Capture the current value of exactly the keys a patch is about to change. */
function inverseOf(tile: Tile, changes: TilePatch): TilePatch {
    const previous: TilePatch = {};
    for (const key of Object.keys(changes) as (keyof TilePatch)[]) {
        // Deliberately assigns undefined when the tile lacks the key, so
        // applying the inverse restores the exact prior shape.
        (previous as Record<string, unknown>)[key] = tile[key];
    }
    return previous;
}

export function patchCommand(
    label: string,
    tiles: Tile[],
    patches: { id: string; changes: TilePatch }[]
): Command {
    const dos: TileOp[] = [];
    const undos: TileOp[] = [];

    for (const patch of patches) {
        const tile = tiles.find((t) => t._id === patch.id);
        if (!tile) continue; // nothing to reverse to
        dos.push({ kind: 'patch', id: patch.id, changes: patch.changes });
        undos.push({
            kind: 'patch',
            id: patch.id,
            changes: inverseOf(tile, patch.changes),
        });
    }

    return { label, do: dos, undo: undos };
}

export function createCommand(label: string, created: Tile[]): Command {
    return {
        label,
        do: created.map((tile) => ({ kind: 'upsert', tile })),
        undo: created.map((tile) => ({ kind: 'remove', id: tile._id })),
    };
}

export function deleteCommand(
    label: string,
    tiles: Tile[],
    ids: string[]
): Command {
    const removed = ids
        .map((id) => ({
            tile: tiles.find((t) => t._id === id),
            index: tiles.findIndex((t) => t._id === id),
        }))
        .filter(
            (entry): entry is { tile: Tile; index: number } =>
                Boolean(entry.tile) && entry.index !== -1
        );

    return {
        label,
        do: removed.map(({ tile }) => ({ kind: 'remove', id: tile._id })),
        // Restores the full body at its original slot, so the tile comes back
        // with the same ID and the same ordering.
        undo: removed
            .slice()
            // Ascending, so earlier insertions do not shift later indices.
            .sort((l, r) => l.index - r.index)
            .map(({ tile, index }) => ({ kind: 'upsert', tile, index })),
    };
}

// ---------------------------------------------------------------------------
// The stack
// ---------------------------------------------------------------------------

export function isEmptyCommand(command: Command): boolean {
    return command.do.length === 0;
}

export function push(
    history: History,
    command: Command,
    limit = HISTORY_LIMIT
): History {
    // A command that changes nothing must not consume an undo step.
    if (isEmptyCommand(command)) return history;

    // Anything after the cursor is a redo branch the new command discards.
    const kept = history.entries.slice(0, history.index + 1);
    kept.push(command);

    const entries =
        kept.length > limit ? kept.slice(kept.length - limit) : kept;

    // The cursor always sits on the newest entry after a push, so it cannot
    // drift out of sync when the stack is trimmed.
    return { entries, index: entries.length - 1 };
}

export function canUndo(history: History): boolean {
    return history.index >= 0;
}

export function canRedo(history: History): boolean {
    return history.index < history.entries.length - 1;
}

export interface HistoryStep {
    history: History;
    ops: TileOp[];
    label: string;
}

export function undo(history: History): HistoryStep | null {
    if (!canUndo(history)) return null;
    const command = history.entries[history.index];
    return {
        history: { entries: history.entries, index: history.index - 1 },
        ops: command.undo,
        label: command.label,
    };
}

export function redo(history: History): HistoryStep | null {
    if (!canRedo(history)) return null;
    const command = history.entries[history.index + 1];
    return {
        history: { entries: history.entries, index: history.index + 1 },
        ops: command.do,
        label: command.label,
    };
}
