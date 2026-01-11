import { useRef, useState } from 'react';
import type { Tile } from '@/types';
import TextTile from './tiles/TextTile';
import LinkTile from './tiles/LinkTile';
import ImageTile from './tiles/ImageTile';

interface CanvasProps {
    tiles: Tile[];
    onTileUpdate?: (tileId: string, updates: Partial<Tile>) => void;
}

const GRID_SIZE = 40; // Must match Background.tsx grid size

const Canvas = ({ tiles, onTileUpdate }: CanvasProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    console.log('Canvas rendering with tiles:', tiles);

    // Handle canvas panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === canvasRef.current) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Snap pan to grid to keep visual grid aligned
    const snappedPan = {
        x: Math.round(pan.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pan.y / GRID_SIZE) * GRID_SIZE,
    };

    return (
        <div
            ref={canvasRef}
            className="relative flex-1 overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundColor: 'var(--secondary-background)',
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
                    <div
                        key={tile._id}
                        className="absolute"
                        style={{
                            left: tile.position.x,
                            top: tile.position.y,
                            width: tile.size.width,
                            height: tile.size.height,
                        }}
                    >
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
                ))}
            </div>
        </div>
    );
};

export default Canvas;
