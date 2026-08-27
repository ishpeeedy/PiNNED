import { describe, it, expect } from 'vitest';
import {
    IDENTITY_VIEWPORT,
    MAX_ZOOM,
    MIN_ZOOM,
    centerOn,
    clampZoom,
    panToPlace,
    rectCenter,
    screenToWorld,
    worldToScreen,
    zoomAt,
    zoomAtCenter,
    type Viewport,
} from './viewport';

const panned: Viewport = { pan: { x: 120, y: -40 }, zoom: 1 };
const zoomed: Viewport = { pan: { x: 120, y: -40 }, zoom: 0.5 };

describe('clampZoom', () => {
    it('keeps in-range values untouched', () => {
        expect(clampZoom(1)).toBe(1);
        expect(clampZoom(0.75)).toBe(0.75);
    });

    it('clamps to the supported range', () => {
        expect(clampZoom(0.01)).toBe(MIN_ZOOM);
        expect(clampZoom(99)).toBe(MAX_ZOOM);
    });

    it('falls back to 1 for non-finite input', () => {
        expect(clampZoom(NaN)).toBe(1);
        expect(clampZoom(Infinity)).toBe(1);
    });
});

describe('screenToWorld / worldToScreen', () => {
    it('are identity at the default viewport', () => {
        const p = { x: 37, y: 91 };
        expect(screenToWorld(p, IDENTITY_VIEWPORT)).toEqual(p);
        expect(worldToScreen(p, IDENTITY_VIEWPORT)).toEqual(p);
    });

    it('accounts for pan', () => {
        expect(screenToWorld({ x: 120, y: -40 }, panned)).toEqual({
            x: 0,
            y: 0,
        });
        expect(worldToScreen({ x: 0, y: 0 }, panned)).toEqual({
            x: 120,
            y: -40,
        });
    });

    it('accounts for zoom', () => {
        // world 100 -> 100*0.5 + 120 = 170
        expect(worldToScreen({ x: 100, y: 100 }, zoomed)).toEqual({
            x: 170,
            y: 10,
        });
    });

    it('round-trips for arbitrary viewports', () => {
        const viewports: Viewport[] = [
            IDENTITY_VIEWPORT,
            panned,
            zoomed,
            { pan: { x: -333.5, y: 77.25 }, zoom: 1.75 },
        ];
        for (const viewport of viewports) {
            for (const point of [
                { x: 0, y: 0 },
                { x: 12.5, y: -900 },
                { x: 4000, y: 3000 },
            ]) {
                const round = screenToWorld(
                    worldToScreen(point, viewport),
                    viewport
                );
                expect(round.x).toBeCloseTo(point.x, 9);
                expect(round.y).toBeCloseTo(point.y, 9);
            }
        }
    });
});

describe('panToPlace', () => {
    it('produces a pan that lands the world point on the screen point', () => {
        const world = { x: 250, y: 400 };
        const target = { x: 640, y: 360 };
        const zoom = 1.5;

        const pan = panToPlace(world, target, zoom);

        expect(worldToScreen(world, { pan, zoom })).toEqual(target);
    });
});

describe('zoomAt', () => {
    it('holds the anchor point stationary', () => {
        const anchor = { x: 800, y: 450 };
        const before = screenToWorld(anchor, zoomed);

        const next = zoomAt(zoomed, 2, anchor);
        const after = screenToWorld(anchor, next);

        expect(after.x).toBeCloseTo(before.x, 9);
        expect(after.y).toBeCloseTo(before.y, 9);
    });

    it('holds the anchor across a sequence of zooms', () => {
        const anchor = { x: 512, y: 288 };
        const origin = screenToWorld(anchor, IDENTITY_VIEWPORT);

        let viewport = IDENTITY_VIEWPORT;
        for (const step of [1.25, 1.5, 0.75, 0.5, 2, 0.25]) {
            viewport = zoomAt(viewport, step, anchor);
            const world = screenToWorld(anchor, viewport);
            expect(world.x).toBeCloseTo(origin.x, 6);
            expect(world.y).toBeCloseTo(origin.y, 6);
        }
    });

    it('clamps the resulting zoom', () => {
        expect(zoomAt(IDENTITY_VIEWPORT, 50, { x: 0, y: 0 }).zoom).toBe(
            MAX_ZOOM
        );
        expect(zoomAt(IDENTITY_VIEWPORT, 0, { x: 0, y: 0 }).zoom).toBe(
            MIN_ZOOM
        );
    });

    it('does not move the board when the anchor is the origin at zero pan', () => {
        const next = zoomAt(IDENTITY_VIEWPORT, 2, { x: 0, y: 0 });
        expect(next.pan).toEqual({ x: 0, y: 0 });
    });
});

describe('zoomAtCenter', () => {
    it('holds the viewport centre stationary', () => {
        const size = { width: 1024, height: 768 };
        const center = { x: 512, y: 384 };
        const before = screenToWorld(center, zoomed);

        const next = zoomAtCenter(zoomed, 1.5, size);
        const after = screenToWorld(center, next);

        expect(after.x).toBeCloseTo(before.x, 9);
        expect(after.y).toBeCloseTo(before.y, 9);
    });
});

describe('centerOn', () => {
    it('puts the world point at the middle of the viewport', () => {
        const size = { width: 1000, height: 600 };
        const world = { x: 4000, y: 3000 };
        const zoom = 0.5;

        const pan = centerOn(world, size, zoom);

        expect(worldToScreen(world, { pan, zoom })).toEqual({
            x: 500,
            y: 300,
        });
    });
});

describe('rectCenter', () => {
    it('returns the middle of a tile', () => {
        expect(
            rectCenter({ x: 100, y: 200 }, { width: 240, height: 200 })
        ).toEqual({ x: 220, y: 300 });
    });
});
