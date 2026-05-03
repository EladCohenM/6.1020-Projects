/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { forTestingOnly } from '../src/lerp.ts';
import { assertApproxEqual } from '../src/utils.ts';
import * as utils from '../src/utils.ts';

// PS1 instructions: test each implementation independently, do not call `lerp`
const lerp = undefined, lerpWeak = undefined, lerpStrong = undefined;

describe('lerpWeak', function() {
    const { lerpWeak } = forTestingOnly;

    /*
     * Testing strategy:
     * 
     * Partition on v0:
     *  v0 > 0 
     *  v0 < 0
     *  v0 = 0 
     * 
     * Partition on v1:
     *  v1 > 0 
     *  v1 < 0
     *  v1 = 0 
     * 
     * Partition on t:
     *  t = 0 
     *  t = 1 
     *  0 < t < 1 
     */

    // TODO: when you name your tests, state the partitions that the test covers
    it('covers v0 = 0, v1 > 0, and t = 0 and t = 1', function() {
        // TODO: maybe these are valid assertions for your spec, or maybe not.
        // Also use `assertApproxEqual` instead of `assert.strictEqual` as appropriate.
        assert.strictEqual(lerpWeak(0, 10, 0), 0, 'incorrect t=0 value');
        assert.strictEqual(lerpWeak(0, 10, 1), 10, 'incorrect t=1 value');
    });

    it('covers v0 < 0, v1 = 0, 0 < t < 1', function() {
        assert.strictEqual(lerpWeak(-10,0,0.3), -7, "incorrect value when t=0.3");
    });
    
    it('covers v0 > 0, v1 < 0, 0 < t < 1', function() {
        assert.strictEqual(lerpWeak(-5,5,0.5), 0, "incorrect value when t=0.3");
    });
    
    // it('covers v0 > 0, v1 < 0, and t > 1 and t < 0', function() {
    //     assert.strictEqual(lerpWeak(5, -1, -2), Error, "incorrect. t < 0");
    //     assert.strictEqual(lerpWeak(5, -2, 2), Error, "incorrect. t > 1");
    // });
});

describe('lerpStrong', function() {
    const { lerpStrong } = forTestingOnly;

    /*
     * Testing strategy:
     * 
     * Partition on v0:
     *  v0 > 0 
     *  v0 < 0
     *  v0 = 0 
     * 
     * Partition on v1:
     *  v1 > 0 
     *  v1 < 0
     *  v1 = 0 
     * 
     * Partition on t:
     *  t = 0 
     *  t = 1 
     *  0 < t < 1 
     *  t < 0 or t > 1
     */

    it('covers v0 = 0, v1 > 0, and t = 0 and t = 1', function() {
    assert.strictEqual(lerpStrong(0, 10, 0), 0, 'incorrect t=0 value');
    assert.strictEqual(lerpStrong(0, 10, 1), 10, 'incorrect t=1 value');
    });

    it('covers v0 < 0, v1 = 0, 0 < t < 1', function() {
        assert.strictEqual(lerpStrong(-10,0,0.3), -7, "incorrect value when t=0.3");
    });
    
    it('covers v0 > 0, v1 < 0, 0 < t < 1', function() {
        assert.strictEqual(lerpStrong(-5,5,0.5), 0, "incorrect value when t=0.3");
    });
    
    it('covers v0 > 0, v1 < 0, and t > 1 and t < 0', function() {
        assert.strictEqual(lerpStrong(1,-1,-1), 3, "incorrect value when t=-1");
        assert.strictEqual(lerpStrong(1,-1,2), -3, "incorrect value when t=-1");
    });
});
