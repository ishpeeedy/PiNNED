import { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Tile } from '@/types';
import { Card } from '@/components/ui/card';

interface LinkTileProps {
    tile: Tile;
    onUpdate?: (updates: Partial<Tile>) => void;
}

const LinkTile = ({ tile, onUpdate }: LinkTileProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [linkUrl, setLinkUrl] = useState(tile.data?.linkUrl || '');
    const [linkTitle, setLinkTitle] = useState(tile.data?.linkTitle || '');
    const [linkDescription, setLinkDescription] = useState(
        tile.data?.linkDescription || ''
    );
    const urlInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    console.log('LinkTile rendering:', {
        isEditing,
        linkUrl,
        linkTitle,
        data: tile.data,
    });

    useEffect(() => {
        if (isEditing && urlInputRef.current) {
            urlInputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                handleSave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing, linkUrl, linkTitle, linkDescription]);

    const handleSave = () => {
        setIsEditing(false);
        if (onUpdate) {
            onUpdate({
                data: {
                    ...(tile.data || {}),
                    linkUrl: linkUrl.trim(),
                    linkTitle: linkTitle.trim(),
                    linkDescription: linkDescription.trim(),
                },
            });
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditing && linkUrl) {
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
        } else if (!isEditing) {
            setIsEditing(true);
        }
    };

    return (
        <div ref={containerRef} className="h-full w-full">
            {isEditing ? (
                <Card
                    className="h-full w-full cursor-pointer"
                    style={{ backgroundColor: tile.style.backgroundColor }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 space-y-2">
                        <input
                            ref={urlInputRef}
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full text-sm bg-transparent border-b-2 border-black outline-none pb-1"
                        />
                        <input
                            type="text"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                            placeholder="Link title (optional)"
                            className="w-full font-bold bg-transparent border-b-2 border-black outline-none pb-1"
                        />
                        <textarea
                            value={linkDescription}
                            onChange={(e) => setLinkDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full text-sm bg-transparent outline-none resize-none"
                            rows={3}
                        />
                    </div>
                </Card>
            ) : (
                <Card
                    className="h-full w-full cursor-pointer"
                    style={{ backgroundColor: tile.style.backgroundColor }}
                    onClick={handleClick}
                >
                    <div className="p-4 space-y-2">
                        {linkTitle && (
                            <h3 className="font-bold text-base">{linkTitle}</h3>
                        )}
                        {linkDescription && (
                            <p className="text-sm text-gray-700">
                                {linkDescription}
                            </p>
                        )}
                        <div className="flex items-center gap-1 text-blue-600 text-sm">
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate">
                                {linkUrl || 'Click to add link...'}
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default LinkTile;
