import { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import Toolbar from '@/components/Toolbar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Marquee from '@/components/ui/marquee';
import {
    Link2,
    ImageIcon,
    Undo2,
    Palette,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { carouselBoards } from '@/data/carouselData';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
const landingImg =
    'https://res.cloudinary.com/dzwjyg2ai/image/upload/w_1920,f_auto,q_auto/v1772374043/IMP_Resources/jj-ying-9Qwbfa_RM94-unsplash_jujqzs.jpg';

// Static tile mockups — styled to match real tiles (Card: border-2 border-border rounded-base)
const TileShell = ({
    children,
    className = '',
    style,
}: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) => (
    <div
        className={`bg-white border-2 border-black rounded-base overflow-hidden ${className}`}
        style={style}
    >
        {children}
    </div>
);

const MockTextTile = ({
    title,
    body,
    className,
    style,
}: {
    title: string;
    body: string;
    className?: string;
    style?: React.CSSProperties;
}) => (
    <TileShell
        className={`p-2 flex flex-col h-[120px] gap-2 ${className ?? 'w-[200px]'}`}
        style={style}
    >
        <p className="font-bold text-sm text-black">{title}</p>
        <p className="text-xs text-black/70 leading-relaxed whitespace-pre-line">
            {body}
        </p>
    </TileShell>
);

const MockImageTile = ({
    src,
    caption,
    small,
}: {
    src: string;
    caption?: string;
    small?: boolean;
}) => (
    <TileShell className={small ? 'w-[200px]' : 'w-[280px]'}>
        <img
            src={src}
            alt=""
            className={`w-full object-cover ${small ? 'h-[150px]' : 'h-[190px]'}`}
        />
        {caption && <p className="text-xs text-black px-3 py-2">{caption}</p>}
    </TileShell>
);

const MockLinkTile = ({
    url,
    title,
    description,
    favicon,
    thumbnail,
}: {
    url: string;
    title: string;
    description: string;
    favicon?: string;
    thumbnail?: string;
}) => (
    <TileShell className="w-[240px] flex flex-col gap-0 h-[280px]">
        {thumbnail && (
            <img
                src={thumbnail}
                alt=""
                className="w-full h-[140px] object-cover"
            />
        )}
        <div className="p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
                {favicon && <img src={favicon} alt="" className="w-4 h-4" />}
                <p className="text-xs text-black/50 truncate">{url}</p>
            </div>
            <p className="font-bold text-sm text-black leading-snug">{title}</p>
            <p className="text-xs text-black/60 leading-relaxed line-clamp-2">
                {description}
            </p>
        </div>
    </TileShell>
);

const TemplateCarousel = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, align: 'start', slidesToScroll: 1 },
        [Autoplay({ delay: 3000, stopOnInteraction: true })]
    );

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    return (
        <div className="flex flex-col gap-10">
            <div className="px-6 flex items-end justify-between">
                <div className="px-85 flex flex-col gap-2">
                    <p className="text-2xl font-black">
                        Pick a board. Make it yours.
                    </p>
                </div>
                <div className="pr-85 flex gap-2">
                    <Button variant="neutral" size="icon" onClick={scrollPrev}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="neutral" size="icon" onClick={scrollNext}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-hidden w-full" ref={emblaRef}>
                <div className="flex">
                    {carouselBoards.map((board, i) => (
                        <div
                            key={i}
                            className={`shrink-0 w-[320px] min-w-0 ${i === 0 ? 'pl-6' : 'pl-4'}`}
                        >
                            <Card className="overflow-hidden gap-0 py-0 w-full dark:bg-secondary-background">
                                <img
                                    src={board.img}
                                    alt={board.title}
                                    className="w-full h-[240px] object-cover"
                                    loading="lazy"
                                />
                                <CardContent className="p-4 flex flex-col gap-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">
                                            {board.emoji}
                                        </span>
                                        <p className="font-black text-sm">
                                            {board.title}
                                        </p>
                                    </div>
                                    <p className="text-xs text-foreground/60 leading-relaxed flex-1">
                                        {board.description}
                                    </p>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="w-full"
                                    >
                                        <a href="/register">Try now!</a>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function Landing() {
    const smoothWrapperRef = useRef<HTMLDivElement>(null);
    const smoothContentRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const bentoRef = useRef<HTMLElement>(null);

    const [heroLoaded, setHeroLoaded] = useState(false);
    const [loaderDone, setLoaderDone] = useState(false);

    // Scroll to top on mount — disable browser scroll restoration
    useEffect(() => {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    // Preload the hero image
    useEffect(() => {
        const img = new Image();
        img.src = landingImg;
        if (img.complete) {
            setHeroLoaded(true);
        } else {
            img.onload = () => setHeroLoaded(true);
            img.onerror = () => setHeroLoaded(true); // don't block forever
        }
    }, []);

    // ScrollSmoother — buttery smooth scroll with lerp
    useEffect(() => {
        if (!smoothWrapperRef.current || !smoothContentRef.current) return;

        const smoother = ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: smoothContentRef.current,
            smooth: 1.2,
            effects: true,
        });

        return () => smoother.kill();
    }, []);

    useEffect(() => {
        const section = sectionRef.current;
        const container = containerRef.current;
        const grid = gridRef.current;
        if (!section || !container || !grid) return;

        // Chrome (Navbar + Toolbar) is fixed at 60px each = 120px = 3 grid cells
        grid.style.top = '120px';

        const tiles = section.querySelectorAll('.mock-tile');

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Container is 100vw × 100vh in CSS, anchored top-left.
        // Final tile is 560×320 to reduce squish.
        const endScaleX = 560 / vw;
        const endScaleY = 320 / vh;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: '+=250%',
                scrub: 0.5,
                pin: true,
                anticipatePin: 1,
            },
        });

        // Phase 1 (0 → 0.5): scale down to tile size + slide into position + grid fade in
        tl.to(
            container,
            {
                scaleX: endScaleX,
                scaleY: endScaleY,
                x: 480,
                y: 240,
                borderRadius: '4px',
                ease: 'none',
            },
            0
        ).to(grid, { opacity: 1, ease: 'none' }, 0);

        // Phase 2 (0.5 → 1): surrounding tiles stagger in
        tl.fromTo(
            tiles,
            { opacity: 0, scale: 0.92 },
            { opacity: 1, scale: 1, stagger: 0.08, ease: 'none' },
            0.5
        );

        // Bento section: simple stagger reveal on scroll
        if (bentoRef.current) {
            gsap.fromTo(
                bentoRef.current.querySelectorAll('.bento-cell'),
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: bentoRef.current,
                        start: 'top 78%',
                        toggleActions: 'play none none none',
                    },
                }
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, []);

    return (
        <>
            {/* Landing loader — covers page while hero image loads */}
            {!loaderDone && (
                <Loader
                    variant="landing"
                    minDuration={1500}
                    ready={heroLoaded}
                    onDone={() => setLoaderDone(true)}
                />
            )}

            <div id="smooth-wrapper" ref={smoothWrapperRef}>
                <div id="smooth-content" ref={smoothContentRef}>
                    <div
                        ref={sectionRef}
                        className="relative w-full h-screen flex items-center justify-center bg-background overflow-hidden"
                    >
                        {/* Navbar + toolbar sit behind the fullscreen image (z-[5] < z-10) */}
                        <div className="absolute top-0 left-0 right-0 z-[5]">
                            <Navbar />
                            <Toolbar />
                        </div>

                        {/* Grid fades in — starts below the chrome */}
                        <div
                            ref={gridRef}
                            className="absolute inset-x-0 bottom-0 grid-pattern opacity-0"
                        />

                        {/* Airbnb listing — top left */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{ top: '120px', left: '40px' }}
                        >
                            <MockLinkTile
                                url="airbnb.com · Minato-ku, Tokyo"
                                title="Hotel in Minato-ku · ★4.69 · 1 bedroom"
                                description="MANGA Design · 1 bed · Free simple breakfast · 4 station access"
                                favicon="https://a0.muscache.com/airbnb/static/icons/android-icon-192x192-c0465f9f0380893768972a31a614b670.png"
                                thumbnail="https://res.cloudinary.com/dzwjyg2ai/image/upload/w_400,f_auto,q_auto/v1771518160/IMP_Resources/2b0f280b-42be-4cac-9eae-9c3281a256c2_yspeiz.avif"
                            />
                        </div>

                        {/* Pros/cons text tile — near Airbnb */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{
                                top: '160px',
                                left: '280px',
                            }}
                        >
                            <MockTextTile
                                title="Minato-ku Airbnb"
                                body={
                                    '✅ Manga theme — unique stay\n✅ Free breakfast included\n✅ 4 stations nearby\n❌ Pricey for the size'
                                }
                            />
                        </div>

                        {/* Yasuo Building — top right */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{ top: '120px', right: '120px' }}
                        >
                            <MockImageTile
                                src="https://res.cloudinary.com/dzwjyg2ai/image/upload/w_600,f_auto,q_auto/v1771518162/IMP_Resources/pexels-photo-5544961_bbsgqw.jpg"
                                caption="Nakagin Capsule Tower · Shimbashi · Brutalist icon, 1972"
                            />
                        </div>

                        {/* Must Visit header tile — above the bottom-right pair */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{
                                top: '360px',
                                right: '80px',
                                zIndex: 2,
                            }}
                        >
                            <MockTextTile
                                className="w-[400px]"
                                title="Must Visit! 📍"
                                body={
                                    "Two architectural icons, 15 min apart — the National Art Center's rippling glass facade (Kurokawa, 2007) and Fuji TV's titanium sphere floating above Odaiba (Tange, 1997).\nBudget at least half a day to visit them both."
                                }
                            />
                        </div>
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{
                                top: '560px',
                                right: '560px',
                                zIndex: 2,
                            }}
                        >
                            <MockTextTile
                                className="w-[400px] h-[80px]"
                                title="Japan Trip Ideas 🌸"
                                body={
                                    'Cherry blossoms in Kyoto · Ramen in Sapporo · Capsule hotel in Tokyo · Ribbon Chapel · Fuji TV HQ · National Art Center · Nakagin Capsule Tower \n Possibly some trekking as well'
                                }
                                style={{
                                    backgroundColor: 'var(--main)',
                                    borderColor: '#000000',
                                }}
                            />
                        </div>

                        {/* National Art Center — bottom right pair, left tile */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{
                                top: '480px',
                                right: '40px',
                                zIndex: 2,
                            }}
                        >
                            <MockImageTile
                                small
                                src="https://res.cloudinary.com/dzwjyg2ai/image/upload/w_600,f_auto,q_auto/v1771518161/IMP_Resources/photo_2023-12-14_13-.jpg_jhs6wa.webp"
                                caption="National Art Center · Roppongi · Kisho Kurokawa, 2007"
                            />
                        </div>

                        {/* Ribbon Chapel — bottom left */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{ top: '400px', left: '8%' }}
                        >
                            <MockImageTile
                                src="https://res.cloudinary.com/dzwjyg2ai/image/upload/w_600,f_auto,q_auto/v1771518161/IMP_Resources/Bella-vista201512-02_nmlhb4.jpg"
                                caption="Ribbon Chapel · Onomichi · Two intertwining staircases, no columns"
                            />
                        </div>

                        {/* Fuji TV HQ — bottom right pair, right tile */}
                        <div
                            className="mock-tile opacity-0 absolute"
                            style={{ top: '480px', right: '240px', zIndex: 2 }}
                        >
                            <MockImageTile
                                small
                                src="https://res.cloudinary.com/dzwjyg2ai/image/upload/w_600,f_auto,q_auto/v1771518161/IMP_Resources/2018_FCG_Headquarters_Building_2_tcg9wi.jpg"
                                caption="Fuji TV HQ · Odaiba · Kenzo Tange, 1997"
                            />
                        </div>

                        {/* Center image tile — starts fullscreen, shrinks via transforms */}
                        <div
                            ref={containerRef}
                            className="absolute overflow-hidden z-10 border-2 border-black"
                            style={{
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                transformOrigin: 'top left',
                                willChange: 'transform',
                            }}
                        >
                            <img
                                src={landingImg}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <Marquee
                        items={[
                            'Drag & Drop Images',
                            '·',
                            'Link Metadata Fetching',
                            '·',
                            'Image uploads',
                            '·',
                            'Undo History',
                            '·',
                            'Color Palettes',
                            '·',
                            'Auto-save',
                            '·',
                            'Easy Resize',
                            '·',
                            'Infinite canvas',
                            '·',
                        ]}
                    />

                    {/* Bento section */}
                    <section
                        ref={bentoRef}
                        className="relative w-full py-10 px-5 bg-background overflow-hidden isometric-dots"
                    >
                        <div className="max-w-4xl mx-auto flex flex-col gap-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                                everything you need
                            </p>

                            <div
                                className="grid grid-cols-3 gap-3"
                                style={{ gridTemplateRows: '260px 180px' }}
                            >
                                {/* Big cell — spatial canvas */}
                                <div className="bento-cell col-start-1 col-end-3 border-2 border-black rounded-base bg-black text-white p-8 flex flex-col justify-between overflow-hidden relative">
                                    {/* Mini canvas mockup */}
                                    <div
                                        className="absolute inset-0 opacity-10"
                                        style={{
                                            backgroundImage:
                                                'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                                            backgroundSize: '32px 32px',
                                        }}
                                    />
                                    <div className="relative flex gap-3">
                                        <div className="w-24 h-16 rounded border-2 border-white/40 bg-white/10" />
                                        <div className="w-16 h-20 rounded border-2 border-white/40 bg-white/10 mt-4" />
                                        <div className="w-20 h-14 rounded border-2 border-white/40 bg-white/10 mt-1" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black leading-tight">
                                            Your ideas,
                                            <br />
                                            laid out how
                                            <br />
                                            you think.
                                        </p>
                                        <p className="text-sm text-white/50 mt-2">
                                            Drag. Drop. Done.
                                        </p>
                                    </div>
                                </div>

                                {/* Link previews */}
                                <div className="bento-cell col-start-3 col-end-4 border-2 border-black rounded-base bg-[#fff7ed] p-6 flex flex-col justify-between">
                                    <Link2
                                        className="w-7 h-7 text-black"
                                        strokeWidth={2.5}
                                    />
                                    <div>
                                        <p className="font-black text-lg text-black leading-tight">
                                            Paste a URL.
                                            <br />
                                            Get a preview.
                                        </p>
                                        <p className="text-xs text-black/50 mt-1">
                                            Title, description, thumbnail —
                                            auto-fetched.
                                        </p>
                                    </div>
                                </div>

                                {/* Image upload */}
                                <div className="bento-cell col-start-1 col-end-2 border-2 border-black rounded-base bg-[#e0f2fe] p-6 flex flex-col justify-between">
                                    <ImageIcon
                                        className="w-7 h-7 text-black"
                                        strokeWidth={2.5}
                                    />
                                    <div>
                                        <p className="font-black text-lg text-black leading-tight">
                                            Drag images
                                            <br />
                                            right in.
                                        </p>
                                        <p className="text-xs text-black/50 mt-1">
                                            From desktop or upload. Stored on
                                            Cloudinary.
                                        </p>
                                    </div>
                                </div>

                                {/* Undo + autosave */}
                                <div className="bento-cell col-start-2 col-end-3 border-2 border-black rounded-base bg-[#dcfce7] p-6 flex flex-col justify-between">
                                    <Undo2
                                        className="w-7 h-7 text-black"
                                        strokeWidth={2.5}
                                    />
                                    <div>
                                        <p className="font-black text-lg text-black leading-tight">
                                            Auto-saves.
                                            <br />
                                            Ctrl+Z always
                                            <br />
                                            works.
                                        </p>
                                        <p className="text-xs text-black/50 mt-1">
                                            Full undo history, zero manual
                                            saving.
                                        </p>
                                    </div>
                                </div>

                                {/* Color */}
                                <div className="bento-cell col-start-3 col-end-4 border-2 border-black rounded-base bg-[#fae8ff] p-6 flex flex-col justify-between">
                                    <Palette
                                        className="w-7 h-7 text-black"
                                        strokeWidth={2.5}
                                    />
                                    <div>
                                        <p className="font-black text-lg text-black leading-tight">
                                            Your palette,
                                            <br />
                                            your rules.
                                        </p>
                                        <p className="text-xs text-black/50 mt-1">
                                            Color every tile however you want.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Carousel section */}
                    <section className="relative w-full py-10 overflow-hidden bg-secondary-background grid-pattern">
                        <TemplateCarousel />
                    </section>
                    <Footer />
                </div>
                {/* smooth-content */}
            </div>
            {/* smooth-wrapper */}
        </>
    );
}
