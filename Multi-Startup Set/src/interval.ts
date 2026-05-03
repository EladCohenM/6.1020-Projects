/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';

/**
 * Represents an immutable half-open interval.
 * 
 * PS2 instructions: do NOT change this class.
 */
export class Interval {

    /**
     * Make an interval [start, end).
     * 
     * @param start low end of the interval, inclusive
     * @param end high end of the interval, exclusive, must be greater than start
     */
    public constructor(
        public readonly start: bigint,
        public readonly end: bigint
    ) {
        this.checkRep();
    }

    // AF(start, end) = half-open interval [start, end)
    // RI: start < end
    // Safety from rep exposure: all fields are unreassignable and have immutable built-in type

    // assert the rep invariant
    private checkRep(): void {
        assert(this.start < this.end, `expected start=${this.start} < end=${this.end}`);
    }

    /**
     * @inheritdoc
     */
    public toString(): string {
        this.checkRep();
        return `Interval[${this.start},${this.end})`;
    }
}
