/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Utility functions. @module */

import assert from 'node:assert';
import { Interval } from './interval.ts';
import { IntervalSet, IntervalConflictError } from './intervalset.ts';
import { MultiIntervalSet } from './multiintervalset.ts';

/*
 * PS2 instructions: use this file to define public utility functions.
 * 
 * You may define small private helper functions in individual implementation files.
 * For helper functions of any complexity and/or helpers used by both implementations and tests,
 * define them here and test them in `test/utils.test.ts`.
 */

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
