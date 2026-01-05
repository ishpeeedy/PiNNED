import mongoose, { Document, Schema } from 'mongoose';

export interface IBoard extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    icon?: string;

    settings?: {
        tileColor?: string;
        canvasColor?: string;
    };
    visibility: 'private' | 'public';
    allowDuplication: boolean;
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
    },
    { timestamps: true }
);

export default mongoose.model<IBoard>('Board', boardSchema);
