import { useEffect, useState, useRef } from 'react';
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
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    // Undo/Redo history
    const [history, setHistory] = useState<Tile[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleToggleDelete = () => {
        const newDeleteMode = !isDeleteMode;
        setIsDeleteMode(newDeleteMode);
        if (newDeleteMode) {
            toast.info('Delete mode active - click tiles to delete');
        }
    };

    const saveToHistory = (newTiles: Tile[]) => {
        // Remove any history after current index (for redo branch)
        const newHistory = history.slice(0, historyIndex + 1);
        // Add new state
        newHistory.push(JSON.parse(JSON.stringify(newTiles)));
        // Limit history to 50 states
        if (newHistory.length > 50) {
            newHistory.shift();
        } else {
            setHistoryIndex(historyIndex + 1);
        }
        setHistory(newHistory);
    };

    const syncTilesToBackend = async (tilesToSync: Tile[]) => {
        if (!id || isSyncing) return;

        setIsSyncing(true);
        try {
            // Get current tiles from backend
            const currentBackendTiles = await tileAPI.getTiles(id);
            const currentIds = new Set(tilesToSync.map((t) => t._id));
            const backendIds = new Set(currentBackendTiles.map((t) => t._id));

            // Delete tiles that are in backend but not in current state
            for (const backendTile of currentBackendTiles) {
                if (!currentIds.has(backendTile._id)) {
                    await tileAPI.deleteTile(id, backendTile._id);
                }
            }

            // Create or update tiles that are in current state
            for (const tile of tilesToSync) {
                if (backendIds.has(tile._id)) {
                    // Update existing tile
                    await tileAPI.updateTile(id, tile._id, tile);
                } else {
                    // Recreate deleted tile (for undo) - backend will assign new ID
                    const { _id, ...tileWithoutId } = tile;
                    await tileAPI.createTile(id, tileWithoutId);
                }
            }

            // Fetch fresh data to get correct IDs and update history
            const freshTiles = await tileAPI.getTiles(id);
            setTiles(freshTiles);

            // Update the current history entry with fresh IDs
            setHistory((prev) => {
                const updated = [...prev];
                updated[historyIndex] = JSON.parse(JSON.stringify(freshTiles));
                return updated;
            });
        } catch (error) {
            console.error('Failed to sync tiles:', error);
            toast.error('Failed to sync changes - try refreshing');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0 && !isSyncing) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const restoredTiles = JSON.parse(JSON.stringify(history[newIndex]));
            setTiles(restoredTiles);

            // Debounced sync to backend
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(() => {
                syncTilesToBackend(restoredTiles);
            }, 1000);

            toast.success('Undo');
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1 && !isSyncing) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const restoredTiles = JSON.parse(JSON.stringify(history[newIndex]));
            setTiles(restoredTiles);

            // Debounced sync to backend
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(() => {
                syncTilesToBackend(restoredTiles);
            }, 1000);

            toast.success('Redo');
        }
    };

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
                // Initialize history
                setHistory([JSON.parse(JSON.stringify(tilesData))]);
                setHistoryIndex(0);
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

    const handleCreateTile = async (type: 'text' | 'image' | 'link') => {
        if (!id) return;

        console.log('Creating tile:', type);

        try {
            // Default tile size
            const defaultSize = {
                width: 240,
                height: 200,
            };

            // Position at center of viewport (accounting for canvas being below navbar/toolbar)
            // For now, position at a simple grid location
            const position = {
                x: 200,
                y: 200,
            };

            console.log('Tile data:', { type, position, size: defaultSize });

            const newTile = await tileAPI.createTile(id, {
                type,
                position,
                size: defaultSize,
                style: {
                    backgroundColor: board?.settings.tileColor || '#FBBF24',
                    textColor: '#000000',
                },
                data: {},
            });

            console.log('Tile created:', newTile);
            const newTiles = [...tiles, newTile];
            setTiles(newTiles);
            saveToHistory(newTiles);
            toast.success(`${type} tile created`);
        } catch (error) {
            console.error('Failed to create tile:', error);
            toast.error('Failed to create tile');
        }
    };

    const handleTileUpdate = async (tileId: string, updates: Partial<Tile>) => {
        if (!id) return;

        console.log('handleTileUpdate called:', { tileId, updates });

        // Optimistic update - update UI immediately
        const optimisticTiles = tiles.map((tile) =>
            tile._id === tileId ? { ...tile, ...updates } : tile
        );
        setTiles(optimisticTiles);
        saveToHistory(optimisticTiles);

        // Then sync with backend
        try {
            await tileAPI.updateTile(id, tileId, updates);
            console.log('Tile updated successfully');
        } catch (error) {
            console.error('Failed to update tile:', error);
            toast.error('Failed to update tile');
            // Revert on error
            setTiles(tiles);
        }
    };

    const handleDeleteTile = async (tileId: string) => {
        if (!id) return;

        try {
            await tileAPI.deleteTile(id, tileId);
            const newTiles = tiles.filter((tile) => tile._id !== tileId);
            setTiles(newTiles);
            saveToHistory(newTiles);
            toast.success('Tile deleted');
        } catch (error) {
            console.error('Failed to delete tile:', error);
            toast.error('Failed to delete tile');
        }
    };

    const handleCreateTileFromDrop = async (
        data: string | File,
        position: { x: number; y: number }
    ) => {
        if (!id) return;

        try {
            let imageUrl = '';

            // Handle file upload
            if (data instanceof File) {
                const formData = new FormData();
                formData.append('image', data);

                const response = await fetch(
                    `http://localhost:5000/api/upload/image`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: formData,
                    }
                );

                if (!response.ok) throw new Error('Upload failed');
                const result = await response.json();
                imageUrl = result.url;
            } else {
                // Handle URL
                imageUrl = data;
            }

            // Create tile with the image
            const newTile = await tileAPI.createTile(id, {
                type: 'image',
                position,
                size: { width: 240, height: 200 },
                style: {
                    backgroundColor: board?.settings.tileColor || '#FBBF24',
                    textColor: '#000000',
                },
                data: {
                    imageUrl,
                },
            });

            const newTiles = [...tiles, newTile];
            setTiles(newTiles);
            saveToHistory(newTiles);
            toast.success('Image tile created');
        } catch (error) {
            console.error('Failed to create tile from drop:', error);
            toast.error('Failed to create tile');
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
            <Toolbar
                saveStatus="saved"
                onCreateTile={handleCreateTile}
                isDeleteMode={isDeleteMode}
                onToggleDelete={handleToggleDelete}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0 && !isSyncing}
                canRedo={historyIndex < history.length - 1 && !isSyncing}
            />
            <Canvas
                tiles={tiles}
                onTileUpdate={handleTileUpdate}
                isDeleteMode={isDeleteMode}
                onDeleteTile={handleDeleteTile}
                onCreateTileFromDrop={handleCreateTileFromDrop}
            />
        </div>
    );
};

export default Board;
