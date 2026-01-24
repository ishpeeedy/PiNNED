import { useRef, useState, useEffect } from 'react';
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
    const [caption, setCaption] = useState(tile.data?.caption || '');
    const [isEditingCaption, setIsEditingCaption] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const captionInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    console.log('ImageTile rendering:', { imageUrl, data: tile.data });

    useEffect(() => {
        if (isEditingCaption && captionInputRef.current) {
            captionInputRef.current.focus();
        }
    }, [isEditingCaption]);

    const handleSaveCaption = () => {
        setIsEditingCaption(false);
        if (onUpdate) {
            onUpdate({
                data: {
                    ...(tile.data || {}),
                    caption: caption.trim(),
                },
            });
        }
    };

    useEffect(() => {
        if (!isEditingCaption) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsEditingCaption(false);
                if (onUpdate) {
                    onUpdate({
                        data: {
                            ...(tile.data || {}),
                            caption: caption.trim(),
                        },
                    });
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditingCaption, caption, onUpdate, tile.data]);

    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!imageUrl) {
            // No image: trigger file upload
            fileInputRef.current?.click();
        } else if (!caption) {
            // Has image but no caption: enter caption edit mode
            setIsEditingCaption(true);
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
        <Card
            ref={containerRef}
            className="h-full w-full overflow-hidden cursor-pointer p-0 gap-0 flex flex-col"
            style={{ backgroundColor: tile.style.backgroundColor }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {imageUrl ? (
                <>
                    <img
                        src={imageUrl}
                        alt={caption || 'Image'}
                        className="w-full object-cover flex-shrink-0"
                        style={{
                            maxHeight:
                                isEditingCaption || caption
                                    ? 'calc(100% - 32px)'
                                    : '100%',
                        }}
                        onClick={handleImageClick}
                    />
                    {isEditingCaption ? (
                        <div
                            className="pt-1 pb-3 px-1.5"
                            style={{
                                backgroundColor: tile.style.backgroundColor,
                            }}
                        >
                            <input
                                ref={captionInputRef}
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add caption..."
                                className="w-full text-sm text-black bg-transparent border-b-2 border-black outline-none pb-1"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveCaption();
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        caption && (
                            <div
                                className="pt-1 pb-3 px-1.5"
                                style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    backgroundColor: tile.style.backgroundColor,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditingCaption(true);
                                }}
                            >
                                <p className="text-sm text-black">
                                    {caption}
                                </p>
                            </div>
                        )
                    )}
                </>
            ) : (
                <div
                    className="h-full w-full flex items-center justify-center text-foreground/40 text-sm hover:bg-foreground/5"
                    onClick={handleImageClick}
                >
                    Click to add image
                </div>
            )}
        </Card>
    );
};

export default ImageTile;
