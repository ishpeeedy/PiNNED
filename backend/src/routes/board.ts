import express, { Request, Response } from 'express';
import Board from '../models/board.ts';
import Tile from '../models/tile.ts';
import {
    collectPublicIds,
    destroyPublicIds,
} from '../services/cloudinaryCleanup.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { loadBoard } from '../middleware/board.ts';

const router = express.Router();

router.use(authenticateToken);

// Routes below with an :id param have their board loaded and ownership checked
// by `loadBoard`, which attaches it as req.board.
const withBoard = loadBoard('id');

// GET / (all boards)
router.get('/', async (req: Request, res: Response) => {
    try {
        const boards = await Board.find({ userId: req.user?.userId });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST / (create)
router.post('/', async (req: Request, res: Response) => {
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

// GET /:id (single board)
router.get('/:id', withBoard, (req: Request, res: Response) => {
    res.json(req.board);
});

// PATCH /:id (update)
router.patch('/:id', withBoard, async (req: Request, res: Response) => {
    try {
        const board = req.board!;
        const { title, description, icon, settings } = req.body;
        if (title !== undefined) board.title = title;
        if (description !== undefined) board.description = description;
        if (icon !== undefined) board.icon = icon;
        if (settings !== undefined) board.settings = settings;
        await board.save();
        res.json(board);
    } catch (error) {
        res.status(500).json({ message: 'server error' });
    }
});

// DELETE /:id (delete)
router.delete('/:id', withBoard, async (req: Request, res: Response) => {
    try {
        const boardId = req.params.id;

        // Cascade: a board's tiles are meaningless without it, and their
        // Cloudinary uploads would otherwise be billed forever.
        await destroyPublicIds(await collectPublicIds({ boardId }));
        await Tile.deleteMany({ boardId });
        await Board.findByIdAndDelete(boardId);

        res.json({ message: 'Board deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
