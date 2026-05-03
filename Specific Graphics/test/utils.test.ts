/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import type { Color } from '../src/colors.ts';
import type { Point } from '../src/curves.ts';
import * as utils from '../src/utils.ts';

/*
 * Tests for utility functions in `utils.ts`.
 */

describe('assertApproxEqual', function() {
    /*
     * PS1 instructions: you are not required to partition & test this provided function.
     */
    it('covers equal, approximately equal below/above', function() {
        utils.assertApproxEqual(17/3, 17/3);
        utils.assertApproxEqual(17/3, 5.666);
        utils.assertApproxEqual(17/3, 5.667);
    });
    it('covers unequal below/above', function() {
        assert.throws(() => utils.assertApproxEqual(17/3, 5.665), assert.AssertionError);
        assert.throws(() => utils.assertApproxEqual(17/3, 5.668), assert.AssertionError);
    });
});

describe('rgbToHsl and hslToRgb', function() {
    /*
     * PS1 instructions: you are not required to partition & test these provided functions.
     */
    it('round-trips RGB inputs not partitioned', function() {
        const colors: Array<Color> = [
            [0, 0, 0], [255, 0, 0], [0, 128, 0], [128, 128, 255], [54, 38, 152],
        ];
        for (const rgb of colors) {
            assert.deepStrictEqual(utils.hslToRgb(utils.rgbToHsl(rgb)), rgb);
        }
    });
    it('round-trips HSL inputs not partitioned', function() {
        const colors: Array<Color> = [
            [0, 0, 0], [60, 1, 0.5], [240, 0.5, 0.75], [162, 0.7, 0.4], [14, 0.8, 0.9],
        ];
        for (const hsl of colors) {
            const [ hueIn, satIn, lightIn ] = hsl;
            const [ hueOut, satOut, lightOut ] = utils.rgbToHsl(utils.hslToRgb(hsl));
            utils.assertApproxEqual(hueOut, hueIn, 'incorrect hue', 1);
            utils.assertApproxEqual(satOut, satIn, 'incorrect saturation', .1);
            utils.assertApproxEqual(lightOut, lightIn, 'incorrect lightness', .1);
        }
    });
});
