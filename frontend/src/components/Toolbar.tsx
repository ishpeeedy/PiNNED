import { type RefObject } from 'react';
import {
    Type,
    Image,
    Link,
    Undo,
    Redo,
    Search,
    ZoomIn,
    ZoomOut,
    Trash2,
    ArrowUpToLine,
    ArrowDownToLine,
    ChevronLeft,
    ChevronRight,
    X,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ColorPalette from './ColorPalette';

interface ToolbarProps {
    onCreateTile?: (type: 'text' | 'image' | 'link') => void;
    isDeleteMode?: boolean;
    onToggleDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    onColorChange?: (color: string) => void;
    hasSelectedTile?: boolean;
    zoom?: number;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    searchMatchCount?: number;
    searchFocusIndex?: number;
    onSearchNext?: () => void;
    onSearchPrev?: () => void;
    onSemanticSearch?: () => void;
    isSemanticSearching?: boolean;
    searchInputRef?: RefObject<HTMLInputElement>;
}

const Toolbar = ({
    onCreateTile,
    isDeleteMode = false,
    onToggleDelete,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onColorChange,
    hasSelectedTile = false,
    zoom = 1,
    onZoomIn,
    onZoomOut,
    onBringToFront,
    onSendToBack,
    searchQuery = '',
    onSearchChange,
    searchMatchCount = 0,
    searchFocusIndex = 0,
    onSearchNext,
    onSearchPrev,
    onSemanticSearch,
    isSemanticSearching = false,
    searchInputRef,
}: ToolbarProps) => {
    const handleCreateTile = (type: 'text' | 'image' | 'link') => {
        if (isDeleteMode) {
            toast.error('Exit delete mode first');
            return;
        }
        onCreateTile?.(type);
    };

    return (
        <div className="bg-secondary-background border-b-4 border-black px-6 h-[60px] flex items-center gap-4 relative z-10">
            {/* Left: Create Tile Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={() => handleCreateTile('text')}
                    className="gap-2"
                    title="Create text tile"
                    disabled={isDeleteMode}
                >
                    <Type className="w-4 h-4" />
                    Text
                </Button>
                <Button
                    onClick={() => handleCreateTile('image')}
                    className="gap-2"
                    title="Create image tile"
                    disabled={isDeleteMode}
                >
                    <Image className="w-4 h-4" />
                    Image
                </Button>
                <Button
                    onClick={() => handleCreateTile('link')}
                    className="gap-2"
                    title="Create link tile"
                    disabled={isDeleteMode}
                >
                    <Link className="w-4 h-4" />
                    Link
                </Button>

                {/* Separator */}
                <div className="w-px h-8 bg-black mx-2" />

                {/* Color Palette */}
                <ColorPalette
                    onColorChange={(color) => onColorChange?.(color)}
                    disabled={!hasSelectedTile}
                />

                {/* Separator */}
                <div className="w-px h-8 bg-black mx-2" />

                {/* Layer Order */}
                <Button
                    onClick={onBringToFront}
                    disabled={!hasSelectedTile}
                    variant="neutral"
                    className="gap-2"
                    title="Bring to front"
                >
                    <ArrowUpToLine className="w-4 h-4" />
                </Button>
                <Button
                    onClick={onSendToBack}
                    disabled={!hasSelectedTile}
                    variant="neutral"
                    className="gap-2"
                    title="Send to back"
                >
                    <ArrowDownToLine className="w-4 h-4" />
                </Button>

                {/* Separator */}
                <div className="w-px h-8 bg-black mx-2" />

                {/* Undo/Redo/Delete */}
                <Button
                    onClick={onUndo}
                    disabled={!canUndo}
                    variant="neutral"
                    className="gap-2"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </Button>
                <Button
                    onClick={onRedo}
                    disabled={!canRedo}
                    variant="neutral"
                    className="gap-2"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </Button>
                <Button
                    onClick={onToggleDelete}
                    variant="neutral"
                    className="gap-2"
                    title={isDeleteMode ? 'Exit delete mode' : 'Delete tiles'}
                >
                    {isDeleteMode ? 'Done' : <Trash2 className="w-4 h-4" />}
                </Button>
            </div>

            {/* Center: Search */}
            <div className="flex-1 flex justify-center">
                <div className="relative max-w-md w-full flex items-center gap-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/60" />
                        <Input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search tiles..."
                            className="pl-10 pr-8 text-black dark:text-white"
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                        onSearchPrev?.();
                                    } else {
                                        onSearchNext?.();
                                    }
                                }
                                if (e.key === 'Escape') {
                                    onSearchChange?.('');
                                }
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange?.('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={onSemanticSearch}
                        disabled={
                            !searchQuery ||
                            searchQuery.trim().length < 2 ||
                            isSemanticSearching
                        }
                        variant="neutral"
                        className="h-9 w-9 p-0 shrink-0"
                        title="AI semantic search"
                    >
                        {isSemanticSearching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                    </Button>
                    {searchQuery && (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-foreground/60 whitespace-nowrap min-w-[4rem] text-center">
                                {searchMatchCount > 0
                                    ? `${searchFocusIndex + 1} / ${searchMatchCount}`
                                    : 'No results'}
                            </span>
                            <Button
                                onClick={onSearchPrev}
                                disabled={searchMatchCount <= 1}
                                variant="neutral"
                                className="h-8 w-8 p-0"
                                title="Previous match"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={onSearchNext}
                                disabled={searchMatchCount <= 1}
                                variant="neutral"
                                className="h-8 w-8 p-0"
                                title="Next match"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Save Status + Zoom Controls */}
            <div className="flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={onZoomOut}
                        disabled={zoom <= 0.25}
                        variant="neutral"
                        className="gap-2"
                        title="Zoom out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium min-w-[4rem] text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        onClick={onZoomIn}
                        disabled={zoom >= 2}
                        variant="neutral"
                        className="gap-2"
                        title="Zoom in"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
