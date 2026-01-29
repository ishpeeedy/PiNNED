import mongoose, { Document, Schema } from 'mongoose';

export interface IBoard extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    icon?: string;

    settings?: {
        tileColor?: string;
        canvasColor?: string;
        background?: {
            type?: 'solid' | 'grid' | 'dots' | 'image';
            color?: string;
            foregroundColor?: string;
            imageUrl?: string;
        };
    };
    visibility: 'private' | 'public';
    allowDuplication: boolean;
    tileCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const boardSchema = new Schema<IBoard>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String },
        icon: { type: String, default: '📌' },
        settings: {
            tileColor: {
                type: String,
                default: 'oklch(93.88% 0.033 300.19)',
            },
            canvasColor: {
                type: String,
                default: 'oklch(100% 0 0)',
            },
            background: {
                type: {
                    type: String,
                    enum: ['solid', 'grid', 'dots', 'image'],
                    default: 'grid',
                },
                color: { type: String },
                foregroundColor: { type: String },
                imageUrl: { type: String },
            },
        },
        visibility: {
            type: String,
            enum: ['private', 'public'],
            default: 'private',
        },
        allowDuplication: {
            type: Boolean,
            default: false,
        },
        tileCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IBoard>('Board', boardSchema);
