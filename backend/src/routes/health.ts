import { Router, Request, Response } from 'express';

const healthRoutes = Router();

function setNoCacheHeaders(res: Response) {
    res.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
}

healthRoutes.get(['/health', '/api/health'], (_req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.status(200).json({
        ok: true,
        service: 'PiNNED Backend',
        timestamp: new Date().toISOString(),
    });
});

healthRoutes.head(
    ['/health', '/api/health'],
    (_req: Request, res: Response) => {
        setNoCacheHeaders(res);
        res.sendStatus(200);
    }
);

export default healthRoutes;
