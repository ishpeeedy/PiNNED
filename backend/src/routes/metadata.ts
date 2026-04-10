import express, { Request, Response } from 'express';
import { createHash } from 'crypto';
import metascraper from 'metascraper';
import metascraperAuthor from 'metascraper-author';
import metascraperDate from 'metascraper-date';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';
import { authenticateToken } from '../middleware/auth';
import MetadataCache from '../models/metadataCache.ts';
import { cacheLinkThumbnail } from '../services/thumbnailCache.ts';

const router = express.Router();

router.use(authenticateToken);

// Initialize metascraper with plugins
const scraper = metascraper([
    metascraperAuthor(),
    metascraperDate(),
    metascraperDescription(),
    metascraperImage(),
    metascraperLogo(),
    metascraperTitle(),
    metascraperUrl(),
]);

type MetadataShape = {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    logo?: string | null;
    author?: string | null;
    date?: string | null;
    url?: string | null;
};

type MetadataResponse = {
    title: string;
    description: string;
    image: string;
    logo: string;
    author: string;
    date: string;
    url: string;
    hasPreviewData: boolean;
    provider: string;
    isLimited: boolean;
};

const REQUEST_TIMEOUT_MS = 10000;
const CACHE_TTL_DAYS = 7;
const EMPTY_CACHE_TTL_HOURS = 24;

const LIMITED_PROVIDERS = new Set([
    'instagram',
    'facebook',
    'x',
    'twitter',
    'reddit',
]);

const YOUTUBE_PROVIDERS = new Set(['youtube', 'youtu.be']);

function toText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function hasAnyPreviewData(metadata: MetadataShape): boolean {
    return Boolean(
        toText(metadata.title) ||
        toText(metadata.description) ||
        toText(metadata.image) ||
        toText(metadata.author) ||
        toText(metadata.date)
    );
}

function isInstagramHost(hostname: string): boolean {
    return hostname === 'instagram.com' || hostname.endsWith('.instagram.com');
}

function getProviderFromHost(hostname: string): string {
    const host = hostname.replace(/^www\./i, '').toLowerCase();

    if (
        host === 'youtu.be' ||
        host.endsWith('.youtube.com') ||
        host === 'youtube.com'
    ) {
        return host === 'youtu.be' ? 'youtu.be' : 'youtube';
    }
    if (host === 'instagram.com' || host.endsWith('.instagram.com'))
        return 'instagram';
    if (host === 'x.com' || host.endsWith('.x.com')) return 'x';
    if (host === 'twitter.com' || host.endsWith('.twitter.com'))
        return 'twitter';
    if (host === 'facebook.com' || host.endsWith('.facebook.com'))
        return 'facebook';
    if (host === 'reddit.com' || host.endsWith('.reddit.com')) return 'reddit';

    return 'generic';
}

function normalizeUrlForCache(parsedUrl: URL): string {
    const normalized = new URL(parsedUrl.toString());
    normalized.hash = '';
    normalized.searchParams.delete('utm_source');
    normalized.searchParams.delete('utm_medium');
    normalized.searchParams.delete('utm_campaign');
    normalized.searchParams.delete('utm_term');
    normalized.searchParams.delete('utm_content');

    const provider = getProviderFromHost(normalized.hostname);
    if (YOUTUBE_PROVIDERS.has(provider)) {
        if (provider === 'youtube' && normalized.pathname === '/watch') {
            const videoId = normalized.searchParams.get('v');
            normalized.search = '';
            if (videoId) {
                normalized.searchParams.set('v', videoId);
            }
        } else {
            normalized.search = '';
        }
    }

    if (provider === 'instagram') {
        normalized.search = '';
    }

    return normalized.toString();
}

function getCacheKey(normalizedUrl: string): string {
    return createHash('sha1').update(normalizedUrl).digest('hex');
}

function ttlDateForResponse(hasPreviewData: boolean): Date {
    if (hasPreviewData) {
        return new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
    }

    return new Date(Date.now() + EMPTY_CACHE_TTL_HOURS * 60 * 60 * 1000);
}

