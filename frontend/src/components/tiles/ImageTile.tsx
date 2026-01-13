import { useRef } from 'react';
import type { Tile } from '@/types';
import { Card } from '@/components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';

interface ImageTileProps {
    tile: Tile;
    onUpdate?: (updates: Partial<Tile>) => void;
}

const ImageTile = ({ tile, onUpdate }: ImageTileProps) => {
    const imageUrl = tile.data?.imageUrl;
    const fileInputRef = useRef<HTMLInputElement>(null);

    console.log('ImageTile rendering:', { imageUrl, data: tile.data });

    const handleImageClick = () => {
        if (!imageUrl) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            toast.info('Uploading image...');

            const formData = new FormData();
            formData.append('image', file);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/upload/image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const imageUrl = response.data.url;
            console.log('Upload successful, image URL:', imageUrl);

            // Update tile with image URL
            if (onUpdate) {
                console.log('Calling onUpdate with imageUrl:', imageUrl);
                onUpdate({
                    data: {
                        ...(tile.data || {}),
                        imageUrl,
                    },
                });
            } else {
                console.log('onUpdate is not defined!');
            }

            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Failed to upload image');
        }
    };

    return (
        <Card className="h-full w-full overflow-hidden cursor-pointer p-0 gap-0">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={tile.data?.header || 'Image'}
                    className="w-full h-full object-cover"
                    onClick={handleImageClick}
                />
            ) : (
                <div
                    className="h-full w-full flex items-center justify-center text-gray-400 text-sm hover:bg-gray-50"
                    onClick={handleImageClick}
                >
                    Click to add image
                </div>
            )}
        </Card>
    );
};

export default ImageTile;
