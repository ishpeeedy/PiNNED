import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import Navbar from '@/components/Navbar';

const WALL = 40;

const TILE_COLORS = [
    '#00d696',
    '#facc00',
    '#ff4d50',
    '#0099ff',
    '#e0b700',
    '#FF8C42',
];
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const TILE_LABELS = [
    'yeet',
    'not found',
    'empty',
    "can't fetch",
    'await...never',
    'null',
    'missing',
    'gone',
    'console.log("help")',
    'oops',
];

export default function NotFound() {
    const sceneRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = sceneRef.current;
        if (!container) return;

        const W = window.innerWidth;
        const H = window.innerHeight - 60;

        const engine = Matter.Engine.create({ gravity: { x: 0, y: 1 } });

        const render = Matter.Render.create({
            element: container,
            engine,
            options: {
                width: W,
                height: H,
                wireframes: false,
                background: 'transparent',
            },
        });

        // walls (floor, left, right, ceiling)
        const walls = [
            Matter.Bodies.rectangle(W / 2, H + WALL / 2, W * 2, WALL, {
                isStatic: true,
                render: { visible: false },
            }),
            Matter.Bodies.rectangle(-WALL / 2, H / 2, WALL, H * 2, {
                isStatic: true,
                render: { visible: false },
            }),
            Matter.Bodies.rectangle(W + WALL / 2, H / 2, WALL, H * 2, {
                isStatic: true,
                render: { visible: false },
            }),
            Matter.Bodies.rectangle(W / 2, -WALL / 2, W * 2, WALL, {
                isStatic: true,
                render: { visible: false },
            }),
        ];
        const bgColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--main')
            .trim();
        // big "4" "0" "4" digit bodies
        const digitSize = Math.min(140, W / 4);
        const digitGap = digitSize * 1.4;
        const digits = ['4', '0', '4'].map((char, i) => {
            const x = W / 2 + (i - 1) * digitGap;
            const body = Matter.Bodies.rectangle(
                x,
                H * 0.25,
                digitSize,
                digitSize,
                {
                    chamfer: { radius: 10 },
                    restitution: 0.4,
                    friction: 0.6,
                    render: {
                        fillStyle: bgColor,
                        strokeStyle: '#000',
                        lineWidth: 3,
                    },
                }
            );
            (body as any).__label = char;
            (body as any).__type = 'digit';
            (body as any).__size = digitSize;
            Matter.Body.setVelocity(body, {
                x: (Math.random() - 0.5) * 3,
                y: -1,
            });
            return body;
        });

        // falling tiles — random positions, they'll fall with gravity
        const tiles = TILE_LABELS.map((text) => {
            const w = 100 + Math.random() * 60;
            const h = 60 + Math.random() * 30;
            const body = Matter.Bodies.rectangle(
                80 + Math.random() * (W - 160),
                80 + Math.random() * (H * 0.4),
                w,
                h,
                {
                    chamfer: { radius: 6 },
                    restitution: 0.3,
                    friction: 0.5,
                    render: {
                        fillStyle: pick(TILE_COLORS),
                        strokeStyle: '#000',
                        lineWidth: 2,
                    },
                }
            );
            (body as any).__label = text;
            (body as any).__type = 'tile';
            return body;
        });

        // "go home" tile — anti-gravity

        const homeW = 200;
        const homeH = 70;
        const homeTile = Matter.Bodies.rectangle(W / 2, H * 0.6, homeW, homeH, {
            chamfer: { radius: 8 },
            restitution: 0.5,
            frictionAir: 0.03,
            render: {
                fillStyle: bgColor,
                strokeStyle: '#000',
                lineWidth: 3,
            },
        });
        (homeTile as any).__label = '← GO HOME';
        (homeTile as any).__type = 'home';

        Matter.Composite.add(engine.world, [
            ...walls,
            ...digits,
            ...tiles,
            homeTile,
        ]);

        // dragging
        const mouse = Matter.Mouse.create(render.canvas);
        const mc = Matter.MouseConstraint.create(engine, {
            mouse,
            constraint: { stiffness: 0.2, render: { visible: false } },
        });
        Matter.Composite.add(engine.world, mc);
        render.mouse = mouse;

        // click home tile → go home
        const onClick = (e: MouseEvent) => {
            const r = render.canvas.getBoundingClientRect();
            const mx = e.clientX - r.left,
                my = e.clientY - r.top;
            const p = homeTile.position;
            if (
                Math.abs(mx - p.x) < homeW / 2 &&
                Math.abs(my - p.y) < homeH / 2
            ) {
                window.location.href = '/';
            }
        };
        render.canvas.addEventListener('click', onClick);

        // pointer cursor on home tile
        const onMove = (e: MouseEvent) => {
            const r = render.canvas.getBoundingClientRect();
            const mx = e.clientX - r.left,
                my = e.clientY - r.top;
            const p = homeTile.position;
            render.canvas.style.cursor =
                Math.abs(mx - p.x) < homeW / 2 && Math.abs(my - p.y) < homeH / 2
                    ? 'pointer'
                    : 'grab';
        };
        render.canvas.addEventListener('mousemove', onMove);

        // anti-gravity + wobble on home tile
        Matter.Events.on(engine, 'beforeUpdate', () => {
            Matter.Body.applyForce(homeTile, homeTile.position, {
                x: Math.sin(Date.now() / 800) * 0.0003,
                y: -engine.gravity.y * homeTile.mass * 0.001 - 0.0015,
            });
        });

        // draw text on tiles
        Matter.Events.on(render, 'afterRender', () => {
            const ctx = render.context;
            for (const body of [...digits, ...tiles, homeTile]) {
                const meta = body as any;
                if (!meta.__label) continue;
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                ctx.fillStyle = '#000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (meta.__type === 'digit') {
                    ctx.font = `bold ${meta.__size * 0.6}px 'DM Sans', sans-serif`;
                    ctx.fillText(meta.__label, 0, 0);
                } else if (meta.__type === 'home') {
                    ctx.font = "bold 20px 'DM Sans', sans-serif";
                    const text = meta.__label;
                    ctx.fillText(text, 0, 0);
                    // underline
                    const tw = ctx.measureText(text).width;
                    ctx.beginPath();
                    ctx.moveTo(-tw / 2, 12);
                    ctx.lineTo(tw / 2, 12);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = '#000';
                    ctx.stroke();
                } else {
                    ctx.font = "bold 13px 'DM Sans', sans-serif";
                    ctx.fillText(meta.__label, 0, 0);
                }
                ctx.restore();
            }
        });

        const runner = Matter.Runner.create();
        Matter.Render.run(render);
        Matter.Runner.run(runner, engine);

        return () => {
            render.canvas.removeEventListener('click', onClick);
            render.canvas.removeEventListener('mousemove', onMove);
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
            Matter.Composite.clear(engine.world, false);
            Matter.Engine.clear(engine);
            render.canvas.remove();
            render.textures = {};
        };
    }, []);

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Navbar />
            <div
                ref={sceneRef}
                className="flex-1 grid-pattern"
                style={{ position: 'relative' }}
            />
        </div>
    );
}
