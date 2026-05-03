/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Interval set interface. @module */

import { Interval } from './interval.ts';
import { RepArrayIntervalSet } from './intervalset-impls.ts';

/**
 * A mutable set of labeled intervals, where each unique label is associated with a non-overlapping
 * half-open interval [start,end).
 * 
 * For example, { "A"=[0,10), "B"=[20,30) } is an interval set where the labels are strings "A" and
 * "B". We could add "C"=[10,20) to such a set, but not "D"=[25,35) since that interval overlaps with
 * "B"=[20,30).
 * 
 * Labels are of arbitrary type `Label` and are compared for equality using ===. They may not be null,
 * undefined, or NaN.
 * 
 * PS2 instructions: this is a required ADT interface.
 * You may not change the specifications or add new methods.
 * 
 * @template Label type of labels in this set, compared for equality using ===
 */
export interface IntervalSet<Label> {

    /**
     * Add a labeled interval (if not present) to this set, if it does not conflict with existing
     * intervals.
     * 
     * Labeled intervals *conflict* if:
     * - they have the same label with different intervals; or
     * - they have different labels with overlapping intervals.
     * 
     * For example, if this set is { "A"=[0,10), "B"=[20,30) },
     * - add("A"=[0,10)) has no effect
     * - add("B"=[10,20)) throws IntervalConflictError
     * - add("C"=[20,30)) throws IntervalConflictError
     * - add("D"=[30,40)) adds "D"=[30,40)
     * 
     * @param start low end of the interval, inclusive
     * @param end high end of the interval, exclusive, must be greater than start
     * @param label label to add
     * @throws an {@link IntervalConflictError} if label is already in this set and its interval is
     *   not [start,end), or if an interval in this set with a different label overlaps [start,end)
     */
    add(start: bigint, end: bigint, label: Label): void;

    /**
     * Get the labels in this set.
     * 
     * @returns the labels in this set
     */
    labels(): Set<Label>;

    /**
     * Get the interval associated with a label in this set, if any.
     * 
     * @param label the label
     * @returns the interval associated with label in this set, or undefined if none
     */
    interval(label: Label): Interval | undefined;
}

/**
 * Create an empty interval set.
 * 
 * @template Label type of labels in the set
 * @returns a new empty interval set
 */
export function makeIntervalSet<Label>(): IntervalSet<Label> {
    return new RepArrayIntervalSet<Label>();
}

/**
 * Thrown to indicate an interval set conflict.
 * 
 * PS2 instructions: do not change this class.
 */
export class IntervalConflictError extends Error {
}
