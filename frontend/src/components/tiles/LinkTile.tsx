import { useState, useRef, useEffect } from 'react';
import type { Tile } from '@/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { metadataAPI } from '@/services/api';
import { toast } from 'sonner';
import loaderSvg from '@/assets/loader.svg';

interface LinkTileProps {
    tile: Tile;
    onUpdate?: (updates: Partial<Tile>) => void;
}

type LimitedProvider =
    | 'instagram'
    | 'x'
    | 'twitter'
    | 'facebook'
    | 'reddit'
    | null;

function getLimitedProviderFromUrl(url: string): LimitedProvider {
    if (!url) return null;

    try {
        const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();

        if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
            return 'instagram';
        }
        if (host === 'x.com' || host.endsWith('.x.com')) return 'x';
        if (host === 'twitter.com' || host.endsWith('.twitter.com')) {
            return 'twitter';
        }
        if (host === 'facebook.com' || host.endsWith('.facebook.com')) {
            return 'facebook';
        }
        if (host === 'reddit.com' || host.endsWith('.reddit.com')) {
            return 'reddit';
        }

        return null;
    } catch {
        return null;
    }
}

function getLimitedProviderLabel(provider: LimitedProvider): string {
    if (!provider) return 'This provider has limited public previews';
    if (provider === 'x') return 'X limits unauthenticated metadata previews';
    if (provider === 'twitter') {
        return 'Twitter limits unauthenticated metadata previews';
    }

    return `${provider.charAt(0).toUpperCase()}${provider.slice(1)} limits unauthenticated metadata previews`;
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
    const [thumbnailFailed, setThumbnailFailed] = useState(false);
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
    const urlInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLimitedMetadata, setIsLimitedMetadata] = useState(false);

    useEffect(() => {
        if (isEditing && urlInputRef.current) {
            urlInputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        if (isEditing) return;

        setLinkUrl(tile.data?.linkUrl || '');
        setLinkTitle(tile.data?.linkTitle || '');
        setLinkDescription(tile.data?.linkDescription || '');
        setThumbnailUrl(tile.data?.thumbnailUrl || '');
        setAuthor(tile.data?.author || '');
        setPublishDate(tile.data?.publishDate || '');
        setIsLimitedMetadata(false);
    }, [
        isEditing,
        tile.data?.linkUrl,
        tile.data?.linkTitle,
        tile.data?.linkDescription,
        tile.data?.thumbnailUrl,
        tile.data?.author,
        tile.data?.publishDate,
    ]);

    useEffect(() => {
        setThumbnailFailed(false);
    }, [thumbnailUrl]);

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
                const nextTitle = metadata.title || '';
                const nextDescription = metadata.description || '';
                const nextImage = metadata.image || '';
                const nextAuthor = metadata.author || '';
                const nextDate = metadata.date || '';

                setLinkTitle(nextTitle);
                setLinkDescription(nextDescription);
                setThumbnailUrl(nextImage);
                setAuthor(nextAuthor);
                setPublishDate(nextDate);

                const hasPreviewData =
                    metadata.hasPreviewData ??
                    Boolean(
                        nextTitle ||
                        nextDescription ||
                        nextImage ||
                        nextAuthor ||
                        nextDate
                    );
                const providerIsLimited =
                    metadata.isLimited ??
                    Boolean(getLimitedProviderFromUrl(linkUrl));
                setIsLimitedMetadata(providerIsLimited && !hasPreviewData);

                toast.dismiss();
                if (hasPreviewData) {
                    toast.success('Metadata loaded');
                } else if (providerIsLimited) {
                    toast.info('Limited preview: provider restricts metadata');
                } else {
                    toast.warning(
                        'No preview metadata available for this link'
                    );
                }
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

    const limitedProvider = getLimitedProviderFromUrl(linkUrl);
    const showLimitedFallback =
        !isEditing &&
        !!linkUrl &&
        (isLimitedMetadata ||
            (limitedProvider &&
                !thumbnailUrl &&
                !linkTitle &&
                !linkDescription &&
                !author &&
                !publishDate));

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
                            className="w-full text-sm text-black bg-transparent border-b-2 border-black outline-none pb-1"
                        />
                        {isLoadingMetadata && (
                            <p className="text-xs text-foreground/60">
                                Loading metadata...
                            </p>
                        )}
                        <input
                            type="text"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                            placeholder="Link title (optional)"
                            className="w-full text-lg font-bold text-black bg-transparent border-b-2 border-black outline-none pb-1"
                            disabled={isLoadingMetadata}
                        />
                        <textarea
                            value={linkDescription}
                            onChange={(e) => setLinkDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full text-black bg-transparent outline-none resize-none min-h-[100px]"
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
                        {showLimitedFallback ? (
                            <div className="rounded-base border-2 border-border bg-black/5 p-3 space-y-1">
                                <div className="text-xs uppercase tracking-wide font-semibold text-black/80">
                                    Limited Preview
                                </div>
                                <p className="text-sm text-black">
                                    {getLimitedProviderLabel(limitedProvider)}
                                </p>
                            </div>
                        ) : thumbnailUrl && !thumbnailFailed ? (
                            <div className="flex justify-center">
                                <img
                                    src={thumbnailUrl}
                                    alt={linkTitle || 'Link preview'}
                                    className="max-w-full h-auto max-h-48 rounded-base border-2 border-border"
                                    onError={() => {
                                        setThumbnailFailed(true);
                                    }}
                                />
                            </div>
                        ) : linkUrl ? (
                            <div className="flex justify-center">
                                <img
                                    src={loaderSvg}
                                    alt="Thumbnail unavailable"
                                    className="max-w-full h-auto max-h-48 rounded-base border-2 border-border p-4"
                                />
                            </div>
                        ) : null}
                        {linkTitle && (
                            <h3 className="text-lg font-bold text-black">
                                {linkTitle}
                            </h3>
                        )}
                        {(author || publishDate) && (
                            <p className="text-xs text-black">
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
                            <p className="whitespace-pre-wrap text-black">
                                {linkDescription}
                            </p>
                        )}
                        <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline break-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {linkUrl || 'Click to add link...'}
                        </a>
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
};

export default LinkTile;
