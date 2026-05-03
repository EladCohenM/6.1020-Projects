/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Functions for working with RGB colors. @module */

import assert from 'node:assert';
import { lerp } from './lerp.ts';
import * as utils from './utils.ts';

/*
 * PS1 instructions:
 * - All specifications in this file are required and you may NOT change them.
 * - Specifications with non-integral numbers assume a tolerance as explained in the handout,
 *   and you may NOT strengthen or weaken that tolerance.
 */

/**
 * A 3-tuple representing a color.
 */
export type Color = [number, number, number];

/**
 * Perform linear interpolation between RGB colors, [r,g,b] tuples of integers 0 <= r,g,b <= 255.
 * 
 * @param c0 first color for interpolation
 * @param c1 second color for interpolation
 * @param t parameter 0 <= t <= 1
 * @returns the RGB color whose components are linearly interpolated between corresponding
 *   components of c0 and c1 with parameter t, rounded to the nearest integer (half up)
 */
export function lerpColor(c0: Color, c1: Color, t: number): Color {
    const color: Color = [0,0,0];
    for (let i = 0; i <= 2; i++) {
        color[i] = Math.round(lerp(c0[i], c1[i], t));
    }
    return color;
}

/**
 * Fill in a multicolor gradient that transitions between the provided colors in the specified steps.
 * All colors are [r,g,b] tuples of integers 0 <= r,g,b <= 255.
 * 
 * For example, given:
 * - { 0: [0,0,252], 3: [0,126,0], 5: [254,0,0] }
 * 
 * Modifies the input to contain:
 * - { 0: [0,0,252], 1: [0,42,168], 2: [0,84,84], 3: [0,126,0], 4: [127,63,0], 5: [254,0,0] }
 * 
 * and returns 3.
 * 
 * @param colors a map of integer keys to RGB colors, not containing keys that differ by more than 2^10,
 *   mutated so that its keys are the integers from the lowest to highest initial keys, inclusive,
 *   and each key `k` maps to the RGB color:
 *   - colors[k] if k is initially a key in colors
 *   - otherwise, letting `prev` and `next` be the nearest lower and higher initial keys, respectively,
 *     the linear interpolation between colors[prev] and colors[next], rounded (half up), at t equal to
 *     k's fractional distance from prev to next
 * @returns the number of keys added to colors
 */
export function fillGradient(colors: Map<number, Color>): number {
    // get list of all keys in sorted order
    const colorKeys: Array<number> = Array.from(colors.keys());
    let changesCounter = 0;
    // go over pairs of consecutive keys check difference
    for (let i = 0; i < colorKeys.length-1; i++) {
        const currentKey = colorKeys[i];
        const currentColor = colors.get(currentKey) ?? [0, 0, 0];
        const nextKey = colorKeys[i + 1];
        const nextColor = colors.get(nextKey) ?? [0, 0, 0];
        const difference = nextKey - currentKey;
        // color lerp over the distance between two keys mutating colors map
        if (difference > 1) {
            for (let j = 1; j < difference; j++) {
                colors.set(currentKey+j, lerpColor(currentColor, nextColor, j/difference)); // currentKey + j equals to a missing key in colors
                changesCounter += 1;
            };
        };
    };

    return changesCounter;
}

/**
 * Produce a palette of RGB colors that have the same saturation and lightness as the input and evenly
 * divide the spectrum of hues using the HSL representation of RGB.
 * All input and output colors are [r,g,b] tuples of integers 0 <= r,g,b <= 255.
 * See https://en.wikipedia.org/wiki/HSL_and_HSV for an explanation of HSL and its relationship to RGB.
 * 
 * For example, a palette generated from pure green (which has hue=120°, saturation=100%, lightness=50%)
 * and n=4 would have: a bright orange (hue=30°), pure green, a dodger blue (210°), and fuchsia (300°).
 * 
 * @param color base RGB color
 * @param n number of hues to select from the spectrum of hues, nonnegative integer
 * @returns an array of exactly all the distinct RGB colors converted (and rounded, half up) from HSL
 *   colors that have:
 *   - hues, in degrees, that are multiples modulo 360 of 360/n degrees from the hue of `color`,
 *   - and the same saturation and lightness as `color`
 */
export function makePalette(color: Color, n: number): Array<Color> {
    
    if (n === 0) { 
        return [];
    }

    // local constants
    const { rgbToHsl } = utils;
    const { hslToRgb } = utils;
    const fullDegrees = 360;
    const degreeGap = fullDegrees/n;    

    const [hue, saturation, lightness] = rgbToHsl(color);
    
    // edge cases
    if (lightness === 0) {
        return [[0, 0, 0]];
    } else if (lightness === 1) {
        return [[255, 255, 255]];
    } else if (saturation === 0) {
        return [color];
    }
    
    // create new list with all of the colors in hsl
    const hslArray: Array<Color> = [];
    for (let i = 0; i < n; i++) {
        hslArray.push([(hue+i*degreeGap)%fullDegrees, saturation, lightness]);
    }
    
    // create new list with the colors in rgb and return
    const rgbArray: Array<Color> = [];
    for (const hslColor of hslArray) {
        rgbArray.push(hslToRgb(hslColor));
    }
    return rgbArray;
}

/**
 * Perform interpolation of scalars with an easing function. The easing function transforms linear
 * change into change that may accelerate, oscillate, etc., and that may not be bounded or endpointed
 * by v0 and v1.
 * 
 * For example:
 * 
 *     interpolate(0, 1, t => t*t, 0.6) = 0.36
 *     interpolate(0, 10, t => t*Math.cos(2*Math.PI*t), 0.4) ≈ -3.236
 * 
 * @param v0 value when easing(t) = 0
 * @param v1 value when easing(t) = 1
 * @param easing function mapping input interpolation parameter ti, 0 <= ti <= 1, to an applied
 *   interpolation parameter, unconstrained
 * @param t input interpolation parameter
 * @returns the linear interpolation along v0 to v1 at easing(t)
 * @throws Error if t < 0 or t > 1
 */
export function interpolate(v0: number, v1: number, easing: (ti: number) => number, t: number): number {
    // In one sentence, why can you not use `lerp` with your `lerpWeak` spec to implement this function?
    // Because lerpWeak has only 0 <= t <= 1 as legal input while interpolate accepts also t outside that range and throws error.
    if (t < 0 || t > 1) { throw new Error("t need to be between 0 and 1, inclusive" );}
    const newT: number = easing(t);
    return lerp(v0, v1, newT);
}