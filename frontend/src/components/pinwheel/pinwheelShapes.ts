import type { ComponentType } from 'react';

import Star3 from '@/components/stars/s3';
import Star8 from '@/components/stars/s8';
import Star12 from '@/components/stars/s12';
import Star17 from '@/components/stars/s17';
import Star22 from '@/components/stars/s22';
import Star27 from '@/components/stars/s27';
import Star33 from '@/components/stars/s33';
import Star38 from '@/components/stars/s38';

export type StarComponent = ComponentType<{
    color?: string;
    size?: number;
    stroke?: string;
    strokeWidth?: number;
    pathClassName?: string;
    width?: number;
    height?: number;
}>;

export const pinwheelShapes: StarComponent[] = [
    Star3,
    Star8,
    Star12,
    Star17,
    Star22,
    Star27,
    Star33,
    Star38,
];
