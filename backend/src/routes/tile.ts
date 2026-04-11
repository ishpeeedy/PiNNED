import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Tile from '../models/tile.ts';
import Board from '../models/board.ts';
import { authenticateToken } from '../middleware/auth';
import cloudinary from '../config/cloudinary';
import { getEmbedding } from '../config/gemini.ts';
import {
    generateAndSaveEmbedding,
    debouncedGenerateAndSaveEmbedding,
} from '../services/embedding.ts';

const router = express.Router();

router.use(authenticateToken);

// GET /api/boards/:boardId/tiles/search - Semantic search tiles
router.get(
    '/boards/:boardId/tiles/search',
    async (req: Request, res: Response) => {
        try {
            const { boardId } = req.params;
            const q = req.query.q as string;
            if (!q || q.trim().length < 2) {
                return res
                    .status(400)
                    .json({ message: 'Query must be at least 2 characters' });
            }
            const board = await Board.findById(boardId);
            if (!board) {
                return res.status(404).json({ message: 'Board not found' });
            }
            if (board.userId.toString() !== req.user?.userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
            const queryVector = await getEmbedding(q.trim());
            const raw = await Tile.aggregate([
                {
                    $vectorSearch: {
                        index: 'tile_embedding_index',
                        path: 'embedding',
                        queryVector,
                        numCandidates: 100,
                        limit: 20,
                        filter: {
                            boardId: new mongoose.Types.ObjectId(boardId),
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        score: { $meta: 'vectorSearchScore' },
                    },
                },
            ]);

            const ranked = raw
                .filter(
                    (r: { _id: unknown; score: number }) =>
                        typeof r.score === 'number' && Number.isFinite(r.score)
                )
                .sort(
                    (a: { score: number }, b: { score: number }) =>
                        b.score - a.score
                );

            const topScore = ranked[0]?.score ?? 0;
            const adaptiveThreshold = Math.max(0.55, topScore * 0.82);

            let results = ranked.filter(
                (r: { _id: unknown; score: number }) =>
                    r.score >= adaptiveThreshold
            );

            // Never return empty solely due to thresholding; keep top candidates.
            if (results.length === 0 && ranked.length > 0) {
                results = ranked.slice(0, 5);
            }

            // Fallback when vectors are missing/sparse: basic text match over tile fields.
            if (results.length === 0) {
                const escaped = q
                    .trim()
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escaped, 'i');

                const textMatches = await Tile.find(
                    {
                        boardId,
                        $or: [
                            { 'data.header': regex },
                            { 'data.text': regex },
                            { 'data.caption': regex },
                            { 'data.linkTitle': regex },
                            { 'data.linkDescription': regex },
                            { 'data.author': regex },
                            { 'data.linkUrl': regex },
                        ],
                    },
                    { _id: 1 }
                )
                    .limit(20)
                    .lean();

                results = textMatches.map((t, idx) => ({
                    _id: t._id,
                    // Deterministic descending pseudo-score for UI ordering.
                    score: 0.5 - idx * 0.001,
                }));
            }

            console.log(
                `Semantic search — returned: ${results.length}, vectorRaw: ${raw.length}, topScore: ${topScore.toFixed(4)}`
            );
            return res.json({ results });
        } catch (error) {
            console.error('Semantic search error:', error);
            return res.status(500).json({ message: 'Semantic search failed' });
        }
    }
);

// GET /api/boards/:boardId/tiles - Get all tiles for a board
router.get('/boards/:boardId/tiles', async (req: Request, res: Response) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        if (board.userId.toString() !== req.user?.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const tiles = await Tile.find({ boardId });
        return res.json(tiles);
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/boards/:boardId/tiles/:id - Get single tile
router.get(
    '/boards/:boardId/tiles/:id',
    async (req: Request, res: Response) => {
        try {
            const { boardId, id } = req.params;
            const board = await Board.findById(boardId);
            if (!board) {
                return res.status(404).json({ message: 'Board not found' });
            }
            if (board.userId.toString() != req.user?.userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
            const tile = await Tile.findOne({ _id: id, boardId });
            if (!tile) {
                return res.status(404).json({ message: 'Tile not found' });
            }
            return res.json(tile);
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    }
);

// POST /api/boards/:boardId/tiles - Create new tile
router.post('/boards/:boardId/tiles', async (req: Request, res: Response) => {
    try {
        const { boardId } = req.params;
        const { type, position, size, style, data, zIndex } = req.body;
        const board = await Board.findById(boardId);
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        if (board.userId.toString() !== req.user?.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        if (!type || !['text', 'image', 'link'].includes(type)) {
            return res.status(400).json({ message: 'invalid tile type' });
        }
        const tile = new Tile({
            boardId,
            type,
            position,
            size,
            style,
            data,
            zIndex,
        });
        await tile.save();

        // Fire-and-forget embedding generation
        generateAndSaveEmbedding(tile).catch(() => {});

        // Update board's updatedAt timestamp and increment tile count
        board.updatedAt = new Date();
        board.tileCount += 1;
        await board.save();

        return res.status(201).json(tile);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// PATCH /api/tiles/:id - Update tile
router.patch(
    '/boards/:boardId/tiles/:id',
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const updates = req.body;

            const tile = await Tile.findById(id);
            if (!tile) {
                return res.status(404).json({ message: 'Tile not found' });
            }
            const board = await Board.findById(tile.boardId);
            if (!board || board.userId.toString() !== req.user?.userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
            delete updates.boardId;

            const updatedTile = await Tile.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: false }
            );

            // Re-embed if any text field changed (debounced — waits 5s of
            // inactivity so rapid edits don't burn the daily quota)
            const textFields = [
                'header',
                'text',
                'caption',
                'linkTitle',
                'linkDescription',
                'author',
            ];
            if (updates.data && textFields.some((f) => f in updates.data)) {
                debouncedGenerateAndSaveEmbedding(updatedTile!);
            }

            // Update board's updatedAt timestamp
            board.updatedAt = new Date();
            await board.save();

            return res.json(updatedTile);
        } catch (error) {
            console.error('Failed to update tile:', error);
            return res.status(500).json({ message: 'internal server error' });
        }
    }
);

// DELETE /api/tiles/:id - Delete tile
router.delete(
    '/boards/:boardId/tiles/:id',
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const tile = await Tile.findById(id);
            if (!tile) {
                return res.status(404).json({ message: 'tile not found' });
            }
            const board = await Board.findById(tile.boardId);
            if (!board || board.userId.toString() !== req.user?.userId) {
                return res.status(403).json({ message: 'Access denied' });
            }
            // Delete associated Cloudinary image if present
            if (tile.type === 'image' && tile.data?.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(tile.data.cloudinaryPublicId);
            }

            await Tile.findByIdAndDelete(id);

            // Update board's updatedAt timestamp and decrement tile count
            board.updatedAt = new Date();
            board.tileCount = Math.max(0, board.tileCount - 1);
            await board.save();

            return res.json({ message: 'Tile deleted successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'internal server error' });
        }
    }
);
export default router;
