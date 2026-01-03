import express, { Response } from 'express';
import Board from '../models/board.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// GET / (all boards)
// GET /:id (single board)
// POST / (create)
// PATCH /:id (update)
// DELETE /:id (delete)

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const boards = await Board.find({ userId: req.user?.userId });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get(
    '/:id',
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const board = await Board.findById(req.params.id);
            if (!board) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }
            if (board.userId.toString() !== req.user?.userId) {
                res.status(403).json({ message: 'You are not authorised' });
                return;
            }
            res.json(board);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, icon, settings } = req.body;
        if (!title) {
            res.status(400).json({ message: 'Title is required' });
            return;
        }
        const newBoard = new Board({
            userId: req.user?.userId,
            title,
            description,
            icon,
            settings,
        });
        await newBoard.save();
        res.status(201).json(newBoard);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch(
    '/:id',
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { title, description, icon, settings } = req.body;
            const board = await Board.findById(req.params.id);
            if (!board) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }
            if (board.userId.toString() !== req.user?.userId) {
                res.status(403).json({ message: 'Not authorised' });
                return;
            }
            if (title !== undefined) board.title = title;
            if (description !== undefined) board.description = description;
            if (icon !== undefined) board.icon = icon;
            if (settings !== undefined) board.settings = settings;
            await board.save();
            res.json(board);
        } catch (error) {
            res.status(500).json({ message: 'server error' });
        }
    }
);

router.delete(
    '/:id',
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const board = await Board.findById(req.params.id);

            if (!board) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }

            if (board.userId.toString() !== req.user?.userId) {
                res.status(403).json({ message: 'Not authorised' });
                return;
            }

            await Board.findByIdAndDelete(req.params.id);

            res.json({ message: 'Board deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);
export default router;
