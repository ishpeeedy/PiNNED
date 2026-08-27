import { describe, it, expect } from 'vitest';
import type { Tile } from '@/types';
import {
    HISTORY_LIMIT,
    applyOps,
    canRedo,
    canUndo,
    createCommand,
    deleteCommand,
    emptyHistory,
    patchCommand,
    push,
    redo,
    undo,
    type Command,
    type History,
} from './history';

function makeTile(id: string, overrides: Partial<Tile> = {}): Tile {
    return {
        _id: id,
        boardId: 'board1',
        type: 'text',
        position: { x: 0, y: 0 },
        size: { width: 240, height: 200 },
        style: { backgroundColor: '#FBBF24', textColor: '#000000' },
        data: {},
        zIndex: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

const a = makeTile('a', { position: { x: 10, y: 10 } });
const b = makeTile('b', { position: { x: 20, y: 20 } });
const c = makeTile('c', { position: { x: 30, y: 30 } });
const board = [a, b, c];

/** Run a command forwards then backwards; the board must be unchanged. */
function roundTrip(tiles: Tile[], command: Command): Tile[] {
    const after = applyOps(tiles, command.do);
    return applyOps(after, command.undo);
}

describe('applyOps', () => {
    it('patches a tile without touching others', () => {
        const next = applyOps(board, [
            { kind: 'patch', id: 'b', changes: { position: { x: 99, y: 99 } } },
        ]);
        expect(next.find((t) => t._id === 'b')!.position).toEqual({
            x: 99,
            y: 99,
        });
        expect(next.find((t) => t._id === 'a')!.position).toEqual({
            x: 10,
            y: 10,
        });
        expect(next).toHaveLength(3);
    });

    it('does not mutate the input array', () => {
        const snapshot = JSON.parse(JSON.stringify(board));
        applyOps(board, [{ kind: 'remove', id: 'a' }]);
        expect(board).toEqual(snapshot);
    });

    it('upsert appends when the id is new and replaces when it exists', () => {
        const d = makeTile('d');
        expect(applyOps(board, [{ kind: 'upsert', tile: d }])).toHaveLength(4);

        const replaced = applyOps(board, [
            { kind: 'upsert', tile: makeTile('b', { zIndex: 42 }) },
        ]);
        expect(replaced).toHaveLength(3);
        expect(replaced.find((t) => t._id === 'b')!.zIndex).toBe(42);
    });

    it('applies a sequence in order', () => {
        const next = applyOps(board, [
            { kind: 'remove', id: 'a' },
            { kind: 'patch', id: 'b', changes: { zIndex: 7 } },
            { kind: 'upsert', tile: makeTile('z') },
        ]);
        expect(next.map((t) => t._id)).toEqual(['b', 'c', 'z']);
        expect(next[0].zIndex).toBe(7);
    });

    it('ignores patches and removes for unknown ids', () => {
        expect(
            applyOps(board, [
                { kind: 'patch', id: 'nope', changes: { zIndex: 5 } },
                { kind: 'remove', id: 'also-nope' },
            ])
        ).toHaveLength(3);
    });
});

describe('patchCommand', () => {
    it('round-trips a single move', () => {
        const command = patchCommand('Move', board, [
            { id: 'a', changes: { position: { x: 500, y: 600 } } },
        ]);
        expect(roundTrip(board, command)).toEqual(board);
    });

    it('round-trips a group move — the 40-tile drag case', () => {
        const many = Array.from({ length: 40 }, (_, i) =>
            makeTile(`t${i}`, { position: { x: i, y: i } })
        );
        const command = patchCommand(
            'Move 40',
            many,
            many.map((tile) => ({
                id: tile._id,
                changes: {
                    position: { x: tile.position.x + 250, y: tile.position.y },
                },
            }))
        );

        const moved = applyOps(many, command.do);
        expect(moved[7].position).toEqual({ x: 257, y: 7 });
        expect(applyOps(moved, command.undo)).toEqual(many);
    });

    it('round-trips style and data changes', () => {
        const withData = [
            makeTile('a', { data: { header: 'original', text: 'body' } }),
        ];
        const command = patchCommand('Edit', withData, [
            { id: 'a', changes: { data: { header: 'changed' } } },
        ]);
        expect(roundTrip(withData, command)).toEqual(withData);
    });

    it('skips patches for tiles that no longer exist', () => {
        const command = patchCommand('Move', board, [
            { id: 'ghost', changes: { zIndex: 3 } },
        ]);
        expect(command.do).toHaveLength(0);
        expect(command.undo).toHaveLength(0);
    });
});

describe('createCommand / deleteCommand', () => {
    it('create round-trips back to nothing', () => {
        const fresh = makeTile('new');
        const command = createCommand('Create', [fresh]);
        expect(applyOps(board, command.do)).toHaveLength(4);
        expect(roundTrip(board, command)).toEqual(board);
    });

    it('delete round-trips and preserves the original id', () => {
        const command = deleteCommand('Delete', board, ['a', 'c']);
        const after = applyOps(board, command.do);
        expect(after.map((t) => t._id)).toEqual(['b']);

        const restored = applyOps(after, command.undo);
        expect(restored.map((t) => t._id).sort()).toEqual(['a', 'b', 'c']);
        expect(restored.find((t) => t._id === 'a')).toEqual(a);
    });

    it('deleting a multi-selection removes every tile — the ghost tile bug', () => {
        const command = deleteCommand('Delete 3', board, ['a', 'b', 'c']);
        expect(applyOps(board, command.do)).toEqual([]);
    });

    it('ignores ids that are not on the board', () => {
        const command = deleteCommand('Delete', board, ['a', 'missing']);
        expect(command.do).toHaveLength(1);
    });

    it('restores deleted tiles to their original slot, not the end', () => {
        const command = deleteCommand('Delete b', board, ['b']);
        const restored = roundTrip(board, command);
        expect(restored.map((t) => t._id)).toEqual(['a', 'b', 'c']);
        expect(restored).toEqual(board);
    });

    it('restores a non-contiguous multi-delete in the right order', () => {
        const command = deleteCommand('Delete a and c', board, ['a', 'c']);
        const restored = roundTrip(board, command);
        expect(restored.map((t) => t._id)).toEqual(['a', 'b', 'c']);
    });
});

describe('history stack', () => {
    const move = (id: string, x: number) =>
        patchCommand(`Move ${id}`, board, [
            { id, changes: { position: { x, y: 0 } } },
        ]);

    it('starts empty', () => {
        expect(canUndo(emptyHistory)).toBe(false);
        expect(canRedo(emptyHistory)).toBe(false);
        expect(undo(emptyHistory)).toBeNull();
        expect(redo(emptyHistory)).toBeNull();
    });

    it('tracks undo and redo availability', () => {
        const h = push(emptyHistory, move('a', 1));
        expect(canUndo(h)).toBe(true);
        expect(canRedo(h)).toBe(false);

        const undone = undo(h)!.history;
        expect(canUndo(undone)).toBe(false);
        expect(canRedo(undone)).toBe(true);
    });

    it('does not record a command that changes nothing', () => {
        const noop = patchCommand('Noop', board, []);
        expect(push(emptyHistory, noop)).toBe(emptyHistory);
    });

    it('discards the redo branch when a new command is pushed', () => {
        let h: History = push(emptyHistory, move('a', 1));
        h = push(h, move('b', 2));
        h = undo(h)!.history;
        expect(canRedo(h)).toBe(true);

        h = push(h, move('c', 3));
        expect(canRedo(h)).toBe(false);
        expect(h.entries).toHaveLength(2);
        expect(h.entries[1].label).toBe('Move c');
    });

    it('keeps the cursor on the newest entry once the limit is reached', () => {
        let h: History = emptyHistory;
        for (let i = 0; i < HISTORY_LIMIT + 25; i++) {
            h = push(h, move('a', i));
        }
        expect(h.entries).toHaveLength(HISTORY_LIMIT);
        expect(h.index).toBe(HISTORY_LIMIT - 1);
        expect(h.entries[h.index].label).toBe('Move a');
        // Still fully navigable rather than desynced.
        expect(canUndo(h)).toBe(true);
        expect(canRedo(h)).toBe(false);
    });

    it('survives a long undo/redo run and returns to the same board', () => {
        const commands = [
            patchCommand('Move a', board, [
                { id: 'a', changes: { position: { x: 111, y: 0 } } },
            ]),
            deleteCommand('Delete b', board, ['b']),
            createCommand('Create d', [makeTile('d')]),
        ];

        let history: History = emptyHistory;
        let tiles = board;
        for (const command of commands) {
            tiles = applyOps(tiles, command.do);
            history = push(history, command);
        }
        const applied = tiles;

        // Unwind everything.
        for (let i = 0; i < commands.length; i++) {
            const step = undo(history)!;
            tiles = applyOps(tiles, step.ops);
            history = step.history;
        }
        expect(tiles).toEqual(board);
        expect(canUndo(history)).toBe(false);

        // Replay everything.
        for (let i = 0; i < commands.length; i++) {
            const step = redo(history)!;
            tiles = applyOps(tiles, step.ops);
            history = step.history;
        }
        expect(tiles).toEqual(applied);
        expect(canRedo(history)).toBe(false);
    });

    it('handles 60 consecutive operations undone and redone cleanly', () => {
        let history: History = emptyHistory;
        let tiles = board;
        const states: Tile[][] = [tiles];

        for (let i = 0; i < 60; i++) {
            const command = patchCommand(`Move ${i}`, tiles, [
                { id: 'a', changes: { position: { x: i, y: i } } },
            ]);
            tiles = applyOps(tiles, command.do);
            history = push(history, command);
            states.push(tiles);
        }

        // Only the most recent HISTORY_LIMIT commands remain reversible.
        let steps = 0;
        while (canUndo(history)) {
            const step = undo(history)!;
            tiles = applyOps(tiles, step.ops);
            history = step.history;
            steps++;
        }
        expect(steps).toBe(HISTORY_LIMIT);
        expect(tiles).toEqual(states[60 - HISTORY_LIMIT]);
    });
});
