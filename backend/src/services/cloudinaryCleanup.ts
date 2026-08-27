import cloudinary from '../config/cloudinary.ts';
import Tile from '../models/tile.ts';

// Cloudinary's bulk delete accepts at most 100 public IDs per call.
const DELETE_BATCH_SIZE = 100;

/**
 * Best-effort removal of uploaded images.
 *
 * Failures are logged rather than thrown: a Cloudinary outage must never make
 * a tile or board undeletable. A stray asset is the cheaper failure.
 */
export async function destroyPublicIds(publicIds: string[]): Promise<void> {
    const ids = publicIds.filter(Boolean);
    if (ids.length === 0) return;

    for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
        const batch = ids.slice(i, i + DELETE_BATCH_SIZE);
        try {
            await cloudinary.api.delete_resources(batch);
        } catch (error) {
            console.error('Failed to delete Cloudinary assets:', error);
        }
    }
}

/** The Cloudinary public IDs owned by the given tiles. */
export async function collectPublicIds(filter: {
    boardId?: string;
    tileIds?: string[];
}): Promise<string[]> {
    const query: Record<string, unknown> = {
        'data.cloudinaryPublicId': { $exists: true, $ne: '' },
    };
    if (filter.boardId) query.boardId = filter.boardId;
    if (filter.tileIds) query._id = { $in: filter.tileIds };

    const tiles = await Tile.find(query, {
        'data.cloudinaryPublicId': 1,
    }).lean();

    return tiles
        .map((tile) => tile.data?.cloudinaryPublicId)
        .filter((publicId): publicId is string => Boolean(publicId));
}
