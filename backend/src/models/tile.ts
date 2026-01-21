import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface ITile extends Document {
    boardId: ObjectId;
    type: 'text' | 'image' | 'link';

    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    style: {
        backgroundColor: string;
        textColor: string;
    };
    data: {
        header?: string;
        text?: string;
        imageUrl?: string;
        caption?: string;
        linkUrl?: string;
        linkTitle?: string;
        linkDescription?: string;
        thumbnailUrl?: string;
        author?: string;
        publishDate?: string;
    };
    zIndex: number;
    createdAt: Date;
    updatedAt: Date;
}

const TileSchema = new Schema(
    {
        boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
        type: { type: String, enum: ['text', 'image', 'link'], required: true },
        position: {
            x: { type: Number, required: true, default: 0 },
            y: { type: Number, required: true, default: 0 },
        },
        size: {
            width: { type: Number, required: true, default: 240 },
            height: { type: Number, required: true, default: 240 },
        },
        style: {
            backgroundColor: {
                type: String,
                default: 'oklch(93.88% 0.033 300.19)',
            },
            textColor: {
                type: String,
                default: 'oklch(0% 0 0)',
            },
        },
        data: {
            type: Schema.Types.Mixed,
            default: {},
        },
        zIndex: { type: Number, default: 1 },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ITile>('Tile', TileSchema);
