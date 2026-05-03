/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Point, lerpPoint, bezierInterpolate, bezierPath } from '../src/curves.ts';
import { assertApproxEqual } from '../src/utils.ts';
import * as utils from '../src/utils.ts';

describe('bezierInterpolate', function() {
    /*
     * Testing strategy:
     * 
     * Partition by controlPoints:
     *  length = 0
     *  length = 1
     *  length = 2
     *  length > 2
     * 
     * Partition by t:
     *  0 > t
     *  t > 1
     *  t = undefined
     *  t = 0
     *  t = 1
     *  t between 0 and 1
     */

    it('covers length > 2, t = 0', function() {
        const point = bezierInterpolate([ { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }], 0);
        assert.deepStrictEqual(point, { x: 0, y: 0 }, 'expected P_0 at t=0');
    });
    
    it('covers length = 2, t = 1', function() {
        const point2 = bezierInterpolate([ { x: 0, y: 0 }, { x: 1, y: 1 } ], 1);
        assert.deepStrictEqual(point2, { x: 1, y: 1 }, 'expected P_1 at t=1');
    });
    
    it('covers length > 1, 0 < t < 1', function() {
        const point3 = bezierInterpolate([ { x: 0, y: 0 }, { x: 1, y: 1 } ], 0.5);
        assert.deepStrictEqual(point3, { x: 0.5, y: 0.5 }, 'expected middle at t=0.5');
    });
    
    it('covers length > 1, t = undefined', function() {
        const point = bezierInterpolate([ { x: 0, y: 0 }, { x: 1, y: 1 } ], undefined);
        assert.deepStrictEqual(point, { x: 0, y: 0 }, 'expected P_0 at t=undefined');
    });
   
    it('covers length > 1, t > 1', function() {
        const point = bezierInterpolate([ { x: 0, y: 0 }, { x: 1, y: 1 } ], 2);
        assert.deepStrictEqual(point, { x: 0, y: 0 }, 'expected P_0 at t>1');
    });
    
    it('covers length > 1, t < 0', function() {
        const point = bezierInterpolate([ { x: 0, y: 0 }, { x: 1, y: 1 } ], -1);
        assert.deepStrictEqual(point, { x: 0, y: 0 }, 'expected middle at t<0');
    });
    
    it('covers length = 1, t = 0', function() {
        const point = bezierInterpolate([ { x: 1, y: 1 } ], 0);
        assert.deepStrictEqual(point, { x: 1, y: 1 }, 'expected same point');
    });
    
    it('covers length = 0', function() {
        assert.throws(() => {bezierInterpolate([], 0)});
    });
});

describe('bezierPath', function() {
    /* 
     * Testing strategy:
     * 
     * partition by numOfPoints:
     *  numOfPoints > 1
     *  numOfPoints = undefined
     * 
     * partition by controlPoints:
     *  length = 1
     *  length > 1
     * 
     * parition on easing: 
     *  easing function is linear
     *  easing is not linear
     * 
     */

    it('covers numOfPoints > 1, controlPoints > 1, easing is linear', function() {
        const path = bezierPath([ { x: 0, y: 0 }, { x: 1, y: 1 } ], t => t, 3);
        assert.deepStrictEqual(path, [ { x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 } ], 'expected 0.5, 0.5 to be in the middle');
    });
    
    it('covers numOfPoints > 1, controlPoints > 1, easing is nonlinear', function() {
        const path = bezierPath([ { x: 0, y: 0 }, { x: 1, y: 1 } ], t => t**2, 3);
        assert.deepStrictEqual(path, [ { x: 0, y: 0 }, { x: 0.25, y: 0.25 }, { x: 1, y: 1 } ], 'expected 0.25, 0.25 to be in the middle');
    });
    
    it('covers length = 1', function() {
        const path = bezierPath([ { x: 1, y: 1 } ], t => t, 2);
        assert.deepStrictEqual(path, [{ x: 1, y: 1 }, { x: 1, y: 1 }], "expected to have only the point in controlPoints");
    });
    
    it('covers numOfPoints = undefined', function() {
        const path = bezierPath([ { x: 0, y: 0 }, { x: 1, y: 1 } ], t => t, undefined);
        assert.deepStrictEqual(path, [ { x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 } ], 'expected 0.5, 0.5 to be in the middle'); });
    });

// MINE
describe('lerpPoint', function() {
    /*
     * Testing Strategy:
     * partition on p1, and p2:
     *  p1 = p2
     *  p1 != p2
     * 
     * partition on t:
     *  t > 1 and t < 0 
     *  t = 1 and t = 0
     *  0 < t < 1
     */

    it('covers p1 != p2, t = 1 and t = 0', function() {
        const p1: Point = {x: 0, y: 0};
        const p2: Point = {x: 2, y: 2};
        assert.deepStrictEqual(lerpPoint(p1,p2, 0), {x: 0, y: 0});
        assert.deepStrictEqual(lerpPoint(p1,p2, 1), {x: 2, y: 2});
    });
    
    it('covers p1 != p2, 0 < t < 1', function() {
        const p1: Point = {x: 0, y: 0};
        const p2: Point = {x: 2, y: 2};
        assert.deepStrictEqual(lerpPoint(p1,p2, 0.5), {x: 1, y: 1});
    });
    
    it('covers p1 = p2, t > 1 and t < 0 ', function() {
        const p1: Point = {x: 0, y: 0};
        const p2: Point = {x: 2, y: 2};
        assert.deepStrictEqual(lerpPoint(p1,p2, -1), {x: 0, y: 0});
        assert.deepStrictEqual(lerpPoint(p1,p2, 2), {x: 0, y: 0});
    });
});

