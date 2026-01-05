import express, { Request, Response } from 'express';
import Tile from '../models/tile.ts';
import Board from '../models/board.ts';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// GET /api/boards/:boardId/tiles - Get all tiles for a board
router.get('/boards/:boardid/tiles', async (req: Request, res: Response) => {
    try {
        const { boardId } = req.params;
        const board = await Board.findById(boardId);
        if (!boardId) {
            return res.status(404).json({ message: 'Board not found' });
        }
        if (board?.userId.toString() !== req.user?.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const tiles = await Tile.find({ boardId });
        return res.json(tiles);
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/boards/:boardId/tiles/:id - Get single tile
router.get('/board/:boardId/tiles/:id', async (req: Request, res: Response) => {
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
});

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
            Object.assign(tile, updates);
            await tile.save();
            return res.json(tile);
        } catch (error) {
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
            await Tile.findByIdAndDelete(id);
            return res.json({ message: 'Tile deleted successfully' });
        } catch (error) {
            return res.status(500).json({ message: 'internal server error' });
        }
    }
);
export default router;
