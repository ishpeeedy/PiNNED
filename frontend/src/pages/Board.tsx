import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { boardAPI, tileAPI } from '@/services/api';
import type { Board as BoardType, Tile } from '@/types';
import { toast } from 'sonner';

const Board = () => {
    const { id } = useParams<{ id: string }>(); // Get board ID from URL
    const [board, setBoard] = useState<BoardType | null>(null);
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                setLoading(true);

                // Fetch board and tiles in parallel
                const [boardData, tilesData] = await Promise.all([
                    boardAPI.getBoard(id),
                    tileAPI.getTiles(id),
                ]);

                setBoard(boardData);
                setTiles(tilesData);
            } catch (error) {
                console.error('Failed to fetch board:', error);
                toast.error('Failed to load board');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-2xl">Loading board...</p>
            </div>
        );
    }

    if (!board) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-2xl">Board not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Simple header for now */}
            <div className="p-8 border-b-4 border-black bg-secondary-background">
                <h1 className="text-4xl font-bold">
                    {board.icon} {board.title}
                </h1>
                {board.description && (
                    <p className="text-lg mt-2">{board.description}</p>
                )}
            </div>

            {/* Canvas area - simple list for now */}
            <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">
                    Tiles ({tiles.length})
                </h2>

                {tiles.length === 0 ? (
                    <p className="text-gray-500">
                        No tiles yet. Create your first tile!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tiles.map((tile) => (
                            <div
                                key={tile._id}
                                className="p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                style={{
                                    backgroundColor: tile.style.backgroundColor,
                                }}
                            >
                                {tile.data.header && (
                                    <h3 className="font-bold text-lg mb-2">
                                        {tile.data.header}
                                    </h3>
                                )}
                                {tile.data.text && <p>{tile.data.text}</p>}
                                {tile.data.imageUrl && (
                                    <img
                                        src={tile.data.imageUrl}
                                        alt=""
                                        className="mt-2"
                                    />
                                )}
                                {tile.data.linkUrl && (
                                    <a
                                        href={tile.data.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline"
                                    >
                                        {tile.data.linkTitle ||
                                            tile.data.linkUrl}
                                    </a>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Type: {tile.type} | Position: (
                                    {tile.position.x}, {tile.position.y})
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Board;
