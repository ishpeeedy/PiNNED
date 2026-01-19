interface BoardThumbnailProps {
    canvasColor?: string;
    tileColor?: string;
}

export default function BoardThumbnail({
    canvasColor = 'oklch(100% 0 0)',
    tileColor = 'oklch(93.88% 0.033 300.19)',
}: BoardThumbnailProps) {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 300 200"
            xmlns="http://www.w3.org/2000/svg"
            className="rounded-t-base"
        >
            <style>{`
                @keyframes tileResize1 {
                    0%, 100% { transform: scaleX(1); }
                    50% { transform: scaleX(1.08); }
                }
                @keyframes tileResize2 {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.06); }
                }
                @keyframes tileResize3 {
                    0%, 100% { transform: scaleX(1); }
                    50% { transform: scaleX(1.05); }
                }
                @keyframes tileResize4 {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.07); }
                }
                @keyframes textFade {
                    0%, 40%, 100% { opacity: 0; }
                    50%, 90% { opacity: 0.3; }
                }
                @keyframes imagePulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.2; }
                }
                .tile1 { animation: tileResize1 3.2s ease-in-out infinite; transform-origin: center; }
                .tile2 { animation: tileResize2 2.8s ease-in-out infinite 0.5s; transform-origin: center; }
                .tile3 { animation: tileResize3 3.5s ease-in-out infinite 1s; transform-origin: center; }
                .tile4 { animation: tileResize4 3s ease-in-out infinite 1.5s; transform-origin: center; }
                .tile5 { animation: tileResize1 3.3s ease-in-out infinite 0.8s; transform-origin: center; }
                .text-line { animation: textFade 4s ease-in-out infinite; }
                .image-placeholder { animation: imagePulse 2.5s ease-in-out infinite; }
            `}</style>

            {/* Background */}
            <rect width="300" height="200" fill={canvasColor} />

            {/* Grid pattern */}
            <defs>
                <pattern
                    id="grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="oklch(0% 0 0 / 0.1)"
                        strokeWidth="0.5"
                    />
                </pattern>
            </defs>
            <rect width="300" height="200" fill="url(#grid)" />

            {/* Placeholder tiles - 4 random positioned rectangles */}
            <g>
                {/* Tile 1 - top left */}
                <g className="tile1">
                    <rect
                        x="30"
                        y="30"
                        width="80"
                        height="60"
                        fill={tileColor}
                        stroke="oklch(0% 0 0)"
                        strokeWidth="2"
                        rx="5"
                    />
                    <line
                        x1="40"
                        y1="45"
                        x2="100"
                        y2="45"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="2"
                        className="text-line"
                    />
                    <line
                        x1="40"
                        y1="55"
                        x2="90"
                        y2="55"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="2"
                        className="text-line"
                        style={{ animationDelay: '0.3s' }}
                    />
                </g>

                {/* Tile 2 - top right */}
                <g className="tile2">
                    <rect
                        x="190"
                        y="25"
                        width="70"
                        height="70"
                        fill={tileColor}
                        stroke="oklch(0% 0 0)"
                        strokeWidth="2"
                        rx="5"
                    />
                    <line
                        x1="200"
                        y1="50"
                        x2="245"
                        y2="50"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="2"
                        className="text-line"
                        style={{ animationDelay: '0.8s' }}
                    />
                </g>

                {/* Tile 3 - bottom left */}
                <g className="tile3">
                    <rect
                        x="40"
                        y="110"
                        width="90"
                        height="50"
                        fill={tileColor}
                        stroke="oklch(0% 0 0)"
                        strokeWidth="2"
                        rx="5"
                    />
                    <line
                        x1="50"
                        y1="130"
                        x2="115"
                        y2="130"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="2"
                        className="text-line"
                        style={{ animationDelay: '1.2s' }}
                    />
                    <line
                        x1="50"
                        y1="140"
                        x2="105"
                        y2="140"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="2"
                        className="text-line"
                        style={{ animationDelay: '1.5s' }}
                    />
                </g>

                {/* Tile 4 - center right */}
                <g className="tile4">
                    <rect
                        x="150"
                        y="120"
                        width="60"
                        height="55"
                        fill={tileColor}
                        stroke="oklch(0% 0 0)"
                        strokeWidth="2"
                        rx="5"
                    />
                    <line
                        x1="160"
                        y1="145"
                        x2="195"
                        y2="145"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="2"
                        className="text-line"
                        style={{ animationDelay: '2s' }}
                    />
                </g>

                {/* Tile 5 - image loader tile (top center) */}
                <g className="tile5">
                    <rect
                        x="125"
                        y="35"
                        width="55"
                        height="55"
                        fill={tileColor}
                        stroke="oklch(0% 0 0)"
                        strokeWidth="2"
                        rx="5"
                    />
                    {/* Image placeholder icon */}
                    <rect
                        x="137"
                        y="50"
                        width="30"
                        height="25"
                        fill="none"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="1.5"
                        rx="2"
                        className="image-placeholder"
                    />
                    <circle
                        cx="143"
                        cy="60"
                        r="3"
                        fill="oklch(0% 0 0 / 0.3)"
                        className="image-placeholder"
                    />
                    <path
                        d="M137 70 L145 62 L152 68 L167 58"
                        stroke="oklch(0% 0 0 / 0.3)"
                        strokeWidth="1.5"
                        fill="none"
                        className="image-placeholder"
                    />
                </g>
            </g>
        </svg>
    );
}
