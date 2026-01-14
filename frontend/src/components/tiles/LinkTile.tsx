import { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Tile } from '@/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { metadataAPI } from '@/services/api';

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
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
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

    // Auto-fetch metadata when URL changes
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!linkUrl || !linkUrl.startsWith('http')) return;

            // Don't fetch if title is already set (user manually entered it)
            if (linkTitle.trim()) return;

            setIsLoadingMetadata(true);
            try {
                const metadata = await metadataAPI.fetchMetadata(linkUrl);
                setLinkTitle(metadata.title || '');
                setLinkDescription(metadata.description || '');
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        const timer = setTimeout(fetchMetadata, 500); // Debounce
        return () => clearTimeout(timer);
    }, [linkUrl]);

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
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
            window.open(linkUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Card
            ref={containerRef}
            className="h-full w-full cursor-pointer"
            style={{ backgroundColor: tile.style.backgroundColor }}
            onClick={handleClick}
        >
            <ScrollArea className="h-full w-full">
                {isEditing ? (
                    <div className="p-4 space-y-2 w-full">
                        <input
                            ref={urlInputRef}
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full text-sm bg-transparent border-b-2 border-black outline-none pb-1"
                        />
                        {isLoadingMetadata && (
                            <p className="text-xs text-gray-500">
                                Loading metadata...
                            </p>
                        )}
                        <input
                            type="text"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                            placeholder="Link title (optional)"
                            className="w-full font-bold bg-transparent border-b-2 border-black outline-none pb-1"
                            disabled={isLoadingMetadata}
                        />
                        <textarea
                            value={linkDescription}
                            onChange={(e) => setLinkDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full text-sm bg-transparent outline-none resize-none"
                            rows={3}
                            disabled={isLoadingMetadata}
                        />
                    </div>
                ) : (
                    <div className="p-4 space-y-2 w-full">
                        {linkTitle && (
                            <h3 className="font-bold text-base break-words overflow-wrap-anywhere">
                                {linkTitle}
                            </h3>
                        )}
                        {linkDescription && (
                            <p className="text-sm text-gray-700 break-words overflow-wrap-anywhere">
                                {linkDescription}
                            </p>
                        )}
                        <div
                            className="flex items-center gap-1 text-blue-600 text-sm cursor-pointer hover:underline"
                            onClick={handleLinkClick}
                            title="Ctrl+Click to open"
                        >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                                {linkUrl || 'Click to add link...'}
                            </span>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};

export default LinkTile;
