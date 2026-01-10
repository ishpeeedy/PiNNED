import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { boardAPI, tileAPI } from '@/services/api';
import type { Board as BoardType, Tile } from '@/types';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Toolbar from '@/components/Toolbar';
import Canvas from '@/components/Canvas';

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

    const handleBoardUpdate = async (updates: Partial<BoardType>) => {
        if (!id || !board) return;

        try {
            const updatedBoard = await boardAPI.updateBoard(id, updates);
            setBoard(updatedBoard);
            toast.success('Board updated');
        } catch (error) {
            console.error('Failed to update board:', error);
            toast.error('Failed to update board');
        }
    };

    if (!board) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-2xl">Board not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Navbar board={board} onBoardUpdate={handleBoardUpdate} />
            <Toolbar saveStatus="saved" />
            <Canvas tiles={tiles} />
        </div>
    );
};

export default Board;
