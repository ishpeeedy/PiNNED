import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { boardAPI, metadataAPI, tileAPI } from '@/services/api';
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
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [selectedTileIds, setSelectedTileIds] = useState<Set<string>>(
        new Set()
    );
    const [lastUsedColor, setLastUsedColor] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocusIndex, setSearchFocusIndex] = useState(0);
    const [isSemanticSearching, setIsSemanticSearching] = useState(false);
    const [semanticResultIds, setSemanticResultIds] = useState<string[] | null>(
        null
    );
    const [semanticScores, setSemanticScores] = useState<Map<string, number>>(
        new Map()
    );
    const [targetPan, setTargetPan] = useState<{
        x: number;
        y: number;
        version: number;
    } | null>(null);
    const panVersionRef = useRef(0);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Search: filter tiles by query across all text fields
    const searchResults = useMemo(() => {
        if (semanticResultIds) {
            return semanticResultIds
                .map((sid) => tiles.find((t) => t._id === sid))
                .filter(Boolean) as Tile[];
        }
        return searchQuery.trim().length >= 2
            ? tiles.filter((tile) => {
                  const q = searchQuery.toLowerCase();
                  const d = tile.data || {};
                  return [
                      d.header,
                      d.text,
                      d.caption,
                      d.linkUrl,
                      d.linkTitle,
                      d.linkDescription,
                      d.author,
                  ]
                      .filter(Boolean)
                      .some((field) => field!.toLowerCase().includes(q));
              })
            : [];
    }, [searchQuery, tiles, semanticResultIds]);

    const searchMatchIds = useMemo(
        () => new Set(searchResults.map((t) => t._id)),
        [searchResults]
    );
    const semanticRankMap = useMemo(
        () =>
            semanticResultIds
                ? new Map(semanticResultIds.map((id, i) => [id, i + 1]))
                : new Map<string, number>(),
        [semanticResultIds]
    );
    const semanticScoreMap = useMemo(() => {
        if (!semanticResultIds) return new Map<string, number>();
        return semanticScores;
    }, [semanticResultIds, semanticScores]);
    const focusedSearchTile = searchResults[searchFocusIndex] ?? null;

    const jumpToTile = useCallback(
        (tile: Tile) => {
            const container = canvasContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tileCenterX = (tile.position.x + tile.size.width / 2) * zoom;
            const tileCenterY = (tile.position.y + tile.size.height / 2) * zoom;
            panVersionRef.current += 1;
            setTargetPan({
                x: centerX - tileCenterX,
                y: centerY - tileCenterY,
                version: panVersionRef.current,
            });
            setSelectedTileId(tile._id);
        },
        [zoom]
    );

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setSearchFocusIndex(0);
        setSemanticResultIds(null);
        setSemanticScores(new Map());
    };

    // Jump to focused search result whenever it changes
    useEffect(() => {
        if (focusedSearchTile) {
            jumpToTile(focusedSearchTile);
        }
    }, [focusedSearchTile, jumpToTile]);

    const handleSearchNext = () => {
        if (searchResults.length <= 1) return;
        setSearchFocusIndex((prev) => (prev + 1) % searchResults.length);
    };

    const handleSearchPrev = () => {
        if (searchResults.length <= 1) return;
        setSearchFocusIndex(
            (prev) => (prev - 1 + searchResults.length) % searchResults.length
        );
    };

    const handleSemanticSearch = async () => {
        if (!id || searchQuery.trim().length < 2) return;
        setIsSemanticSearching(true);
        try {
            const data = await tileAPI.semanticSearch(id, searchQuery);
            const ids = data.results.map((r) => r._id);
            const scores = new Map(data.results.map((r) => [r._id, r.score]));
            setSemanticResultIds(ids);
            setSemanticScores(scores);
            setSearchFocusIndex(0);
            if (ids.length === 0) {
                toast.info('No semantically similar tiles found');
            }
        } catch (err: unknown) {
            console.error('Semantic search error:', err);
            const msg =
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? 'Semantic search failed';
            toast.error(msg);
            setSemanticResultIds(null);
        } finally {
            setIsSemanticSearching(false);
        }
    };

    const handleZoomIn = () =>
        setZoom((z) => Math.min(2, parseFloat((z + 0.25).toFixed(2))));
    const handleZoomOut = () =>
        setZoom((z) => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))));

    // Undo/Redo history
    const [history, setHistory] = useState<Tile[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [undoRedoKey, setUndoRedoKey] = useState(0);

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

    const handleUndo = useCallback(() => {
        if (historyIndex > 0 && !isSyncing) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const restoredTiles = JSON.parse(JSON.stringify(history[newIndex]));
            setTiles(restoredTiles);
            setUndoRedoKey((k) => k + 1);

            // Debounced sync to backend
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(() => {
                syncTilesToBackend(restoredTiles);
            }, 1000);

            toast.success('Undo');
        }
    }, [historyIndex, isSyncing, history, syncTilesToBackend]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1 && !isSyncing) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const restoredTiles = JSON.parse(JSON.stringify(history[newIndex]));
            setTiles(restoredTiles);
            setUndoRedoKey((k) => k + 1);

            // Debounced sync to backend
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(() => {
                syncTilesToBackend(restoredTiles);
            }, 1000);

            toast.success('Redo');
        }
    }, [historyIndex, history, isSyncing, syncTilesToBackend]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;

            // Ctrl+F: focus search bar (checked before isEditing guard)
            if (ctrl && e.key === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
                searchInputRef.current?.select();
                return;
            }

            // Skip when typing in an input, textarea, or contentEditable
            const tag = (document.activeElement as HTMLElement)?.tagName;
            const isEditing =
                tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                (document.activeElement as HTMLElement)?.isContentEditable;
            if (isEditing) return;

            if (ctrl && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (
                ctrl &&
                (e.key === 'y' || (e.shiftKey && e.key === 'Z'))
            ) {
                e.preventDefault();
                handleRedo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo]);

    useEffect(() => {
        let cancelled = false;

        const backfillLinkMetadata = async (tilesData: Tile[]) => {
            if (!id) return;

            const linkTilesNeedingMetadata = tilesData.filter(
                (tile) =>
                    tile.type === 'link' &&
                    !!tile.data?.linkUrl &&
                    tile.data.linkUrl.startsWith('http') &&
                    (!tile.data?.thumbnailUrl ||
                        !tile.data?.linkTitle)
            );

            if (linkTilesNeedingMetadata.length === 0) return;

            const mergedUpdates = new Map<string, Tile['data']>();
            const batchSize = 4;

            for (
                let i = 0;
                i < linkTilesNeedingMetadata.length;
                i += batchSize
            ) {
                if (cancelled) return;

                const batch = linkTilesNeedingMetadata.slice(i, i + batchSize);
                const batchResults = await Promise.allSettled(
                    batch.map(async (tile) => {
                        const metadata = await metadataAPI.fetchMetadata(
                            tile.data.linkUrl!
                        );

                        const nextData: Tile['data'] = {
                            ...(tile.data || {}),
                            linkTitle:
                                tile.data?.linkTitle || metadata.title || '',
                            linkDescription:
                                tile.data?.linkDescription ||
                                metadata.description ||
                                '',
                            thumbnailUrl:
                                tile.data?.thumbnailUrl || metadata.image || '',
                            author: tile.data?.author || metadata.author || '',
                            publishDate:
                                tile.data?.publishDate || metadata.date || '',
                        };

                        const hasChanges =
                            (tile.data?.linkTitle || '') !==
                                (nextData.linkTitle || '') ||
                            (tile.data?.linkDescription || '') !==
                                (nextData.linkDescription || '') ||
                            (tile.data?.thumbnailUrl || '') !==
                                (nextData.thumbnailUrl || '') ||
                            (tile.data?.author || '') !==
                                (nextData.author || '') ||
                            (tile.data?.publishDate || '') !==
                                (nextData.publishDate || '');

                        if (!hasChanges) {
                            return null;
                        }

                        await tileAPI.updateTile(id, tile._id, {
                            data: nextData,
                        });

                        return {
                            tileId: tile._id,
                            data: nextData,
                        };
                    })
                );

                batchResults.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value) {
                        mergedUpdates.set(
                            result.value.tileId,
                            result.value.data
                        );
                    }
                });
            }

            if (!cancelled && mergedUpdates.size > 0) {
                setTiles((prev) =>
                    prev.map((tile) => {
                        const updatedData = mergedUpdates.get(tile._id);
                        if (!updatedData) return tile;
                        return {
                            ...tile,
                            data: {
                                ...tile.data,
                                ...updatedData,
                            },
                        };
                    })
                );
            }
        };

        const fetchData = async () => {
            if (!id) return;

            try {
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

                setLoading(false);

                setTimeout(() => {
                    void backfillLinkMetadata(tilesData);
                }, 100);
            } catch (error) {
                console.error('Failed to fetch board:', error);
                toast.error('Failed to load board');
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <Toolbar />
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

        try {
            // Default tile size
            const defaultSize = {
                width: 240,
                height: 200,
            };

            // Position at center of viewport
            // For now, position at a simple default location
            const position = {
                x: 200,
                y: 200,
            };

            const newTile = await tileAPI.createTile(id, {
                type,
                position,
                size: defaultSize,
                style: {
                    backgroundColor:
                        lastUsedColor || board?.settings.tileColor || '#FBBF24',
                    textColor: '#000000',
                },
                data: {},
            });

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

        // Optimistic update - update UI immediately
        const optimisticTiles = tiles.map((tile) =>
            tile._id === tileId ? { ...tile, ...updates } : tile
        );
        setTiles(optimisticTiles);
        saveToHistory(optimisticTiles);

        // Then sync with backend
        try {
            await tileAPI.updateTile(id, tileId, updates);
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
            // Clear selection if deleted tile was selected
            if (selectedTileId === tileId) {
                setSelectedTileId(null);
            }
            setSelectedTileIds((prev) => {
                const next = new Set(prev);
                next.delete(tileId);
                return next;
            });
        } catch (error) {
            console.error('Failed to delete tile:', error);
            toast.error('Failed to delete tile');
        }
    };

    const handleTileClick = (tileId: string, ctrlKey: boolean) => {
        if (ctrlKey) {
            setSelectedTileIds((prev) => {
                const next = new Set(prev);
                if (next.has(tileId)) {
                    next.delete(tileId);
                } else {
                    next.add(tileId);
                }
                return next;
            });
        } else {
            setSelectedTileIds(new Set([tileId]));
        }
        setSelectedTileId(tileId);
    };

    const handleCanvasClick = () => {
        setSelectedTileIds(new Set());
        setSelectedTileId(null);
    };

    const handleBringToFront = () => {
        if (!selectedTileId) return;
        const maxZ = Math.max(...tiles.map((t) => t.zIndex ?? 1), 0);
        handleTileUpdate(selectedTileId, { zIndex: maxZ + 1 });
    };

    const handleSendToBack = () => {
        if (!selectedTileId) return;
        const minZ = Math.min(...tiles.map((t) => t.zIndex ?? 1), 0);
        handleTileUpdate(selectedTileId, { zIndex: minZ - 1 });
    };

    const handleContextMenuDelete = async (tileId: string) => {
        const idsToDelete =
            selectedTileIds.has(tileId) && selectedTileIds.size > 1
                ? Array.from(selectedTileIds)
                : [tileId];
        for (const id of idsToDelete) {
            await handleDeleteTile(id);
        }
    };

    const handleContextMenuDuplicate = async (tileId: string) => {
        if (!id) return;
        const idsToClone =
            selectedTileIds.has(tileId) && selectedTileIds.size > 1
                ? Array.from(selectedTileIds)
                : [tileId];
        try {
            const cloned: Tile[] = [];
            for (const tid of idsToClone) {
                const src = tiles.find((t) => t._id === tid);
                if (!src) continue;
                const newTile = await tileAPI.createTile(id, {
                    type: src.type,
                    position: {
                        x: src.position.x + 20,
                        y: src.position.y + 20,
                    },
                    size: src.size,
                    style: src.style,
                    data: src.data,
                });
                cloned.push(newTile);
            }
            const newTiles = [...tiles, ...cloned];
            setTiles(newTiles);
            saveToHistory(newTiles);
            toast.success(
                `Duplicated ${cloned.length} tile${cloned.length > 1 ? 's' : ''}`
            );
        } catch (error) {
            console.error('Failed to duplicate tile:', error);
            toast.error('Failed to duplicate tile');
        }
    };

    const handleContextMenuBringToFront = (tileId: string) => {
        const maxZ = Math.max(...tiles.map((t) => t.zIndex ?? 1), 0);
        handleTileUpdate(tileId, { zIndex: maxZ + 1 });
    };

    const handleContextMenuSendToBack = (tileId: string) => {
        const minZ = Math.min(...tiles.map((t) => t.zIndex ?? 1), 0);
        handleTileUpdate(tileId, { zIndex: minZ - 1 });
    };

    const handleContextMenuColorChange = (tileId: string, color: string) => {
        setLastUsedColor(color);
        handleTileUpdate(tileId, {
            style: {
                ...tiles.find((t) => t._id === tileId)?.style,
                backgroundColor: color,
            },
        });
    };

    const handleSelectAll = () => {
        setSelectedTileIds(new Set(tiles.map((t) => t._id)));
        if (tiles.length > 0) setSelectedTileId(tiles[0]._id);
    };

    const handleDeselectAll = () => {
        setSelectedTileIds(new Set());
        setSelectedTileId(null);
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    const handleCreateTileAtPosition = async (
        type: 'text' | 'image' | 'link',
        position: { x: number; y: number }
    ) => {
        if (!id) return;
        try {
            const newTile = await tileAPI.createTile(id, {
                type,
                position,
                size: { width: 240, height: 200 },
                style: {
                    backgroundColor:
                        lastUsedColor || board?.settings.tileColor || '#FBBF24',
                    textColor: '#000000',
                },
                data: {},
            });
            const newTiles = [...tiles, newTile];
            setTiles(newTiles);
            saveToHistory(newTiles);
            toast.success(`${type} tile created`);
        } catch (error) {
            console.error('Failed to create tile:', error);
            toast.error('Failed to create tile');
        }
    };

    const handleColorChange = (color: string) => {
        if (!selectedTileId) {
            toast.error('No tile selected');
            return;
        }

        // Remember this color for new tiles
        setLastUsedColor(color);

        // Update the selected tile's background color
        handleTileUpdate(selectedTileId, {
            style: {
                ...tiles.find((t) => t._id === selectedTileId)?.style,
                backgroundColor: color,
            },
        });
        toast.success('Color changed');
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
                    backgroundColor:
                        lastUsedColor || board?.settings.tileColor || '#FBBF24',
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
                onCreateTile={handleCreateTile}
                isDeleteMode={isDeleteMode}
                onToggleDelete={handleToggleDelete}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0 && !isSyncing}
                canRedo={historyIndex < history.length - 1 && !isSyncing}
                onColorChange={handleColorChange}
                hasSelectedTile={selectedTileId !== null}
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onBringToFront={handleBringToFront}
                onSendToBack={handleSendToBack}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                searchMatchCount={searchResults.length}
                searchFocusIndex={searchFocusIndex}
                onSearchNext={handleSearchNext}
                onSearchPrev={handleSearchPrev}
                onSemanticSearch={handleSemanticSearch}
                isSemanticSearching={isSemanticSearching}
                searchInputRef={searchInputRef}
            />
            <div ref={canvasContainerRef} className="flex-1 flex flex-col">
                <Canvas
                    tiles={tiles}
                    onTileUpdate={handleTileUpdate}
                    isDeleteMode={isDeleteMode}
                    onDeleteTile={handleDeleteTile}
                    onCreateTileFromDrop={handleCreateTileFromDrop}
                    onTileClick={handleTileClick}
                    onCanvasClick={handleCanvasClick}
                    selectedTileIds={selectedTileIds}
                    zoom={zoom}
                    background={board?.settings?.background}
                    searchMatchIds={searchMatchIds}
                    focusedSearchId={focusedSearchTile?._id ?? null}
                    targetPan={targetPan}
                    semanticRankMap={semanticRankMap}
                    semanticScoreMap={semanticScoreMap}
                    undoRedoKey={undoRedoKey}
                    onContextMenuDelete={handleContextMenuDelete}
                    onContextMenuDuplicate={handleContextMenuDuplicate}
                    onContextMenuBringToFront={handleContextMenuBringToFront}
                    onContextMenuSendToBack={handleContextMenuSendToBack}
                    onContextMenuColorChange={handleContextMenuColorChange}
                    onContextMenuSelectAll={handleSelectAll}
                    onContextMenuDeselect={handleDeselectAll}
                    onContextMenuCreateTile={handleCreateTileAtPosition}
                    onContextMenuUndo={handleUndo}
                    onContextMenuRedo={handleRedo}
                    canUndo={historyIndex > 0 && !isSyncing}
                    canRedo={historyIndex < history.length - 1 && !isSyncing}
                    onContextMenuZoomIn={handleZoomIn}
                    onContextMenuZoomOut={handleZoomOut}
                    onContextMenuResetZoom={handleResetZoom}
                />
            </div>
        </div>
    );
};

export default Board;
