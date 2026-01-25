export const changelogData = [
    {
        version: '0.9',
        date: 'Jan 25, 2026',
        changes: [
            'Added favicon and Apple touch icon for home screen support',
            'Added Open Graph metadata for rich link previews on Discord, Slack, and iMessage',
            'Removed unused components to reduce bundle size',
        ],
    },
    {
        version: '0.8',
        date: 'Jan 24, 2026',
        changes: [
            'Added full dark mode support across all pages and components',
            'Tile text colors now adapt correctly to both light and dark themes',
            'Added per-tile color customization — change the background color of any tile',
        ],
    },
    {
        version: '0.7',
        date: 'Jan 21, 2026',
        changes: [
            'Added image caption support — annotate your image tiles with a description',
            'Fixed tile text wrapping — long content no longer overflows tile boundaries',
            'Added home/landing page with feature overview and call to action',
            'Added footer with repository link',
        ],
    },
    {
        version: '0.6',
        date: 'Jan 19, 2026',
        changes: [
            'Added dashboard page — create, delete, and search your boards',
            'Board thumbnails now generate and display on the dashboard',
        ],
    },
    {
        version: '0.5',
        date: 'Jan 18, 2026',
        changes: [
            'Added functional undo and redo with buttons',
            'Backend tile saves are now debounced to reduce unnecessary API calls',
            'Fixed UI flicker that occurred when dragging and dropping tiles',
        ],
    },
    {
        version: '0.4',
        date: 'Jan 17, 2026',
        changes: [
            'Added drag-and-drop image upload directly onto the canvas',
            'Delete button revamped with confirmation glow effect',
            'Tiles now glow on hover during drag and delete interactions',
            'Added toast notifications (Sonner) for delete actions and link fetching',
            'Fixed critical memory leak in canvas — RAM usage reduced from ~1GB to under 100MB by cleaning up requestAnimationFrame',
        ],
    },
    {
        version: '0.3',
        date: 'Jan 15, 2026',
        changes: [
            'Added drag handles and tile resizing — grab the corner of any tile to resize it',
            'Added delete button to the toolbar',
            'Link tiles now automatically fetch and display URL metadata (title, description, favicon)',
            'Added image upload via Cloudinary — drop an image file onto any image tile',
        ],
    },
    {
        version: '0.2',
        date: 'Jan 10, 2026',
        changes: [
            'Added infinite canvas — tiles snap to a 40px grid for clean alignment',
            'Added Navbar and Toolbar UI',
            'Introduced Text, Link, and Image tile types on the board',
            'Added board page with full tile CRUD (create, read, update, delete)',
        ],
    },
    {
        version: '0.1',
        date: 'Jan 03, 2026',
        changes: [
            'Project initialized with Vite + React + TypeScript',
            'Set up MongoDB connection and CORS configuration',
            'Implemented authentication — register, login, JWT middleware',
            'Added backend REST APIs for boards and tiles',
            'Added login, register, and dashboard pages with neobrutalist styling',
        ],
    },
];
