import { Router, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// Upload image endpoint
router.post(
    '/image',
    authenticateToken,
    upload.single('image'),
    async (req: AuthRequest, res: Response) => {
        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: 'No image file provided' });
            }

            // Convert buffer to base64
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            // Upload to Cloudinary in the 'pinned' folder
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'pinned',
                resource_type: 'image',
            });

            res.json({
                url: result.secure_url,
                publicId: result.public_id,
            });
        } catch (error) {
            console.error('Image upload error:', error);
            res.status(500).json({ error: 'Failed to upload image' });
        }
    }
);

export default router;
