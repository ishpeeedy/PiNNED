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
}: ToolbarProps) => {
    console.log('Toolbar isDeleteMode:', isDeleteMode);

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
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/60" />
                    <Input
                        type="text"
                        placeholder="Search tiles..."
                        className="pl-10 text-black"
                        onFocus={() => toast.info('Search (coming soon)')}
                    />
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
