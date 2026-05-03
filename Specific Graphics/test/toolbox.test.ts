/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import type { Color } from '../src/colors.ts';
import type { Point } from '../src/curves.ts';
import type { Polyline, Frame, Animation } from '../lib/animate.ts';
import { assertApproxEqual } from '../src/utils.ts';
import * as utils from '../src/utils.ts';
import { movePoints, numbersToPoints } from '../src/toolbox.ts';

describe ("movePoints", function() {
    /**
     * testing strategy:
     * partition on Points to move:
     *  length = 1
     *  length > 1
     * 
     * partition on vector:
     *  positive
     *  negative
     *  positive and negative 
     */

    it('covers length > 1, positive', function() {
        const points: Array<Point> = [{x: 0, y: 0}, {x: 1, y: 1}];
        const vector: Point = {x:1, y:1};
        assert.deepStrictEqual(movePoints(points, vector), [{x: 1, y: 1}, {x: 2, y: 2}], "expected points to move by 1,1")
    })

    it('covers length = 1, negative', function() {
        const points: Array<Point> = [{x: 1, y: 1}];
        const vector: Point = {x:-1, y:-1};
        assert.deepStrictEqual(movePoints(points, vector), [{x: 0, y: 0}], "expected points to move by -1,-1")
    })

    it('covers length = 1, positive and negative', function() {
        const points: Array<Point> = [{x: 0, y: 0}];
        const vector: Point = {x:1, y:-1};
        assert.deepStrictEqual(movePoints(points, vector), [{x: 1, y: -1}], "expected points to move by 1,1")
    })
})

describe ("numbersToPoints", function() {
    /**
     * testing strategy: 
     * 
     * partition on numbers:
     *  length = 0
     *  length = 1
     *  length > 1
     */

    it("covers length = 0", function() {
        const numbers: Array<number> = [];
        assert.deepStrictEqual(numbersToPoints(numbers), [], "expected empty array");
    })

    it("covers length = 1", function() {
        const numbers: Array<number> = [1];
        assert.deepStrictEqual(numbersToPoints(numbers), [{ x: 1, y: 0 }], "expected one point");
    })

    it("covers length = 0", function() {
        const numbers: Array<number> = [1, 2];
        assert.deepStrictEqual(numbersToPoints(numbers), [{ x: 1, y: 0 }, { x: 2, y: 0 }], "expected two points");
    })
})

