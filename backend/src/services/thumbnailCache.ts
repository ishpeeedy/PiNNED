import { createHash } from 'crypto';
import cloudinary from '../config/cloudinary.ts';

const LINK_THUMBNAIL_FOLDER = 'pinned/link-thumbnails';

function normalizeImageUrl(url: string) {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString();
}

function getPublicId(url: string) {
    const normalized = normalizeImageUrl(url);
    return createHash('sha1').update(normalized).digest('hex');
}

function getTransformedUrl(publicId: string) {
    return cloudinary.url(`${LINK_THUMBNAIL_FOLDER}/${publicId}`, {
        secure: true,
        transformation: [
            {
                width: 640,
                height: 400,
                crop: 'limit',
                fetch_format: 'auto',
                quality: 'auto:good',
                flags: 'progressive',
            },
        ],
    });
}

export async function cacheLinkThumbnail(url: string): Promise<string> {
    if (!url || !url.startsWith('http')) return '';

    const publicId = getPublicId(url);

    try {
        await cloudinary.uploader.upload(url, {
            folder: LINK_THUMBNAIL_FOLDER,
            public_id: publicId,
            overwrite: false,
            unique_filename: false,
            resource_type: 'image',
            transformation: [
                {
                    width: 640,
                    height: 400,
                    crop: 'limit',
                    fetch_format: 'auto',
                    quality: 'auto:good',
                    flags: 'progressive',
                },
            ],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (!message.toLowerCase().includes('already exists')) {
            throw error;
        }
    }

    return getTransformedUrl(publicId);
}
