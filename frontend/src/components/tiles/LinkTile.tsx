import { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Tile } from '@/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { metadataAPI } from '@/services/api';
import { toast } from 'sonner';

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
    const [thumbnailUrl, setThumbnailUrl] = useState(
        tile.data?.thumbnailUrl || ''
    );
    const [author, setAuthor] = useState(tile.data?.author || '');
    const [publishDate, setPublishDate] = useState(
        tile.data?.publishDate || ''
    );
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && urlInputRef.current) {
            urlInputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        if (onUpdate) {
            onUpdate({
                data: {
                    ...(tile.data || {}),
                    linkUrl: linkUrl.trim(),
                    linkTitle: linkTitle.trim(),
                    linkDescription: linkDescription.trim(),
                    thumbnailUrl: thumbnailUrl.trim(),
                    author: author.trim(),
                    publishDate: publishDate.trim(),
                },
            });
        }
    };

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
    }, [
        isEditing,
        linkUrl,
        linkTitle,
        linkDescription,
        thumbnailUrl,
        author,
        publishDate,
        onUpdate,
        tile.data,
    ]);

    // Auto-fetch metadata when URL changes
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!linkUrl || !linkUrl.startsWith('http')) return;
            if (linkTitle.trim()) return;

            setIsLoadingMetadata(true);
            toast.loading('Fetching link metadata...');
            try {
                const metadata = await metadataAPI.fetchMetadata(linkUrl);
                setLinkTitle(metadata.title || '');
                setLinkDescription(metadata.description || '');
                setThumbnailUrl(metadata.image || '');
                setAuthor(metadata.author || '');
                setPublishDate(metadata.date || '');
                toast.dismiss();
                toast.success('Metadata loaded');
            } catch (error) {
                console.error('Failed to fetch metadata:', error);
                toast.dismiss();
                toast.error('Failed to fetch metadata');
            } finally {
                setIsLoadingMetadata(false);
            }
        };

        const timer = setTimeout(fetchMetadata, 500);
        return () => clearTimeout(timer);
    }, [linkUrl]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    return (
        <Card
            ref={containerRef}
            className="h-full w-full cursor-pointer p-0 gap-0"
            style={{ backgroundColor: tile.style.backgroundColor }}
            onClick={handleClick}
        >
            <ScrollArea className="h-full w-full">
                {isEditing ? (
                    <div className="pt-1 pb-3 px-1.5 space-y-1">
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
                            className="w-full text-lg font-bold bg-transparent border-b-2 border-black outline-none pb-1"
                            disabled={isLoadingMetadata}
                        />
                        <textarea
                            value={linkDescription}
                            onChange={(e) => setLinkDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full bg-transparent outline-none resize-none min-h-[100px]"
                            rows={3}
                            disabled={isLoadingMetadata}
                        />
                    </div>
                ) : (
                    <div
                        className="pt-1 pb-3 px-1.5 space-y-1"
                        style={{
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                        }}
                    >
                        {thumbnailUrl && (
                            <div className="flex justify-center">
                                <img
                                    src={thumbnailUrl}
                                    alt={linkTitle || 'Link preview'}
                                    className="max-w-full h-auto max-h-48 rounded-base border-2 border-border"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        {linkTitle && (
                            <h3 className="text-lg font-bold">{linkTitle}</h3>
                        )}
                        {(author || publishDate) && (
                            <p className="text-xs text-gray-500">
                                {author && <span>by {author}</span>}
                                {author && publishDate && <span> • </span>}
                                {publishDate && (
                                    <span>
                                        {new Date(
                                            publishDate
                                        ).toLocaleDateString()}
                                    </span>
                                )}
                            </p>
                        )}
                        {linkDescription && (
                            <p className="whitespace-pre-wrap">
                                {linkDescription}
                            </p>
                        )}
                        <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">
                                {linkUrl || 'Click to add link...'}
                            </span>
                        </a>
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};

export default LinkTile;