async function readCachedMetadata(
    cacheKey: string
): Promise<MetadataResponse | null> {
    const cached = await MetadataCache.findOne({
        cacheKey,
        expiresAt: { $gt: new Date() },
    }).lean();

    if (!cached) return null;

    return {
        title: toText(cached.title),
        description: toText(cached.description),
        image: toText(cached.image),
        logo: toText(cached.logo),
        author: toText(cached.author),
        date: toText(cached.date),
        url: toText(cached.url),
        hasPreviewData: Boolean(cached.hasPreviewData),
        provider: toText(cached.provider) || 'generic',
        isLimited: Boolean(cached.isLimited),
    };
}

async function writeCachedMetadata(
    cacheKey: string,
    normalizedUrl: string,
    payload: MetadataResponse
) {
    await MetadataCache.findOneAndUpdate(
        { cacheKey },
        {
            cacheKey,
            normalizedUrl,
            provider: payload.provider,
            title: payload.title,
            description: payload.description,
            image: payload.image,
            logo: payload.logo,
            author: payload.author,
            date: payload.date,
            url: payload.url,
            hasPreviewData: payload.hasPreviewData,
            isLimited: payload.isLimited,
            expiresAt: ttlDateForResponse(payload.hasPreviewData),
        },
        { upsert: true, new: false }
    );
}

function isLikelyInstagramLoginMetadata(
    metadata: MetadataShape,
    targetUrl: URL
): boolean {
    if (!isInstagramHost(targetUrl.hostname)) return false;

    const haystack = `${toText(metadata.title)} ${toText(metadata.description)}`
        .toLowerCase()
        .trim();

    return (
        haystack.includes('create an account or log in to instagram') ||
        haystack.includes('sign up for instagram') ||
        haystack.includes('log in to instagram')
    );
}

function extractYouTubeVideoId(url: URL): string | null {
    const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (hostname === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0] || '';
        return id || null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
        if (url.pathname === '/watch') {
            return url.searchParams.get('v');
        }

        const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?#]+)/i);
        return match?.[2] || null;
    }

    return null;
}

