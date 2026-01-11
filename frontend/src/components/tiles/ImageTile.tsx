import type { Tile } from '@/types';
import { Card } from '@/components/ui/card';

interface ImageTileProps {
    tile: Tile;
    onUpdate?: (updates: Partial<Tile>) => void;
}

const ImageTile = ({ tile }: ImageTileProps) => {
    const imageUrl = tile.data?.imageUrl;

    console.log('ImageTile rendering:', { imageUrl, data: tile.data });

    return (
        <Card className="h-full w-full overflow-hidden cursor-pointer p-0 gap-0">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={tile.data?.header || 'Image'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                    Click to add image
                </div>
            )}
        </Card>
    );
};

export default ImageTile;
