import express, { Request, Response } from 'express';
import metascraper from 'metascraper';
import metascraperAuthor from 'metascraper-author';
import metascraperDate from 'metascraper-date';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';
import metascraperLogo from 'metascraper-logo';
import metascraperTitle from 'metascraper-title';
import metascraperUrl from 'metascraper-url';
import { authenticateToken } from '../middleware/auth';

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
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        // Fetch the HTML
        const response = await fetch(url);
        const html = await response.text();
        const targetUrl = response.url; // Handle redirects

        // Extract metadata
        const metadata = await scraper({ html, url: targetUrl });

        return res.json({
            title: metadata.title || '',
            description: metadata.description || '',
            image: metadata.image || '',
            logo: metadata.logo || '',
            author: metadata.author || '',
            date: metadata.date || '',
            url: metadata.url || targetUrl,
        });
    } catch (error) {
        console.error('Metadata fetch error:', error);
        return res.status(500).json({
            message: 'Failed to fetch metadata',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
