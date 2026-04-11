import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import type { Tile, BoardBackground } from '@/types';
import TextTile from './tiles/TextTile';
import LinkTile from './tiles/LinkTile';
import ImageTile from './tiles/ImageTile';
import {
    Copy,
    Trash2,
    ArrowUpToLine,
    ArrowDownToLine,
    Palette,
    MousePointer2,
    X as XIcon,
    Type,
    Image as ImageIcon,
    Link2,
    Undo,
    Redo,
    ZoomIn,
    ZoomOut,
    Minimize2,
} from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
    ContextMenuShortcut,
} from '@/components/ui/context-menu';

const TILE_COLORS = [
    { name: 'Yellow', value: '#FBBF24' },
    { name: 'Pink', value: '#F472B6' },
    { name: 'Blue', value: '#60A5FA' },
    { name: 'Green', value: '#4ADE80' },
    { name: 'Purple', value: '#C084FC' },
    { name: 'Orange', value: '#FB923C' },
    { name: 'Red', value: '#F87171' },
    { name: 'White', value: '#FFFFFF' },
];

interface CanvasProps {
    tiles: Tile[];
    onTileUpdate?: (tileId: string, updates: Partial<Tile>) => void;
    isDeleteMode?: boolean;
    onDeleteTile?: (tileId: string) => void;
    onCreateTileFromDrop?: (
        data: File | string,
        position: { x: number; y: number }
    ) => void;
    zoom?: number;
    background?: BoardBackground;
    onTileClick?: (tileId: string, ctrlKey: boolean) => void;
    onCanvasClick?: () => void;
    selectedTileIds?: Set<string>;
    searchMatchIds?: Set<string>;
    focusedSearchId?: string | null;
    targetPan?: { x: number; y: number; version: number } | null;
    semanticRankMap?: Map<string, number>;
    semanticScoreMap?: Map<string, number>;
    undoRedoKey?: number;
    onContextMenuDelete?: (tileId: string) => void;
    onContextMenuDuplicate?: (tileId: string) => void;
    onContextMenuBringToFront?: (tileId: string) => void;
    onContextMenuSendToBack?: (tileId: string) => void;
    onContextMenuColorChange?: (tileId: string, color: string) => void;
    onContextMenuSelectAll?: () => void;
    onContextMenuDeselect?: () => void;
    onContextMenuCreateTile?: (
        type: 'text' | 'image' | 'link',
        position: { x: number; y: number }
    ) => void;
    onContextMenuUndo?: () => void;
    onContextMenuRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onContextMenuZoomIn?: () => void;
    onContextMenuZoomOut?: () => void;
    onContextMenuResetZoom?: () => void;
}

