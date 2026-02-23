export const changelogData = [
    {
        version: '2.8',
        date: 'Feb 22, 2026',
        changes: [
            'Added Ctrl+F keyboard shortcut to instantly focus and select the search bar from anywhere on the page',
            'Fixed multiple canvas bugs introduced by the context menu structural changes',
            'Fixed TypeScript type mismatch on the search input ref for React 19 compatibility',
        ],
    },
    {
        version: '2.7',
        date: 'Feb 21, 2026',
        changes: [
            'Added right-click context menu on tiles — duplicate (with multi-select count), delete, bring to front, send to back, change color via sub-menu, select all, deselect',
            'Added right-click context menu on the canvas — add text/image/link tile at cursor position, undo, redo, zoom in/out/reset, select all',
            'Right-clicking an unselected tile now auto-selects it before the menu opens',
            'Color sub-menu shows all 8 palette colors with swatches',
        ],
    },
    {
        version: '2.6',
        date: 'Feb 19, 2026',
        changes: [
            'Added multi-select — hold Ctrl (or ⌘ on Mac) and click tiles to build a selection',
            'Multi-selected tiles can be dragged together as a group, maintaining relative positions',
            'Delete, duplicate, and color actions in the context menu apply to the entire selection',
        ],
    },
    {
        version: '2.5',
        date: 'Feb 17, 2026',
        changes: [
            'Added keyboard shortcuts: Ctrl+Z for undo, Ctrl+Y / Ctrl+Shift+Z for redo',
            'Shortcuts are blocked when focus is inside an input, textarea, or contentEditable to avoid conflicts',
        ],
    },
    {
        version: '2.4',
        date: 'Feb 16, 2026',
        changes: [
            'Fixed tile dragging at non-1x zoom levels — tiles now track the cursor correctly at any zoom',
        ],
    },
    {
        version: '2.3',
        date: 'Feb 15, 2026',
        changes: [
            'Added AI semantic search (beta) — search tiles by meaning, not just exact keywords, powered by Google Gemini embeddings',
            'Optimised semantic search score thresholds for more relevant results',
            'Search result tiles now glow with variable intensity based on their relevance score — brighter glow means a stronger match',
            'Semantic rank badges show on matching tiles (#1, #2, #3...)',
        ],
    },
    {
        version: '2.2',
        date: 'Feb 10, 2026',
        changes: [
            'Added a health-check ping on the home page to wake up the Render backend before users reach the dashboard, reducing cold start wait times',
        ],
    },
    {
        version: '2.1',
        date: 'Feb 09, 2026',
        changes: [
            'Added live text search in the toolbar — search across all tile content (text, headers, captions, link titles, descriptions) within the open board',
            'Matching tiles highlight with a pulsing blue glow; the focused match gets a bright solid glow',
            'Canvas smoothly pans to center the focused match on search',
            'Navigate between multiple matches with the arrow buttons or Enter key',
            'Match counter shows current position (e.g. 2 / 5)',
            'Clear search with the X button or Escape key',
        ],
    },
    {
        version: '2.0',
        date: 'Feb 07, 2026',
        changes: [
            'Fixed orphaned images — Cloudinary assets are now deleted when an image tile is removed',
            'Cloudinary public ID is now stored on the tile so cleanup is always possible',
            'Removed GSAP from manual chunk splitting — bundled into main JS for instant home page load',
            'Fixed flash of unstyled content (FOUC) — dark mode class now applied synchronously before the page paints',
            'Removed stale console logs across Board, Toolbar, and ImageTile components',
        ],
    },
    {
        version: '1.9',
        date: 'Feb 06, 2026',
        changes: [
            'Fixed GSAP ScrollSmoother cleanup on the home page — no lingering scroll listeners after navigation',
            'Replaced anchor tags with React Router Link in Navbar and Footer for proper client-side navigation',
        ],
    },
    {
        version: '1.8',
        date: 'Feb 05, 2026',
        changes: [
            'Added optimistic auth to the Navbar — login state resolves instantly without waiting for the API',
            'Optimised bundle chunking — React and Matter.js are now in separate vendor chunks for faster repeat loads',
            'Fixed loader flash on the home page by co-bundling GSAP with home page chunks',
            'Moved hero landing image to Cloudinary with lazy loading on all homepage carousel images',
            'Added decorative pinwheel component to the login, register, and changelog pages',
        ],
    },
    {
        version: '1.7',
        date: 'Feb 04, 2026',
        changes: [
            'Added 404 Not Found page with a Matter.js physics simulation',
            'Added login and register links to the navbar dropdown when signed out',
            'Fixed navbar logo — routes to the dashboard when logged in, home page when logged out',
            'Added back-to-top button on the changelog page',
            'Fixed search bar border visibility in dark mode on the dashboard page',
            'Fixed footer overlapping content on the dashboard page',
            'Fixed text color on the delete board confirmation modal',
        ],
    },
    {
        version: '1.6',
        date: 'Feb 02, 2026',
        changes: [
            'Fixed page failing to load on initial deployment to Render',
        ],
    },
    {
        version: '1.5',
        date: 'Feb 01, 2026',
        changes: [
            'Added Bring to Front and Send to Back buttons to the toolbar',
            'Selected tile is now automatically brought to the front of the stack',
        ],
    },
    {
        version: '1.3',
        date: 'Jan 31, 2026',
        changes: [
            'Added animated loader to image tiles — shows a stroke animation during upload and while images load',
            'Removed unnecessary loader from the dashboard page for a faster, snappier experience',
        ],
    },
    {
        version: '1.2',
        date: 'Jan 30, 2026',
        changes: [
            'Added Board Settings page — customize your board background color or pattern',
            'Board Settings now uses accordion sections for organized, collapsible settings',
            'Fixed a casing error in the Footer component',
        ],
    },
    {
        version: '1.1',
        date: 'Jan 28, 2026',
        changes: [
            'Removed snap-to-grid system — tiles now move freely on the canvas for more flexible layouts',
            'Fixed UI element alignment on the canvas grid',
        ],
    },
    {
        version: '1.0',
        date: 'Jan 26, 2026',
        changes: [
            'Redesigned landing page with GSAP scroll-driven zoom animation — hero image fills the screen and shrinks into a canvas tile on scroll',
            'Added mock tile layout around the hero canvas showcasing Airbnb link previews, image tiles, and text tiles',
            'Added Navbar and Toolbar overlaid behind the hero image, revealed as the canvas shrinks',
            'Added Apple-style feature bento section with spatial canvas, link previews, image upload, undo history, and color palette cells',
            'Added scrolling marquee banner between the hero and feature sections',
            'Added template board carousel with looping autoplay using Embla Carousel',
        ],
    },
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
