import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import type { Tile, BoardBackground } from '@/types';
import TextTile from './tiles/TextTile';
import LinkTile from './tiles/LinkTile';
import ImageTile from './tiles/ImageTile';

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
    onTileClick?: (tileId: string) => void;
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
}: CanvasProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const panContainerRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const panRef = useRef({ x: 0, y: 0 });
    const isPanningRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [isDragOver, setIsDragOver] = useState(false);
    const draggingTileRef = useRef<string | null>(null);

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

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

        // Handle URL drops (from browser)
        const html = e.dataTransfer.getData('text/html');
        const text = e.dataTransfer.getData('text/plain');

        // Try to extract image URL from HTML
        if (html) {
            const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch && imgMatch[1]) {
                onCreateTileFromDrop(imgMatch[1], position);
                return;
            }
        }

        // Check if plain text is an image URL
        if (text && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(text)) {
            onCreateTileFromDrop(text, position);
            return;
        }
    };

    return (
        <div
            ref={canvasRef}
            className={`relative flex-1 overflow-hidden cursor-move select-none ${
                isDragOver ? 'ring-4 ring-blue-500 ring-inset' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
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
                            key={tile._id}
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
                            disableDragging={isDeleteMode}
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
                            onDragStart={() => {
                                draggingTileRef.current = tile._id;
                                const tileDiv = document.querySelector(
                                    `[data-tile-id="${tile._id}"]`
                                ) as HTMLElement;
                                if (tileDiv) {
                                    tileDiv.classList.add('drag-glow-border');
                                }
                            }}
                            onDragStop={(_, d) => {
                                if (draggingTileRef.current === tile._id) {
                                    const tileDiv = document.querySelector(
                                        `[data-tile-id="${tile._id}"]`
                                    ) as HTMLElement;
                                    if (tileDiv) {
                                        tileDiv.classList.remove(
                                            'drag-glow-border'
                                        );
                                    }
                                    draggingTileRef.current = null;
                                }
                                onTileUpdate?.(tile._id, {
                                    position: { x: d.x, y: d.y },
                                });
                            }}
                            onResizeStop={(_, __, ref, ___, position) => {
                                onTileUpdate?.(tile._id, {
                                    size: {
                                        width: parseInt(ref.style.width),
                                        height: parseInt(ref.style.height),
                                    },
                                    position,
                                });
                            }}
                        >
                            <div
                                data-tile-id={tile._id}
                                className={`h-full w-full flex flex-col select-none ${
                                    isDeleteMode
                                        ? 'delete-glow-border cursor-pointer'
                                        : ''
                                }`}
                                onClick={() => {
                                    if (isDeleteMode) {
                                        onDeleteTile?.(tile._id);
                                    } else {
                                        onTileClick?.(tile._id);
                                    }
                                }}
                            >
                                {/* Drag handle bar */}
                                <div className="tile-drag-handle bg-black/5 h-[40px] flex items-center justify-center flex-shrink-0 cursor-default hover:cursor-grab active:cursor-grabbing transition-colors hover:bg-black/8"></div>
                                {/* Tile content */}
                                <div className="flex-1 overflow-hidden select-text">
                                    {tile.type === 'text' && (
                                        <TextTile
                                            tile={tile}
                                            onUpdate={(updates) =>
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
                                            onUpdate={(updates) =>
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
                                            onUpdate={(updates) =>
                                                onTileUpdate?.(
                                                    tile._id,
                                                    updates
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            </div>
                        </Rnd>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Canvas;
