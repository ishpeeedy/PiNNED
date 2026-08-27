/**
 * The canvas has two coordinate systems, and mixing them up is the single
 * biggest source of canvas bugs. Every conversion in the app goes through this
 * module — there is no inline coordinate maths anywhere else.
 *
 *   world  — a tile's true position. Unbounded, unaffected by pan/zoom.
 *            This is what lives in MongoDB.
 *   screen — pixels relative to the canvas element's top-left corner.
 *            Derive with `event.clientX - canvasRect.left`.
 *
 * The relationship, which the DOM mirrors exactly via
 * `translate(pan) > scale(zoom) > tile`:
 *
 *   screen = world * zoom + pan
 *   world  = (screen - pan) / zoom
 */

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Viewport {
    pan: Point;
    zoom: number;
}

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.25;

export const IDENTITY_VIEWPORT: Viewport = { pan: { x: 0, y: 0 }, zoom: 1 };

export function clampZoom(zoom: number): number {
    if (!Number.isFinite(zoom)) return 1;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function screenToWorld(screen: Point, viewport: Viewport): Point {
    return {
        x: (screen.x - viewport.pan.x) / viewport.zoom,
        y: (screen.y - viewport.pan.y) / viewport.zoom,
    };
}

export function worldToScreen(world: Point, viewport: Viewport): Point {
    return {
        x: world.x * viewport.zoom + viewport.pan.x,
        y: world.y * viewport.zoom + viewport.pan.y,
    };
}

/**
 * The pan that puts `world` at the screen position `atScreen`.
 * Both `zoomAt` and `centerOn` are expressed in terms of this.
 */
export function panToPlace(world: Point, atScreen: Point, zoom: number): Point {
    return {
        x: atScreen.x - world.x * zoom,
        y: atScreen.y - world.y * zoom,
    };
}

/**
 * Change zoom while keeping whatever is under `anchor` stationary.
 *
 * Without this the viewport zooms about world origin (0, 0). Since tiles are
 * nowhere near the origin, the board appears to fly off screen.
 *
 * Anchor at the cursor for wheel/pinch zoom; anchor at the viewport centre for
 * the toolbar's +/- buttons.
 */
export function zoomAt(
    viewport: Viewport,
    nextZoom: number,
    anchor: Point
): Viewport {
    const zoom = clampZoom(nextZoom);
    // Which world point is currently under the anchor...
    const world = screenToWorld(anchor, viewport);
    // ...and where must pan be for it to still be under the anchor afterwards.
    return { zoom, pan: panToPlace(world, anchor, zoom) };
}

/** Zoom about the centre of a viewport of the given size. */
export function zoomAtCenter(
    viewport: Viewport,
    nextZoom: number,
    size: Size
): Viewport {
    return zoomAt(viewport, nextZoom, {
        x: size.width / 2,
        y: size.height / 2,
    });
}

/** The pan that centres a world point in a viewport of the given size. */
export function centerOn(world: Point, size: Size, zoom: number): Point {
    return panToPlace(world, { x: size.width / 2, y: size.height / 2 }, zoom);
}

/** The world-space centre of a tile-shaped rectangle. */
export function rectCenter(position: Point, size: Size): Point {
    return {
        x: position.x + size.width / 2,
        y: position.y + size.height / 2,
    };
}