const Canvas = ({
    tiles,
    onTileUpdate,
    isDeleteMode = false,
    onDeleteTile,
    onCreateTileFromDrop,
    zoom = 1,
    background,
    onTileClick,
    onCanvasClick,
    selectedTileIds = new Set<string>(),
    focusedSearchId = null,
    targetPan = null,
    semanticRankMap = new Map<string, number>(),
    semanticScoreMap = new Map<string, number>(),
    undoRedoKey = 0,
    onContextMenuDelete,
    onContextMenuDuplicate,
    onContextMenuBringToFront,
    onContextMenuSendToBack,
    onContextMenuColorChange,
    onContextMenuSelectAll,
    onContextMenuDeselect,
    onContextMenuCreateTile,
    onContextMenuUndo,
    onContextMenuRedo,
    canUndo = false,
    canRedo = false,
    onContextMenuZoomIn,
    onContextMenuZoomOut,
    onContextMenuResetZoom,
}: CanvasProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const panContainerRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const panRef = useRef({ x: 0, y: 0 });
    const isPanningRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [isDragOver, setIsDragOver] = useState(false);
    const draggingTileRef = useRef<string | null>(null);
    const contextMenuCanvasPosRef = useRef<{ x: number; y: number }>({
        x: 200,
        y: 200,
    });

    // Track selectedTileIds in a ref so drag handlers always read the latest value
    const selectedTileIdsRef = useRef(selectedTileIds);
    useEffect(() => {
        selectedTileIdsRef.current = selectedTileIds;
    }, [selectedTileIds]);

    const tileDragRef = useRef<{
        startMouseX: number;
        startMouseY: number;
        tiles: {
            tileId: string;
            rndEl: HTMLElement;
            startX: number;
            startY: number;
            currentX: number;
            currentY: number;
        }[];
    } | null>(null);

    // Bring a tile to the front by giving it the highest zIndex
    const bringToFront = useCallback(
        (tileId: string) => {
            const maxZ = Math.max(...tiles.map((t) => t.zIndex ?? 1), 0);
            const tile = tiles.find((t) => t._id === tileId);
            if (tile && (tile.zIndex ?? 1) < maxZ) {
                onTileUpdate?.(tileId, { zIndex: maxZ + 1 });
            }
        },
        [tiles, onTileUpdate]
    );

    // Store zoom in a ref so the drag mousemove handler always reads the latest value
    const zoomRef = useRef(zoom);
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    // Custom tile drag — bypasses react-rnd drag entirely, supports group drag
    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            const handle = (e.target as HTMLElement).closest(
                '.tile-drag-handle'
            );
            if (!handle) return;

            const tileDiv = handle.closest(
                '[data-tile-id]'
            ) as HTMLElement | null;
            if (!tileDiv) return;
            const draggedId = tileDiv.getAttribute('data-tile-id');
            if (!draggedId) return;

            // If the dragged tile is part of the selection, move all selected tiles.
            // Otherwise just move the dragged tile alone.
            const selection = selectedTileIdsRef.current;
            const tileIds = selection.has(draggedId)
                ? Array.from(selection)
                : [draggedId];

            // Gather DOM info for each tile in the group
            const tileEntries: {
                tileId: string;
                rndEl: HTMLElement;
                startX: number;
                startY: number;
                currentX: number;
                currentY: number;
            }[] = [];
            for (const tileId of tileIds) {
                const el = document.querySelector(
                    `[data-tile-id="${tileId}"]`
                ) as HTMLElement | null;
                if (!el) continue;
                const rndEl = el.parentElement as HTMLElement;
                if (!rndEl) continue;
                const match = rndEl.style.transform.match(
                    /translate\(([^,]+),\s*([^)]+)\)/
                );
                const curX = match ? parseFloat(match[1]) : 0;
                const curY = match ? parseFloat(match[2]) : 0;
                el.classList.add('drag-glow-border');
                rndEl.style.zIndex = '9999';
                tileEntries.push({
                    tileId,
                    rndEl,
                    startX: curX,
                    startY: curY,
                    currentX: curX,
                    currentY: curY,
                });
            }

            if (tileEntries.length === 0) return;

            e.preventDefault();
            e.stopPropagation();

            tileDragRef.current = {
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                tiles: tileEntries,
            };

            draggingTileRef.current = draggedId;
        };

        const onMouseMove = (e: MouseEvent) => {
            const drag = tileDragRef.current;
            if (!drag) return;

            const z = zoomRef.current;
            const dx = (e.clientX - drag.startMouseX) / z;
            const dy = (e.clientY - drag.startMouseY) / z;

            for (const t of drag.tiles) {
                const newX = t.startX + dx;
                const newY = t.startY + dy;
                t.rndEl.style.transform = `translate(${newX}px, ${newY}px)`;
                t.currentX = newX;
                t.currentY = newY;
            }
        };

        const onMouseUp = () => {
            const drag = tileDragRef.current;
            if (!drag) return;

            for (const t of drag.tiles) {
                const tileEl = t.rndEl.querySelector(
                    '[data-tile-id]'
                ) as HTMLElement | null;
                if (tileEl) tileEl.classList.remove('drag-glow-border');

                onTileUpdate?.(t.tileId, {
                    position: {
                        x: Math.round(t.currentX),
                        y: Math.round(t.currentY),
                    },
                });
            }

            tileDragRef.current = null;
            draggingTileRef.current = null;
        };

        window.addEventListener('mousedown', onMouseDown, true);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousedown', onMouseDown, true);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [onTileUpdate]);

    // Derive background settings
    const bgType = background?.type ?? 'grid';
    const hasCustomColors = !!(
        background?.color || background?.foregroundColor
    );
    const useCssClass =
        !hasCustomColors && bgType !== 'solid' && bgType !== 'image';

    const bgStyle = useMemo(() => {
        if (useCssClass) return undefined;

        const style: React.CSSProperties = {};

        if (bgType === 'solid') {
            style.backgroundColor =
                background?.color || 'var(--secondary-background)';
        } else if (bgType === 'image' && background?.imageUrl) {
            style.backgroundImage = `url(${background.imageUrl})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
        } else if (bgType === 'grid' || bgType === 'dots') {
            const bg = background?.color || 'transparent';
            const fg = background?.foregroundColor || 'rgba(0,0,0,0.15)';

            if (bgType === 'grid') {
                const svg = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="${bg}"/><path d="M 40 0 L 0 0 0 40" fill="none" stroke="${fg}" stroke-width="1"/></svg>`;
                style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
                style.backgroundSize = '40px 40px';
            } else {
                style.backgroundColor = bg;
                style.backgroundImage = `radial-gradient(circle, ${fg} 1px, transparent 1px)`;
                style.backgroundSize = '30px 30px';
            }
        }

        return style;
    }, [useCssClass, bgType, background]);

    // Direct DOM update for pan — no React re-render
    const applyPanTransform = useCallback((x: number, y: number) => {
        if (panContainerRef.current) {
            panContainerRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
    }, []);

    // Handle canvas panning via native events for zero-latency movement
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onMouseDown = (e: MouseEvent) => {
            if (e.target !== canvas) return;
            e.preventDefault();
            isPanningRef.current = true;
            dragStartRef.current = {
                x: e.clientX - panRef.current.x,
                y: e.clientY - panRef.current.y,
            };
            canvas.style.cursor = 'grabbing';
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isPanningRef.current) return;
            const nx = e.clientX - dragStartRef.current.x;
            const ny = e.clientY - dragStartRef.current.y;
            panRef.current = { x: nx, y: ny };
            applyPanTransform(nx, ny);
        };

        const onMouseUp = () => {
            if (!isPanningRef.current) return;
            isPanningRef.current = false;
            canvas.style.cursor = '';
            // Commit to React state once so drop calculations etc. see the right value
            setPan({ ...panRef.current });
        };

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [applyPanTransform]);

    // Keep ref in sync when React state changes (e.g. initial render)
    useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    // Jump to search result when targetPan changes — smooth animated pan
    useEffect(() => {
        if (!targetPan) return;
        const container = panContainerRef.current;
        if (!container) return;

        const { x, y } = targetPan;

        // Add transition for smooth pan
        container.style.transition =
            'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        applyPanTransform(x, y);

        // Commit to state and remove transition after animation completes
        const timer = setTimeout(() => {
            container.style.transition = '';
            panRef.current = { x, y };
            setPan({ x, y });
        }, 420);

        return () => clearTimeout(timer);
    }, [targetPan, applyPanTransform]);

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === canvasRef.current) {
            setIsDragOver(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (!onCreateTileFromDrop) return;

        // Calculate drop position accounting for pan
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        const position = { x: Math.round(x), y: Math.round(y) };

        // Handle file drops (from file explorer)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onCreateTileFromDrop(file, position);
                return;
            }
        }

        // Handle URL drops (from browser tabs): text/uri-list, text/plain and text/html.
        const uriList = e.dataTransfer.getData('text/uri-list');
        const html = e.dataTransfer.getData('text/html');
        const text = e.dataTransfer.getData('text/plain');

        const cleanUrl = (value: string): string | null => {
            const candidate = value.trim();
            if (!candidate) return null;
            try {
                const url = new URL(candidate);
                return url.href;
            } catch {
                return null;
            }
        };

        const isLikelyImageUrl = (value: string): boolean => {
            try {
                const url = new URL(value);
                const pathname = url.pathname.toLowerCase();
                return /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i.test(
                    pathname
                );
            } catch {
                return false;
            }
        };

        const createFromUrl = (value: string, force = false): boolean => {
            const url = cleanUrl(value);
            if (!url) return false;

            // Accept direct image URLs and common drag payloads that don't expose an extension.
            if (
                force ||
                isLikelyImageUrl(url) ||
                /image|img|photo|cdn|cloudinary/i.test(url)
            ) {
                onCreateTileFromDrop(url, position);
                return true;
            }

            return false;
        };

        // `text/uri-list` can contain comments and multiple URLs; use the first URL line.
        if (uriList) {
            const uriCandidates = uriList
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#'));

            for (const candidate of uriCandidates) {
                if (createFromUrl(candidate)) return;
            }
        }

        // Parse HTML payload and prefer any <img src="..."> URL.
        if (html) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const imageCandidates: string[] = [
                ...Array.from(doc.querySelectorAll('img'))
                    .map((img) => img.getAttribute('src') || '')
                    .filter(Boolean),
            ];

            for (const candidate of imageCandidates) {
                if (createFromUrl(candidate, true)) return;
            }
        }

        // Some browsers provide only text/plain for tab drags.
        if (text && createFromUrl(text)) {
            return;
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    ref={canvasRef}
                    className={`relative flex-1 overflow-hidden cursor-move select-none ${
                        isDragOver ? 'ring-4 ring-blue-500 ring-inset' : ''
                    }`}
                    onContextMenu={(e) => {
                        if (!canvasRef.current) return;
                        const rect = canvasRef.current.getBoundingClientRect();
                        contextMenuCanvasPosRef.current = {
                            x: Math.round(
                                (e.clientX - rect.left - panRef.current.x) /
                                    zoomRef.current
                            ),
                            y: Math.round(
                                (e.clientY - rect.top - panRef.current.y) /
                                    zoomRef.current
                            ),
                        };
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => onCanvasClick?.()}
                    style={{
                        backgroundColor: 'var(--secondary-background)',
                    }}
                >
                    {/* Cosmetic background — driven by board settings */}
                    <div
                        className={`absolute inset-0 pointer-events-none ${
                            useCssClass
                                ? bgType === 'dots'
                                    ? 'isometric-dots'
                                    : 'grid-pattern'
                                : ''
                        }`}
                        style={useCssClass ? undefined : bgStyle}
                    />

                    {/* Tiles container — pan and zoom separated to keep Rnd coordinate math correct */}
                    <div
                        ref={panContainerRef}
                        className="absolute"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px)`,
                            willChange: 'transform',
                        }}
                    >
                        <div
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: '0 0',
                            }}
                        >
                            {tiles.map((tile) => (
                                <Rnd
                                    key={`${tile._id}-${undoRedoKey}`}
                                    position={{
                                        x: tile.position.x,
                                        y: tile.position.y,
                                    }}
                                    size={{
                                        width: tile.size.width,
                                        height: tile.size.height,
                                    }}
                                    dragHandleClassName="tile-drag-handle"
                                    minWidth={80}
                                    minHeight={80}
                                    scale={zoom}
                                    disableDragging={true}
                                    enableResizing={
                                        !isDeleteMode
                                            ? {
                                                  bottom: true,
                                                  bottomLeft: true,
                                                  bottomRight: true,
                                                  left: true,
                                                  right: true,
                                                  top: true,
                                                  topLeft: true,
                                                  topRight: true,
                                              }
                                            : false
                                    }
                                    style={{ zIndex: tile.zIndex ?? 1 }}
                                    onResizeStop={(
                                        _,
                                        __,
                                        ref,
                                        ___,
                                        position
                                    ) => {
                                        onTileUpdate?.(tile._id, {
                                            size: {
                                                width: parseInt(
                                                    ref.style.width
                                                ),
                                                height: parseInt(
                                                    ref.style.height
                                                ),
                                            },
                                            position,
                                        });
                                    }}
                                >
                                    <ContextMenu>
                                        <ContextMenuTrigger asChild>
                                            <div
                                                data-tile-id={tile._id}
                                                className={`relative h-full w-full flex flex-col select-none ${
                                                    isDeleteMode
                                                        ? 'delete-glow-border cursor-pointer'
                                                        : focusedSearchId ===
                                                            tile._id
                                                          ? 'drag-glow-border'
                                                          : selectedTileIds.has(
                                                                  tile._id
                                                              )
                                                            ? 'tile-selected-border'
                                                            : (() => {
                                                                  const score =
                                                                      semanticScoreMap.get(
                                                                          tile._id
                                                                      );
                                                                  if (
                                                                      score ===
                                                                      undefined
                                                                  )
                                                                      return '';
                                                                  if (
                                                                      score >=
                                                                      0.85
                                                                  )
                                                                      return 'search-glow-border-high';
                                                                  if (
                                                                      score >=
                                                                      0.78
                                                                  )
                                                                      return 'search-glow-border-mid';
                                                                  return 'search-glow-border-low';
                                                              })()
                                                }`}
                                                onContextMenu={(e) => {
                                                    e.stopPropagation();
                                                    if (
                                                        !selectedTileIds.has(
                                                            tile._id
                                                        )
                                                    ) {
                                                        onTileClick?.(
                                                            tile._id,
                                                            false
                                                        );
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isDeleteMode) {
                                                        onDeleteTile?.(
                                                            tile._id
                                                        );
                                                    } else {
                                                        bringToFront(tile._id);
                                                        onTileClick?.(
                                                            tile._id,
                                                            e.ctrlKey ||
                                                                e.metaKey
                                                        );
                                                    }
                                                }}
                                            >
                                                {/* Drag handle bar */}
                                                <div className="tile-drag-handle bg-black/5 h-[40px] flex items-center justify-center flex-shrink-0 cursor-default hover:cursor-grab active:cursor-grabbing transition-colors hover:bg-black/8">
                                                    {semanticRankMap.has(
                                                        tile._id
                                                    ) && (
                                                        <span className="absolute top-2 right-2 z-10 text-xs font-bold leading-none px-2 py-1 rounded-full bg-[#5294ff] text-white pointer-events-none shadow-md">
                                                            #
                                                            {semanticRankMap.get(
                                                                tile._id
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Tile content */}
                                                <div className="flex-1 overflow-hidden select-text">
                                                    {tile.type === 'text' && (
                                                        <TextTile
                                                            tile={tile}
                                                            onUpdate={(
                                                                updates
                                                            ) =>
                                                                onTileUpdate?.(
                                                                    tile._id,
                                                                    updates
                                                                )
                                                            }
                                                        />
                                                    )}
                                                    {tile.type === 'link' && (
                                                        <LinkTile
                                                            tile={tile}
                                                            onUpdate={(
                                                                updates
                                                            ) =>
                                                                onTileUpdate?.(
                                                                    tile._id,
                                                                    updates
                                                                )
                                                            }
                                                        />
                                                    )}
                                                    {tile.type === 'image' && (
                                                        <ImageTile
                                                            tile={tile}
                                                            onUpdate={(
                                                                updates
                                                            ) =>
                                                                onTileUpdate?.(
                                                                    tile._id,
                                                                    updates
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-56">
                                            <ContextMenuItem
                                                onSelect={() =>
                                                    onContextMenuDuplicate?.(
                                                        tile._id
                                                    )
                                                }
                                            >
                                                <Copy className="mr-2 h-4 w-4" />
                                                {selectedTileIds.has(
                                                    tile._id
                                                ) && selectedTileIds.size > 1
                                                    ? `Duplicate (${selectedTileIds.size})`
                                                    : 'Duplicate'}
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                                onSelect={() =>
                                                    onContextMenuDelete?.(
                                                        tile._id
                                                    )
                                                }
                                                className="text-red-500 focus:text-red-500"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                {selectedTileIds.has(
                                                    tile._id
                                                ) && selectedTileIds.size > 1
                                                    ? `Delete (${selectedTileIds.size})`
                                                    : 'Delete'}
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem
                                                onSelect={() =>
                                                    onContextMenuBringToFront?.(
                                                        tile._id
                                                    )
                                                }
                                            >
                                                <ArrowUpToLine className="mr-2 h-4 w-4" />{' '}
                                                Bring to Front
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                                onSelect={() =>
                                                    onContextMenuSendToBack?.(
                                                        tile._id
                                                    )
                                                }
                                            >
                                                <ArrowDownToLine className="mr-2 h-4 w-4" />{' '}
                                                Send to Back
                                            </ContextMenuItem>
                                            <ContextMenuSeparator />
                                            <ContextMenuSub>
                                                <ContextMenuSubTrigger>
                                                    <Palette className="mr-2 h-4 w-4" />{' '}
                                                    Change Color
                                                </ContextMenuSubTrigger>
                                                <ContextMenuSubContent className="w-44">
                                                    {TILE_COLORS.map((c) => (
                                                        <ContextMenuItem
                                                            key={c.value}
                                                            onSelect={() =>
                                                                onContextMenuColorChange?.(
                                                                    tile._id,
                                                                    c.value
                                                                )
                                                            }
                                                        >
                                                            <span
                                                                className="mr-2 h-4 w-4 rounded-sm border border-border inline-block flex-shrink-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        c.value,
                                                                }}
                                                            />
                                                            {c.name}
                                                        </ContextMenuItem>
                                                    ))}
                                                </ContextMenuSubContent>
                                            </ContextMenuSub>
                                            <ContextMenuSeparator />
                                            <ContextMenuItem
                                                onSelect={() =>
                                                    onContextMenuSelectAll?.()
                                                }
                                            >
                                                <MousePointer2 className="mr-2 h-4 w-4" />{' '}
                                                Select All
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                                onSelect={() =>
                                                    onContextMenuDeselect?.()
                                                }
                                            >
                                                <XIcon className="mr-2 h-4 w-4" />{' '}
                                                Deselect
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    </ContextMenu>
                                </Rnd>
                            ))}
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <ContextMenuItem
                    onSelect={() =>
                        onContextMenuCreateTile?.(
                            'text',
                            contextMenuCanvasPosRef.current
                        )
                    }
                >
                    <Type className="mr-2 h-4 w-4" /> Add Text Tile
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() =>
                        onContextMenuCreateTile?.(
                            'image',
                            contextMenuCanvasPosRef.current
                        )
                    }
                >
                    <ImageIcon className="mr-2 h-4 w-4" /> Add Image Tile
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() =>
                        onContextMenuCreateTile?.(
                            'link',
                            contextMenuCanvasPosRef.current
                        )
                    }
                >
                    <Link2 className="mr-2 h-4 w-4" /> Add Link Tile
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onSelect={() => onContextMenuUndo?.()}
                    disabled={!canUndo}
                >
                    <Undo className="mr-2 h-4 w-4" /> Undo
                    <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() => onContextMenuRedo?.()}
                    disabled={!canRedo}
                >
                    <Redo className="mr-2 h-4 w-4" /> Redo
                    <ContextMenuShortcut>Ctrl+Y</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                    onSelect={() => onContextMenuZoomIn?.()}
                    disabled={zoom >= 2}
                >
                    <ZoomIn className="mr-2 h-4 w-4" /> Zoom In
                </ContextMenuItem>
                <ContextMenuItem
                    onSelect={() => onContextMenuZoomOut?.()}
                    disabled={zoom <= 0.25}
                >
                    <ZoomOut className="mr-2 h-4 w-4" /> Zoom Out
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => onContextMenuResetZoom?.()}>
                    <Minimize2 className="mr-2 h-4 w-4" /> Reset Zoom
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => onContextMenuSelectAll?.()}>
                    <MousePointer2 className="mr-2 h-4 w-4" /> Select All
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default Canvas;
