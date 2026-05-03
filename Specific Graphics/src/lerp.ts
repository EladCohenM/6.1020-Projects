/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Function for performing linear interpolation. @module */

import assert from 'node:assert';

/**
 * Perform linear interpolation between two numbers.
 * @param v0 first number for the lerp.
 * @param v1 second number for the lerp.
 * @param t the "location" on the scale between the two numbers. 
 *           where t=0 is v0 and t=1 is v1. t must be 0 <= t <= 1.
 * @returns the matching number on the scale between v0 and v1.
 */
function lerpWeak(v0: number, v1: number, t: number): number {
    return v0 + t * (v1 - v0);
}

/**
 * Perform linear interpolation between two numbers.
 * @param v0 first number for the lerp.
 * @param v1 second number for the lerp.
 * @param t interpolation parameter
 * @returns the matching number on the scale between v0 and v1.
 */
function lerpStrong(v0: number, v1: number, t: number): number {
    return v0 + t * (v1 - v0);
}

// In three sentences, explicate the relationship between your `lerpWeak` and `lerpStrong`...
// 1. In one sentence, explain the relationship between their preconditions:
// lerpWeak preconditions are stronger than those of lerpStrong (t has to be 0 <= t <= 1)
// 2. In one sentence, explain the relationship between their postconditions:
// lerpStrong postconditions are stronger than those of lerpWeak (committed to throw error when t < 0 or t > 1)
// 3. In one sentence, explain the resulting relationship between their specs:
// lerpStrong spec is stronger than lerpWeak since it has less implementations.

// `lerp` is the name used by clients of this function.
export const lerp = lerpStrong;

/** PS1 instructions: both implementations are exported for PS1 testing purposes only. */
export const forTestingOnly = { lerpWeak, lerpStrong };