async function fetchJsonWithTimeout(url: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json, text/plain, */*',
            },
        });

        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchYouTubeOEmbedMetadata(url: string): Promise<MetadataShape> {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const data = await fetchJsonWithTimeout(endpoint);

    if (!data || typeof data !== 'object') {
        throw new Error('YouTube oEmbed fetch failed');
    }

    const oembed = data as {
        title?: string;
        thumbnail_url?: string;
        author_name?: string;
    };

    return {
        title: toText(oembed.title),
        image: toText(oembed.thumbnail_url),
        description: '',
        author: toText(oembed.author_name),
        date: '',
        logo: '',
        url,
    };
}

async function applyProviderFallbacks(
    metadata: MetadataShape,
    targetUrl: URL
): Promise<MetadataShape> {
    const output: MetadataShape = { ...metadata };
    const youtubeId = extractYouTubeVideoId(targetUrl);

    if (youtubeId) {
        const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(targetUrl.toString())}`;
        const oembed = await fetchJsonWithTimeout(oembedUrl);

        if (oembed && typeof oembed === 'object') {
            output.title =
                toText(output.title) ||
                toText((oembed as { title?: string }).title);
            output.author =
                toText(output.author) ||
                toText((oembed as { author_name?: string }).author_name);
            output.image =
                toText(output.image) ||
                toText((oembed as { thumbnail_url?: string }).thumbnail_url);
        }

        // Thumbnail fallback when the source page omits Open Graph tags.
        output.image =
            toText(output.image) ||
            `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    if (isLikelyInstagramLoginMetadata(output, targetUrl)) {
        const path = targetUrl.pathname.toLowerCase();
        if (path.includes('/reel/')) {
            output.title = 'Instagram Reel';
        } else if (path.includes('/p/')) {
            output.title = 'Instagram Post';
        } else if (path.includes('/stories/')) {
            output.title = 'Instagram Story';
        } else {
            output.title = 'Instagram Link';
        }

        output.description =
            'Instagram restricts public metadata for some links. Open the link to view the full content.';
    }

    return output;
}

// GET /api/metadata?url=... - Fetch metadata for a URL
router.get('/', async (req: Request, res: Response) => {
    try {
        const { url } = req.query;

        if (!url || typeof url !== 'string') {
            return res
                .status(400)
                .json({ message: 'URL parameter is required' });
        }

        // Validate URL format
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        const normalizedUrl = normalizeUrlForCache(parsedUrl);
        const cacheKey = getCacheKey(normalizedUrl);
        const cachedMetadata = await readCachedMetadata(cacheKey);
        const sourceProvider = getProviderFromHost(parsedUrl.hostname);

        if (cachedMetadata) {
            return res.json(cachedMetadata);
        }

        if (YOUTUBE_PROVIDERS.has(sourceProvider)) {
            const oembedMetadata = await fetchYouTubeOEmbedMetadata(
                parsedUrl.toString()
            );

            const youtubeId = extractYouTubeVideoId(parsedUrl);
            let cachedThumbnail = toText(oembedMetadata.image);

            if (!cachedThumbnail && youtubeId) {
                cachedThumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
            }

            if (cachedThumbnail) {
                try {
                    cachedThumbnail = await cacheLinkThumbnail(cachedThumbnail);
                } catch (cacheError) {
                    console.error('Thumbnail cache error:', cacheError);
                }
            }

            const responsePayload: MetadataResponse = {
                title: toText(oembedMetadata.title),
                description: '',
                image: cachedThumbnail,
                logo: '',
                author: toText(oembedMetadata.author),
                date: '',
                url: parsedUrl.toString(),
                hasPreviewData: hasAnyPreviewData({
                    ...oembedMetadata,
                    image: cachedThumbnail,
                }),
                provider: sourceProvider,
                isLimited: false,
            };

            await writeCachedMetadata(cacheKey, normalizedUrl, responsePayload);
            return res.json(responsePayload);
        }

        // Fetch the HTML with browser-like headers to reduce bot-block responses.
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT_MS
        );
        const response = await fetch(parsedUrl.toString(), {
            signal: controller.signal,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
            redirect: 'follow',
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.status(502).json({
                message: `Metadata source returned ${response.status}`,
            });
        }

        const html = await response.text();
        const targetUrl = response.url; // Handle redirects
        const targetUrlParsed = new URL(targetUrl);
        const provider = getProviderFromHost(targetUrlParsed.hostname);

        // Extract metadata
        const metadata = await scraper({ html, url: targetUrl });
        const enhancedMetadata = await applyProviderFallbacks(
            metadata,
            targetUrlParsed
        );

        let cachedThumbnail = toText(enhancedMetadata.image);
        if (cachedThumbnail) {
            try {
                cachedThumbnail = await cacheLinkThumbnail(cachedThumbnail);
            } catch (cacheError) {
                console.error('Thumbnail cache error:', cacheError);
            }
        }

        const hasPreviewData = hasAnyPreviewData({
            ...enhancedMetadata,
            image: cachedThumbnail,
        });
        const responsePayload: MetadataResponse = {
            title: toText(enhancedMetadata.title),
            description: toText(enhancedMetadata.description),
            image: cachedThumbnail,
            logo: toText(enhancedMetadata.logo),
            author: toText(enhancedMetadata.author),
            date: toText(enhancedMetadata.date),
            url: toText(enhancedMetadata.url) || targetUrl,
            hasPreviewData,
            provider,
            isLimited: LIMITED_PROVIDERS.has(provider),
        };

        await writeCachedMetadata(cacheKey, normalizedUrl, responsePayload);

        return res.json(responsePayload);
    } catch (error) {
        console.error('Metadata fetch error:', error);

        if (error instanceof Error && error.name === 'AbortError') {
            return res.status(504).json({
                message: 'Metadata fetch timed out',
            });
        }

        return res.status(500).json({
            message: 'Failed to fetch metadata',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
