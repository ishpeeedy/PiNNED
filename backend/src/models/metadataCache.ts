import mongoose, { Document, Schema } from 'mongoose';

export interface IMetadataCache extends Document {
    cacheKey: string;
    normalizedUrl: string;
    provider: string;
    title: string;
    description: string;
    image: string;
    logo: string;
    author: string;
    date: string;
    url: string;
    hasPreviewData: boolean;
    isLimited: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const metadataCacheSchema = new Schema<IMetadataCache>(
    {
        cacheKey: { type: String, required: true, unique: true, index: true },
        normalizedUrl: { type: String, required: true },
        provider: { type: String, default: 'generic' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        image: { type: String, default: '' },
        logo: { type: String, default: '' },
        author: { type: String, default: '' },
        date: { type: String, default: '' },
        url: { type: String, default: '' },
        hasPreviewData: { type: Boolean, default: false },
        isLimited: { type: Boolean, default: false },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

export default mongoose.model<IMetadataCache>(
    'MetadataCache',
    metadataCacheSchema
);
