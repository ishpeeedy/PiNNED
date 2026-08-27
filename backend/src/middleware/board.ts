import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Board from '../models/board.ts';

/**
 * Loads the board named by a route param and asserts the caller owns it,
 * attaching it as `req.board`.
 *
 * This check was previously copy-pasted into ten handlers, one of which had
 * drifted to a loose `!=` comparison. Centralising it means a new route cannot
 * accidentally ship without an ownership check — it either has the middleware
 * or it has no board.
 */
export function loadBoard(param = 'boardId') {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const boardId = req.params[param];

            // A malformed id cannot name a real board. Answering 404 rather
            // than letting the CastError become a 500 also avoids confirming
            // which id shapes exist.
            if (!mongoose.Types.ObjectId.isValid(boardId)) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }

            const board = await Board.findById(boardId);
            if (!board) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }
            if (board.userId.toString() !== req.user?.userId) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }

            req.board = board;
            next();
        } catch (error) {
            next(error);
        }
    };
}
