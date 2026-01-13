import { v2 as cloudinary } from 'cloudinary';

// Don't configure here - export function to configure after env loads
export function initializeCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
        api_key: process.env.CLOUDINARY_API_KEY!,
        api_secret: process.env.CLOUDINARY_API_SECRET!,
    });
}

export default cloudinary;
