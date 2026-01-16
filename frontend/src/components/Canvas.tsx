import { useRef, useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import type { Tile } from '@/types';
import TextTile from './tiles/TextTile';
import LinkTile from './tiles/LinkTile';
import ImageTile from './tiles/ImageTile';

interface CanvasProps {
    tiles: Tile[];
    onTileUpdate?: (tileId: string, updates: Partial<Tile>) => void;
    isDeleteMode?: boolean;
    onDeleteTile?: (tileId: string) => void;
}

const GRID_SIZE = 40; // Must match Background.tsx grid size

const Canvas = ({
    tiles,
    onTileUpdate,
    isDeleteMode = false,
    onDeleteTile,
}: CanvasProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const rafRef = useRef<number | undefined>(undefined);

    console.log('Canvas rendering with tiles:', tiles);
    console.log('Canvas isDeleteMode:', isDeleteMode);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Handle canvas panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            // Cancel any pending animation frame
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }

            // Schedule update on next frame
            rafRef.current = requestAnimationFrame(() => {
                setPan({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y,
                });
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        // Cancel any pending animation frame on mouse up
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
    };

    // Snap pan to grid to keep visual grid aligned
    const snappedPan = {
        x: Math.round(pan.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pan.y / GRID_SIZE) * GRID_SIZE,
    };

    return (
        <div
            ref={canvasRef}
            className="relative flex-1 overflow-hidden cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundColor: 'var(--secondary-background)',
                userSelect: isDragging ? 'none' : 'auto',
            }}
        >
            {/* Grid background - aligned to snapped pan */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM0 0h40v1H0z' fill='rgba(0,0,0,0.05)'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px',
                    backgroundPosition: `${snappedPan.x}px ${snappedPan.y}px`,
                }}
            />

            {/* Tiles container */}
            <div
                className="absolute"
                style={{
                    transform: `translate(${snappedPan.x}px, ${snappedPan.y}px)`,
                }}
            >
                {tiles.map((tile) => (
                    <Rnd
                        key={tile._id}
                        default={{
                            x: tile.position.x,
                            y: tile.position.y,
                            width: tile.size.width,
                            height: tile.size.height,
                        }}
                        dragHandleClassName="tile-drag-handle"
                        dragGrid={[GRID_SIZE, GRID_SIZE]}
                        resizeGrid={[GRID_SIZE, GRID_SIZE]}
                        minWidth={GRID_SIZE * 2}
                        minHeight={GRID_SIZE * 2}
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
                        onDragStop={(_, d) => {
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
                            className={`h-full w-full flex flex-col select-none ${
                                isDeleteMode
                                    ? 'ring-4 ring-red-500 cursor-pointer'
                                    : ''
                            }`}
                            onClick={() =>
                                isDeleteMode && onDeleteTile?.(tile._id)
                            }
                        >
                            {/* Drag handle bar */}
                            <div className="tile-drag-handle bg-black/5 h-[40px] flex items-center justify-center flex-shrink-0 cursor-default hover:cursor-grab active:cursor-grabbing transition-colors hover:bg-black/8"></div>
                            {/* Tile content */}
                            <div className="flex-1 overflow-hidden select-text">
                                {tile.type === 'text' && (
                                    <TextTile
                                        tile={tile}
                                        onUpdate={(updates) =>
                                            onTileUpdate?.(tile._id, updates)
                                        }
                                    />
                                )}
                                {tile.type === 'link' && (
                                    <LinkTile
                                        tile={tile}
                                        onUpdate={(updates) =>
                                            onTileUpdate?.(tile._id, updates)
                                        }
                                    />
                                )}
                                {tile.type === 'image' && (
                                    <ImageTile
                                        tile={tile}
                                        onUpdate={(updates) =>
                                            onTileUpdate?.(tile._id, updates)
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </Rnd>
                ))}
            </div>
        </div>
    );
};

export default Canvas;
