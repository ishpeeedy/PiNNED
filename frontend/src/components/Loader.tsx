import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface LoaderProps {
    /** 'standard' = transparent bg, morphs into navbar logo.
     *  'landing'  = grid-pattern bg, fades out. */
    variant?: 'standard' | 'landing';
    /** Called after the exit animation finishes — parent should unmount the loader. */
    onDone?: () => void;
    /** Minimum time (ms) the loader stays visible for the stroke animation.
     *  Default: 2000 */
    minDuration?: number;
    /** External "content is ready" signal. When provided, the loader waits for
     *  BOTH `ready === true` AND `minDuration` to have elapsed before exiting.
     *  If omitted, the loader exits after `minDuration` alone. */
    ready?: boolean;
}

const Loader = ({
    variant = 'standard',
    onDone,
    minDuration = 2000,
    ready,
}: LoaderProps) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [exiting, setExiting] = useState(false);
    const [minTimeReached, setMinTimeReached] = useState(false);

    // Track when minimum display time has elapsed
    useEffect(() => {
        const timer = setTimeout(() => {
            setMinTimeReached(true);
        }, minDuration);
        return () => clearTimeout(timer);
    }, [minDuration]);

    // Start exit when both conditions are met
    useEffect(() => {
        // If `ready` prop isn't used, only wait for minDuration
        const contentReady = ready === undefined ? true : ready;
        if (minTimeReached && contentReady && !exiting) {
            setExiting(true);
        }
    }, [minTimeReached, ready, exiting]);

    useEffect(() => {
        if (!exiting) return;
        const overlay = overlayRef.current;
        const svg = svgRef.current;
        if (!overlay || !svg) return;

        if (variant === 'standard') {
            // Standard variant: background fades, then SVG fades
            const tl = gsap.timeline({
                onComplete: () => onDone?.(),
            });

            tl.to(overlay, {
                backgroundColor: 'transparent',
                duration: 0.4,
                ease: 'power2.out',
            });

            tl.to(svg, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
            });

            tl.to(overlay, {
                opacity: 0,
                duration: 0.15,
                ease: 'power2.out',
            });
        } else {
            // Landing variant: background fades, then SVG fades slowly
            const tl = gsap.timeline({
                onComplete: () => onDone?.(),
            });

            // Background fades away
            tl.to(overlay, {
                backgroundColor: 'transparent',
                duration: 0.6,
                ease: 'power2.out',
            });

            // SVG fades out slowly after background is gone
            tl.to(svg, {
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
            });

            // Overlay cleans up
            tl.to(overlay, {
                opacity: 0,
                duration: 0.15,
                ease: 'power2.out',
            });
        }
    }, [exiting, variant, onDone]);

    return (
        <div
            ref={overlayRef}
            className={`${
                variant === 'landing'
                    ? 'fixed inset-0 z-[100] grid-pattern'
                    : 'w-full flex-1'
            } flex items-center justify-center`}
            style={{
                backgroundColor:
                    variant === 'landing' ? 'var(--background)' : undefined,
            }}
        >
            <svg
                ref={svgRef}
                width="976"
                height="289"
                viewBox="0 0 976 289"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={
                    variant === 'landing'
                        ? 'w-[min(60vw,500px)]'
                        : 'w-[min(40vw,300px)]'
                }
                style={{
                    willChange: 'transform, opacity',
                }}
            >
                <path
                    d="M78.4609 3C98.1548 3 113.531 4.53885 124.423 7.73535H124.422C135.327 10.9022 143.803 15.5633 149.539 21.9111C155.272 28.1319 159.089 35.6715 161.02 44.4463L161.206 45.2617C163.1 53.8254 164.005 66.5993 164.005 83.417V107.514C164.005 125.259 162.191 138.671 158.271 147.369C154.263 156.263 146.915 162.94 136.594 167.503C126.385 172.067 113.218 174.259 97.2598 174.259H80.9482V285.685H3V3H78.4609ZM253.727 52.9023V285.685H176.633V52.9023H253.727ZM340.066 3L340.739 5.07617L375.217 111.576V3H441.373V285.685H373.074L372.437 283.54L340.885 177.503V285.685H274.729V3H340.066ZM529.764 3L530.437 5.07617L564.914 111.576V3H631.07V285.685H562.771L562.134 283.54L530.582 177.503V285.685H464.426V3H529.764ZM780.094 3V64.3711H732.071V110.837H777.018V169.474H732.071V224.313H784.879V285.685H654.123V3H780.094ZM856.562 3C891.261 3 915.103 4.58021 927.724 7.88086C940.432 11.1756 950.373 16.6648 957.257 24.5322C963.973 32.2079 968.218 40.847 969.915 50.416L970.066 51.3027C971.613 60.7282 972.354 78.2346 972.354 103.583V200.482C972.354 225.24 971.177 242.276 968.658 251.177C966.241 260.001 961.895 267.119 955.539 272.354L955.525 272.365L955.512 272.376C949.288 277.379 941.674 280.856 932.762 282.876L932.725 282.884C923.861 284.775 910.729 285.685 893.476 285.685H799.729V3H856.562ZM877.677 232.279C881.261 232.117 884.123 231.657 886.319 230.951C889.085 230.062 890.521 228.879 891.218 227.692C892.072 226.172 892.93 222.858 893.525 217.215C894.108 211.695 894.406 204.364 894.406 195.185V87.6895C894.406 75.0643 893.992 67.3945 893.283 64.2539C892.65 61.4508 891.296 59.6509 889.275 58.5195L889.236 58.498L889.197 58.4746C888.245 57.9031 886.624 57.3425 884.116 56.9424C882.325 56.6565 880.183 56.4688 877.677 56.3867V232.279ZM80.9482 120.88C81.7872 120.907 82.5528 120.92 83.2461 120.92C89.5082 120.92 92.9003 119.392 94.5586 117.281L94.5674 117.271C95.4454 116.163 96.3056 114.186 96.9209 111.003C97.5268 107.868 97.8486 103.816 97.8486 98.7979V76.0684C97.8486 71.4729 97.4864 67.8277 96.8213 65.0645C96.1478 62.2671 95.228 60.6406 94.3262 59.7734C93.3913 58.8745 91.7015 57.9803 88.8926 57.3301C86.7575 56.8359 84.1188 56.516 80.9482 56.3945V120.88ZM253.727 3V45.0596H176.633V3H253.727Z"
                    fill="#A985FF"
                    stroke="white"
                    strokeWidth="6"
                    style={{
                        strokeDashoffset: '0px',
                        strokeDasharray: '0px, 6645.25px',
                        animation: `loader-stroke 50s linear 0s 1 normal forwards`,
                    }}
                />
                <style>{`
                    @keyframes loader-stroke {
                        0% {
                            stroke-dashoffset: 0px;
                            stroke-dasharray: 0px, 6645.25px;
                        }
                        50% {
                            stroke-dashoffset: -3322.625px;
                            stroke-dasharray: 3322.625px, 3322.625px;
                        }
                        100% {
                            stroke-dashoffset: -6645.25px;
                            stroke-dasharray: 6645.25px, 0px;
                        }
                    }
                `}</style>
            </svg>
        </div>
    );
};

export default Loader;
