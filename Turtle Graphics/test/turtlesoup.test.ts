/* Copyright (c) 2007-2023 MIT 6.102/6.031/6.005 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Point } from '../src/turtle.ts';
import { chordLength, distance, findPath } from '../src/turtlesoup.ts';

/**
 * Assert that two numbers are equal within a given error tolerance.
 * @param actual   answer actually returned by the module being tested
 * @param expected answer expected by the test
 * @param delta    actual is considered equal to expected if it's within +/- delta; defaults to 0.001
 * @param message  optional message with extra information about this test case, to display when the assertion fails
 */
function assertAlmostEqual(actual: number, expected: number, delta: number = 0.001, message?: string): void {
    assert(Math.abs(expected - actual) <= delta,
          (message ? message + ", " : "") + "expected <" + expected.toFixed(3) + "> but got <" + actual.toFixed(3) + ">");
}

/**
 * Compute n modulo d.
 * @param n 
 * @param d must be > 0
 * @return modulus k such that n = dq + k for some integer q and 0 <= k < d
 */
function modulo(n: number, d: number): number {
    return ((n % d) + d) % d;
}

/**
 * Tests chordLength.
 */
describe('chordLength', function() {
    /** partitions
     * angle is acute, right, or obtuse
     * result is an integer vs. decimal
     */
    it('acute angle, integer result', function() {
        assertAlmostEqual(chordLength(10.0, Math.PI/3), 10.0);
    });
    it('right angle, decimal result', function() {
        assertAlmostEqual(chordLength(5.0, Math.PI/2), 7.071);
    });
    it('obtuse angle, decimal result', function() {
        assertAlmostEqual(chordLength(20.0, 5*Math.PI/6), 38.637);
    });
});


/**
 * Tests distance.
 */
describe('distance', function() {
    /** partitions on points p1 and p2
     * p1.x = p2.x, p1.x != p2.x
     * p1.y = p2.y, p1.y != p2.y
     */
    it('for p1.x = p2.x, p1.y != p2.y', function() {
        assertAlmostEqual(distance(new Point(0, 0), new Point(0, 17)), 17.0);
    });
    it('for p1.x != p2.x, p1.y != p2.y', function() {
        assertAlmostEqual(distance(new Point(-5, -5), new Point(10, 10)), 21.213);
    });
    it('for p1.x = p2.x, p1.y = p2.y', function() {
        assertAlmostEqual(distance(new Point(20, 20), new Point(20, 20)), 0.0);
    });
});

/**
 * Tests findPath.
 */

describe('findPath', function() {
    /** testing strategy: incomplete */

    it('can go upward', function() {
        const path: Array<number> = findPath([new Point(0, 10)]);
        assert.strictEqual(path.length, 3);
        assertAlmostEqual(modulo(path[0], 360), 0);
        assertAlmostEqual(path[1], 10);
        assertAlmostEqual(modulo(path[2], 360), 0);
    });

    it('can go diagonally', function() {
        const path: Array<number> = findPath([new Point(100, 100)]);
        assert.strictEqual(path.length, 3);
        assertAlmostEqual(modulo(path[0], 360), 45);
        assertAlmostEqual(path[1], 100*Math.sqrt(2));
        assertAlmostEqual(modulo(path[2], 360), 315);
    });

    it('can return to the origin', function() {
        const path: Array<number> = findPath([new Point(0, -20), new Point(0, 0)]);
        assert.strictEqual(path.length, 5);
        assertAlmostEqual(modulo(path[0], 360), 180);
        assertAlmostEqual(path[1], 20);
        assertAlmostEqual(modulo(path[2], 360), 180);
        assertAlmostEqual(path[3], 20);
        assertAlmostEqual(modulo(path[4], 360), 0);
    });

    it('can handle an empty list', function() {
        const path: Array<number> = findPath([]);
        assert.strictEqual(path.length, 1);
        assertAlmostEqual(modulo(path[0], 360), 0);
    });
});
