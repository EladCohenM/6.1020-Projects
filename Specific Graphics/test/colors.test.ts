/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import type { Color } from '../src/colors.ts';
import * as colorsModule from '../src/colors.ts';
import { assertApproxEqual } from '../src/utils.ts';
import * as utils from '../src/utils.ts';

// PS1 instructions: test each of these functions independently
const lerpColor = undefined, gradient = undefined, palette = undefined, interpolate = undefined;

/*
 * Warning: tests you write in this file must be runnable against any implementations that follow the spec!
 * Your tests will be run against several staff implementations of these functions.
 * 
 * Do NOT strengthen the spec of any of those functions.
 */

describe('lerpColor', function() {
    const { lerpColor } = colorsModule;

    /*
     * Testing strategy:
     * 
     * partition on t:
     *  t = 1
     *  t = 0
     *  0 < t < 1
     * 
     * partition on result color:
     *  rounded
     *  not rounded
     */

    it('covers 0 < t < 1, not rounded', function() {
        assert.deepStrictEqual(
            lerpColor([0, 0, 0 ], [128, 128, 128], 0.5),
            [64, 64, 64],
            'expected 25% gray between black and 50% gray'
        );
    });
    
    it('covers 0 < t < 1, rounded', function() {
        assert.deepStrictEqual(
            lerpColor([0, 0, 0 ], [127, 127, 127], 0.5),
            [64, 64, 64],
            'expected 25% gray between black and 50% gray'
        );
    });

    it('covers t = 0, not rounded', function() {
        assert.deepStrictEqual(
            lerpColor([0, 0, 0 ], [128, 128, 128], 0),
            [0, 0, 0],
            'expected 100% black'
        );
    });

    it('covers t = 1, not rounded', function() {
        assert.deepStrictEqual(
            lerpColor([0, 0, 0 ], [255, 255, 255], 1),
            [255, 255, 255],
            'expected 100% black'
        );
    });
});

describe('fillGradient', function() {
    const { fillGradient } = colorsModule;

    /*
     * Testing strategy:
     * 
     * Partition on the number number of gaps:
     *  0 gaps
     *  1 gap
     *  >1 gaps
     * 
     * partition on the length on the map:
     *  length = 0
     *  length = 1
     *  length > 1
     * 
     */

    it('covers >1 gaps, length > 1', function() {
        const start: Color = [0, 0, 252], 
              middle: Color = [0, 126, 0],
              end: Color = [254, 0, 0];
        const colors = new Map([ [0, start], [3, middle], [5,end] ]);
        const added = fillGradient(colors);
        assert.strictEqual(
            added,
            3,
            `unexpected number of colors added to gradient`);
        const intermediate = [ colors.get(1), colors.get(2), colors.get(4) ];
        assert.deepStrictEqual(
            intermediate,
            [ [0, 42, 168], [0, 84, 84], [127,63,0]],
            `expected colors between ${start} and ${end}`
        );
    });

    it('covers 1 gap, length > 1', function() {
        const start: Color = [0, 0, 252], end: Color = [0, 126, 0];
        const colors = new Map([ [0, start], [3, end] ]);
        const added = fillGradient(colors);
        assert.strictEqual(
            added,
            2,
            `unexpected number of colors added to gradient`);
        const intermediate = [ colors.get(1), colors.get(2) ];
        assert.deepStrictEqual(
            intermediate,
            [ [0, 42, 168], [0, 84, 84] ],
            `expected colors between ${start} and ${end}`
        );
    });
    
    it('covers 0 gap, length = 0 and length = 1', function() {
        const colors0: Map<number, Color> = new Map([]);
        const added0 = fillGradient(colors0);
        assert.strictEqual(
            added0,
            0,
            `unexpected number of colors added to gradient`);
        const colors1: Map<number, Color> = new Map([[0, [0, 0, 252]]]);
        const added1 = fillGradient(colors1);
        assert.strictEqual(
            added1,
            0,
            `unexpected number of colors added to gradient`);
        
    });
});

describe('makePalette', function() {
    const { makePalette } = colorsModule;

    /* 
     * Testing strategy:
     * 
     * Partitions by n:
     *  n = 0
     *  n = 1
     *  n > 1
     * 
     * partition on lightness (l):
     *  l = 100%
     *  l = 0%
     *  0 < l < 100
     * 
     * partition on saturation (s):
     *  s = 0
     *  0 < s <= 100
     */

    it('covers n > 1, 0 < s <= 100, 0 < l < 100', function() {
        const green: Color = [0, 255, 0];
        const palette = makePalette(green, 4);
        assert.strictEqual(
            palette.length,
            4,
            `unexpected number of colors in palette from ${green}`
        );
    });
    
    it('covers l = 100%, l = 0%', function() {
        const white: Color = [255, 255, 255];
        const black: Color = [0, 0, 0];
        const whitePalette = makePalette(white, 4);
        const blackPalette = makePalette(black, 4);
        assert.strictEqual(
            whitePalette.length,
            1,
            `unexpected number of colors in palette from ${white}`
        );
        assert.strictEqual(
            blackPalette.length,
            1,
            `unexpected number of colors in palette from ${black}`
        );
    });
    
    it('covers, s = 0%', function() {
        const gray: Color = [255, 255, 255];
        const palette = makePalette(gray, 4);
        assert.strictEqual(
            palette.length,
            1,
            `unexpected number of colors in palette from ${gray}`
        );
    });
    
    it('covers n = 1', function() {
        const green: Color = [0, 255, 0];
        const palette = makePalette(green, 1);
        assert.strictEqual(
            palette.length,
            1,
            `unexpected number of colors in palette from ${green}`
        );
    });
    
    it('covers n = 0', function() {
        const green: Color = [0, 255, 0];
        const palette = makePalette(green, 0);
        assert.strictEqual(
            palette.length,
            0,
            `unexpected number of colors in palette from ${green}`
        );
    });
});

describe('interpolate', function() {
    const { interpolate } = colorsModule;

    /*
     * Testing strategy:
     * 
     * Partition on v0:
     *  v0 > 0 V
     *  v0 < 0 V
     *  v0 = 0 V
     * 
     * Partition on v1:
     *  v1 > 0 V
     *  v1 < 0 V
     *  v1 = 0 V
     * 
     * Partition on t:
     *  t = 0 V
     *  t = 1 V
     *  0 < t < 1 V
     *  t < 0 or t > 1 V
     * 
     * parition on easing function:
     *  keeps t in boundaries V
     *  takes t outside of boundaries V
     * 
     */

    it('covers v0 = 0, v1 > 0, 0 < t < 1', function() {
        assertApproxEqual(
            interpolate(0, 1, t => t, 0.25),
            0.25,
            'incorrect value with identity easing function'
        );
    });
    
    it('covers v0 < 0, v1 < 0, t = 1 and t = 0', function() {
        assertApproxEqual(
            interpolate(-11, -1, t => t, 1),
            -1,
            'incorrect value with identity easing function'
        );
        assertApproxEqual(
            interpolate(-11, -1, t => t, 0),
            -11,
            'incorrect value with identity easing function'
        );
    });
    
    it('covers v0 > 0, v1 = 0, t > 1 and t < 0, function out of boundaries', function() {
        assertApproxEqual(
            interpolate(1, 0, t => 2*t, 1),
            -1,
            'incorrect value with identity easing function'
        );
        assertApproxEqual(
            interpolate(1, 0, t => -t, 1),
            2,
            'incorrect value with identity easing function'
        );
    });
});
