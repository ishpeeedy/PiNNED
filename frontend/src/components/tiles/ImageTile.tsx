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
    const [uploading, setUploading] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const captionInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    console.log('ImageTile rendering:', { imageUrl, data: tile.data });

    // Reset imageLoaded when URL changes
    useEffect(() => {
        setImageLoaded(false);
    }, [imageUrl]);

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
        } else {
            // Has image: enter caption edit mode
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
            setUploading(true);
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
            const cloudinaryPublicId = response.data.publicId;

            // Update tile with image URL and Cloudinary public ID
            if (onUpdate) {
                onUpdate({
                    data: {
                        ...(tile.data || {}),
                        imageUrl,
                        cloudinaryPublicId,
                    },
                });
            }

            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card
            ref={containerRef}
            className="h-full w-full overflow-hidden cursor-pointer p-0 gap-0 flex flex-col relative"
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
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <svg
                                width="976"
                                height="289"
                                viewBox="0 0 976 289"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-[60%] max-w-[120px] opacity-40"
                            >
                                <path
                                    d="M78.4609 3C98.1548 3 113.531 4.53885 124.423 7.73535H124.422C135.327 10.9022 143.803 15.5633 149.539 21.9111C155.272 28.1319 159.089 35.6715 161.02 44.4463L161.206 45.2617C163.1 53.8254 164.005 66.5993 164.005 83.417V107.514C164.005 125.259 162.191 138.671 158.271 147.369C154.263 156.263 146.915 162.94 136.594 167.503C126.385 172.067 113.218 174.259 97.2598 174.259H80.9482V285.685H3V3H78.4609ZM253.727 52.9023V285.685H176.633V52.9023H253.727ZM340.066 3L340.739 5.07617L375.217 111.576V3H441.373V285.685H373.074L372.437 283.54L340.885 177.503V285.685H274.729V3H340.066ZM529.764 3L530.437 5.07617L564.914 111.576V3H631.07V285.685H562.771L562.134 283.54L530.582 177.503V285.685H464.426V3H529.764ZM780.094 3V64.3711H732.071V110.837H777.018V169.474H732.071V224.313H784.879V285.685H654.123V3H780.094ZM856.562 3C891.261 3 915.103 4.58021 927.724 7.88086C940.432 11.1756 950.373 16.6648 957.257 24.5322C963.973 32.2079 968.218 40.847 969.915 50.416L970.066 51.3027C971.613 60.7282 972.354 78.2346 972.354 103.583V200.482C972.354 225.24 971.177 242.276 968.658 251.177C966.241 260.001 961.895 267.119 955.539 272.354L955.525 272.365L955.512 272.376C949.288 277.379 941.674 280.856 932.762 282.876L932.725 282.884C923.861 284.775 910.729 285.685 893.476 285.685H799.729V3H856.562ZM877.677 232.279C881.261 232.117 884.123 231.657 886.319 230.951C889.085 230.062 890.521 228.879 891.218 227.692C892.072 226.172 892.93 222.858 893.525 217.215C894.108 211.695 894.406 204.364 894.406 195.185V87.6895C894.406 75.0643 893.992 67.3945 893.283 64.2539C892.65 61.4508 891.296 59.6509 889.275 58.5195L889.236 58.498L889.197 58.4746C888.245 57.9031 886.624 57.3425 884.116 56.9424C882.325 56.6565 880.183 56.4688 877.677 56.3867V232.279ZM80.9482 120.88C81.7872 120.907 82.5528 120.92 83.2461 120.92C89.5082 120.92 92.9003 119.392 94.5586 117.281L94.5674 117.271C95.4454 116.163 96.3056 114.186 96.9209 111.003C97.5268 107.868 97.8486 103.816 97.8486 98.7979V76.0684C97.8486 71.4729 97.4864 67.8277 96.8213 65.0645C96.1478 62.2671 95.228 60.6406 94.3262 59.7734C93.3913 58.8745 91.7015 57.9803 88.8926 57.3301C86.7575 56.8359 84.1188 56.516 80.9482 56.3945V120.88ZM253.727 3V45.0596H176.633V3H253.727Z"
                                    fill="#A985FF"
                                    stroke="white"
                                    strokeWidth="6"
                                    style={{
                                        strokeDashoffset: '0px',
                                        strokeDasharray: '0px, 6645.25px',
                                        animation:
                                            'loader-stroke 50s linear 0s 1 normal forwards',
                                    }}
                                />
                            </svg>
                        </div>
                    )}
                    <img
                        src={imageUrl}
                        alt={caption || 'Image'}
                        className={`w-full object-cover flex-shrink-0 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            maxHeight:
                                isEditingCaption || caption
                                    ? 'calc(100% - 32px)'
                                    : '100%',
                        }}
                        onClick={handleImageClick}
                        onLoad={() => setImageLoaded(true)}
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
                                <p className="text-sm text-black">{caption}</p>
                            </div>
                        )
                    )}
                </>
            ) : (
                <div
                    className="h-full w-full flex flex-col items-center justify-center text-foreground/40 text-sm hover:bg-foreground/5 gap-2"
                    onClick={handleImageClick}
                >
                    <svg
                        width="976"
                        height="289"
                        viewBox="0 0 976 289"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-[60%] max-w-[120px] opacity-40"
                    >
                        <path
                            d="M78.4609 3C98.1548 3 113.531 4.53885 124.423 7.73535H124.422C135.327 10.9022 143.803 15.5633 149.539 21.9111C155.272 28.1319 159.089 35.6715 161.02 44.4463L161.206 45.2617C163.1 53.8254 164.005 66.5993 164.005 83.417V107.514C164.005 125.259 162.191 138.671 158.271 147.369C154.263 156.263 146.915 162.94 136.594 167.503C126.385 172.067 113.218 174.259 97.2598 174.259H80.9482V285.685H3V3H78.4609ZM253.727 52.9023V285.685H176.633V52.9023H253.727ZM340.066 3L340.739 5.07617L375.217 111.576V3H441.373V285.685H373.074L372.437 283.54L340.885 177.503V285.685H274.729V3H340.066ZM529.764 3L530.437 5.07617L564.914 111.576V3H631.07V285.685H562.771L562.134 283.54L530.582 177.503V285.685H464.426V3H529.764ZM780.094 3V64.3711H732.071V110.837H777.018V169.474H732.071V224.313H784.879V285.685H654.123V3H780.094ZM856.562 3C891.261 3 915.103 4.58021 927.724 7.88086C940.432 11.1756 950.373 16.6648 957.257 24.5322C963.973 32.2079 968.218 40.847 969.915 50.416L970.066 51.3027C971.613 60.7282 972.354 78.2346 972.354 103.583V200.482C972.354 225.24 971.177 242.276 968.658 251.177C966.241 260.001 961.895 267.119 955.539 272.354L955.525 272.365L955.512 272.376C949.288 277.379 941.674 280.856 932.762 282.876L932.725 282.884C923.861 284.775 910.729 285.685 893.476 285.685H799.729V3H856.562ZM877.677 232.279C881.261 232.117 884.123 231.657 886.319 230.951C889.085 230.062 890.521 228.879 891.218 227.692C892.072 226.172 892.93 222.858 893.525 217.215C894.108 211.695 894.406 204.364 894.406 195.185V87.6895C894.406 75.0643 893.992 67.3945 893.283 64.2539C892.65 61.4508 891.296 59.6509 889.275 58.5195L889.236 58.498L889.197 58.4746C888.245 57.9031 886.624 57.3425 884.116 56.9424C882.325 56.6565 880.183 56.4688 877.677 56.3867V232.279ZM80.9482 120.88C81.7872 120.907 82.5528 120.92 83.2461 120.92C89.5082 120.92 92.9003 119.392 94.5586 117.281L94.5674 117.271C95.4454 116.163 96.3056 114.186 96.9209 111.003C97.5268 107.868 97.8486 103.816 97.8486 98.7979V76.0684C97.8486 71.4729 97.4864 67.8277 96.8213 65.0645C96.1478 62.2671 95.228 60.6406 94.3262 59.7734C93.3913 58.8745 91.7015 57.9803 88.8926 57.3301C86.7575 56.8359 84.1188 56.516 80.9482 56.3945V120.88ZM253.727 3V45.0596H176.633V3H253.727Z"
                            fill="#A985FF"
                            stroke="white"
                            strokeWidth="6"
                            style={{
                                strokeDashoffset: '0px',
                                strokeDasharray: '0px, 6645.25px',
                                animation:
                                    'loader-stroke 50s linear 0s 1 normal forwards',
                            }}
                        />
                    </svg>
                    {!uploading && <span>Click to add image</span>}
                </div>
            )}
        </Card>
    );
};

export default ImageTile;
