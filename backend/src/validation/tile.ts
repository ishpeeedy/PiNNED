import { z } from 'zod';

/**
 * Request schemas for the tile API.
 *
 * These exist mainly to keep untrusted input out of Mongo. The tile PATCH
 * handler previously spread req.body straight into $set, so a client could
 * write boardId, embedding, or timestamps. Parsing through a schema means only
 * declared fields ever reach the database, with the right types.
 */

const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'invalid id');

const position = z.object({
    x: z.number().finite(),
    y: z.number().finite(),
});

const size = z.object({
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
});

const style = z.object({
    backgroundColor: z.string().max(64).optional(),
    textColor: z.string().max(64).optional(),
});

// `data` is schema-less on the model (Mixed), but the shape is known and
// unbounded strings are a denial-of-service vector, so bound them.
const data = z
    .object({
        header: z.string().max(2_000).optional(),
        text: z.string().max(20_000).optional(),
        imageUrl: z.string().max(2_048).optional(),
        cloudinaryPublicId: z.string().max(256).optional(),
        caption: z.string().max(2_000).optional(),
        linkUrl: z.string().max(2_048).optional(),
        linkTitle: z.string().max(1_000).optional(),
        linkDescription: z.string().max(4_000).optional(),
        thumbnailUrl: z.string().max(2_048).optional(),
        author: z.string().max(256).optional(),
        publishDate: z.string().max(64).optional(),
    })
    .strict();

export const tileType = z.enum(['text', 'image', 'link']);

/** The fields a client may change. Everything else is server-owned. */
export const tilePatchSchema = z
    .object({
        position: position.optional(),
        size: size.optional(),
        style: style.optional(),
        data: data.optional(),
        zIndex: z.number().finite().optional(),
    })
    .strict();

export type TilePatchInput = z.infer<typeof tilePatchSchema>;

/** A whole tile, as sent when creating one or restoring it after an undo. */
export const tileUpsertSchema = z
    .object({
        _id: objectId,
        type: tileType,
        position,
        size,
        style: style.optional(),
        data: data.optional(),
        zIndex: z.number().finite().optional(),
    })
    .strict();

export const MAX_BATCH_OPS = 500;

/**
 * One gesture, one request. A group drag sends every moved tile as a single
 * batch; undoing a multi-delete restores every tile in a single batch.
 *
 * Order matters — deletes and upserts in the same batch may touch the same id
 * — so the three lists are applied in the order given here.
 */
export const tileBatchSchema = z
    .object({
        upserts: z.array(tileUpsertSchema).default([]),
        patches: z
            .array(
                z.object({ id: objectId, changes: tilePatchSchema }).strict()
            )
            .default([]),
        deletes: z.array(objectId).default([]),
    })
    .strict()
    .refine(
        (body) =>
            body.upserts.length + body.patches.length + body.deletes.length <=
            MAX_BATCH_OPS,
        { message: `A batch may contain at most ${MAX_BATCH_OPS} operations` }
    )
    .refine(
        (body) =>
            body.upserts.length + body.patches.length + body.deletes.length > 0,
        { message: 'A batch must contain at least one operation' }
    );

export type TileBatchInput = z.infer<typeof tileBatchSchema>;
