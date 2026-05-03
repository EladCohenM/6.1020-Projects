/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Utility functions. @module */

import assert from 'node:assert';
import type { Color } from './colors.ts';
import type { Point } from './curves.ts';

/*
 * PS1 instructions: use this file to define public utility functions.
 * 
 * You may define small private helper functions in individual implementation files.
 * For helper functions of any complexity and/or helpers used by both implementations and tests,
 * define them here and test them in `test/utils.test.ts`.
 */

const rgbMax = 255;
const hexSides = 6;
const hexDegrees = 60;

/**
 * Convert from RGB to HSL color.
 * 
 * @param rgb RGB color, [r,g,b] tuple of integers 0 <= r,g,b <= 255
 * @returns HSL color, [h,s,l] tuple of numbers 0 <= h < 360 and 0 <= s,l <= 1
 */
export function rgbToHsl(rgb: Color): Color {
    assert(rgb.every(val => 0 <= val && val <= rgbMax), 'invalid RGB component');
    const fractional = rgb.map(val => val / rgbMax);
    const [ red, green, blue ] = fractional;
    const maxVal = Math.max(...fractional);
    const minVal = Math.min(...fractional);
    const chroma = maxVal - minVal;
    const lightness = (maxVal + minVal) / 2;
    const hueVal = chroma === 0 ?     0 :
                   maxVal === red ?   (green - blue) / chroma + 2 * 0 :
                   maxVal === green ? (blue - red) / chroma + 2 * 1 :
                   maxVal === blue ?  (red - green) / chroma + 2 * 2 :
                   assert.fail('error finding maximum component value');
    const saturationLevel = Math.min(lightness, 1 - lightness);
    const saturation = saturationLevel === 0 ? 0 : (maxVal - lightness) / saturationLevel;
    return [ hexDegrees * ((hueVal + hexSides) % hexSides), saturation, lightness ];
}

/**
 * Convert from HSL to nearest (rounded, half up) RGB color.
 * 
 * @param hsl HSL color, [h,s,l] tuple of numbers 0 <= h < 360 and 0 <= s,l <= 1
 * @returns nearest RGB color, [r,g,b] tuple of integers 0 <= r,g,b <= 255
 */
export function hslToRgb(hsl: Color): Color {
    const [ hueDegrees, saturation, lightness ] = hsl;
    assert(0 <= hueDegrees && hueDegrees < hexSides * hexDegrees, 'invalid HSL hue');
    assert(0 <= saturation && saturation <= 1, 'invalid HSL saturation');
    assert(0 <= lightness && lightness <= 1, 'invalid HSL lightness');
    const hue = hueDegrees / hexDegrees;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const maxVal = chroma * (1 - Math.abs(hue % 2 - 1));
    const [ red, green, blue ] = [
        [ chroma, maxVal, 0 ],
        [ maxVal, chroma, 0 ],
        [ 0, chroma, maxVal ],
        [ 0, maxVal, chroma ],
        [ maxVal, 0, chroma ],
        [ chroma, 0, maxVal ],
    ][Math.floor(hue)];
    const lightening = lightness - chroma / 2;
    const scale = (val: number): number => Math.abs(Math.round(rgbMax * (val + lightening)));
    return [ scale(red), scale(green), scale(blue) ];
}

/** Default tolerance for assertApproxEqual. */
export const defaultTolerance = 0.001;

/**
 * @param actual actual value
 * @param expected expected value
 * @param message optional error message
 * @param tolerance optional error tolerance, overriding the default
 * @throws AssertionError iff |actual-expected| > tolerance
 */
export function assertApproxEqual(actual: number, expected: number, message?: string, tolerance=defaultTolerance): void {
    if (Math.abs(actual - expected) > tolerance) {
        throw new assert.AssertionError({
            message,
            actual: `${actual}`,
            expected: `${expected} ± ${tolerance}`,
            operator: 'not approx. eq.',
            stackStartFn: assert.AssertionError,
        });
    }
}
