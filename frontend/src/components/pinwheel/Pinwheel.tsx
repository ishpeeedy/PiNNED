import type React from 'react';
import { useMemo } from 'react';
import { pinwheelShapes } from './pinwheelShapes';

const WHEEL_SIZE = 38;
const STICK_HEIGHT = 62;
const STICK_WIDTH = 3;

interface PinwheelProps {
    className?: string;
    style?: React.CSSProperties;
    /** Spin duration in seconds — higher = slower. Default 8 */
    speed?: number;
}

export default function Pinwheel({
    className = '',
    style,
    speed = 8,
}: PinwheelProps) {
    const Shape = useMemo(
        () => pinwheelShapes[Math.floor(Math.random() * pinwheelShapes.length)],
        []
    );

    return (
        <div
            className={`pointer-events-none ${className}`}
            style={style}
            aria-hidden="true"
        >
            {/* Wheel */}
            <div
                style={{
                    width: WHEEL_SIZE,
                    height: WHEEL_SIZE,
                    animation: `pw-spin ${speed}s linear infinite`,
                }}
            >
                <Shape size={WHEEL_SIZE} color="var(--main)" />
            </div>

            {/* Stick — top overlaps wheel center */}
            <div
                className="bg-black dark:bg-white"
                style={{
                    width: STICK_WIDTH,
                    height: STICK_HEIGHT,
                    marginTop: -(WHEEL_SIZE / 2),
                    marginLeft: (WHEEL_SIZE - STICK_WIDTH) / 2,
                    borderRadius: '0 0 2px 2px',
                }}
            />
        </div>
    );
}
