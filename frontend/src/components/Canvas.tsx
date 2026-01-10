import { useRef, useState } from 'react';
import type { Tile } from '@/types';

interface CanvasProps {
    tiles: Tile[];
    onTileUpdate?: (tileId: string, updates: Partial<Tile>) => void;
}

const GRID_SIZE = 40; // Must match Background.tsx grid size

const Canvas = ({ tiles }: CanvasProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
                        className="absolute bg-white border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 cursor-pointer"
                        style={{
                            left: tile.position.x,
                            top: tile.position.y,
                            width: tile.size.width,
                            height: tile.size.height,
                            backgroundColor: tile.style.backgroundColor,
                        }}
                    >
                        {/* Tile content based on type */}
                        {tile.type === 'text' && (
                            <div className="text-black font-medium">
                                {tile.data.text || 'Empty text tile'}
                            </div>
                        )}
                        {tile.type === 'image' && (
                            <div className="text-black text-sm">
                                Image: {tile.data.imageUrl || 'No image'}
                            </div>
                        )}
                        {tile.type === 'link' && (
                            <div className="text-black text-sm">
                                Link: {tile.data.linkUrl || 'No link'}
                            </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                            Position: ({tile.position.x}, {tile.position.y})
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Canvas;
