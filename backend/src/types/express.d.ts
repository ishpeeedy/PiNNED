import type { IBoard } from '../models/board.ts';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
            /** Set by the `loadBoard` middleware once ownership is confirmed. */
            board?: IBoard;
        }
    }
}

export {};
