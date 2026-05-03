/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Interval } from './interval.ts';
import { IntervalSet, IntervalConflictError, makeIntervalSet } from './intervalset.ts';
import * as utils from './utils.ts';

/**
 * A mutable set of labeled intervals, where each label is associated with one or more non-overlapping
 * half-open intervals [start, end). Neither intervals with the same label nor with different labels
 * may overlap.
 * 
 * For example, { "A"=[[0,10)], "B"=[[20,30)] } is a multi-interval set where the labels are strings
 * "A" and "B". We could add "A"=[10,20) to that set to obtain { "A"=[[0,10),[10,20)], "B"=[[20,30)] }.
 * 
 * Labels are of arbitrary type `Label` and are compared for equality using ===. They may not be null,
 * undefined, or NaN.
 * 
 * PS2 instructions: this is a required ADT.
 * You may not change the specifications or add new methods.
 * 
 * @template Label type of labels in this set, compared for equality using ===
 */
export class MultiIntervalSet<Label> {

    private readonly intervalSetMap: Map<Label, IntervalSet<number>> = new Map();
    private readonly allIntervalsArr: Array<Interval> = [];

    // Abstraction function:
    //  AF(intervalSetMap) = a map of all labels and their interval sets. for each key(label) L, the value is an intervalSet with keys as indices.
    // Representation invariant:
    //  all labels must have a non-empty interval set.
    //  all intervals across all interval sets must appear also in allIntervalsArr
    //  no two intervals in allIntervalsArr can overlap
    // Safety from rep exposure:
    //  all fields are private
    //  clear mutate as it should but doesn't return the representation
    //  labels() return new set
    //  intervals() return new interevalSet

    /**
     * Create a new multi-interval set containing the given labeled intervals; or empty if none
     * 
     * @param initial optional initial contents of the new multi-interval set
     */
    public constructor(initial?: IntervalSet<Label>) {
        if (initial !== undefined) {
            for (const label of initial.labels()) {
                // add all of the intervals with their labels to intervalSetMap
                const interval = initial.interval(label) ?? new Interval(0n, 1n);
                const newIntervalSet: IntervalSet<number> = makeIntervalSet();
                const start = interval?.start ?? 0n; // deal with static errors
                const end = interval?.end ?? 1n; // deal with static errors
                newIntervalSet.add(start, end, 0);
                this.intervalSetMap.set(label, newIntervalSet);
                
                // also add to allIntervalsArr
                this.allIntervalsArr.push(interval);
            }
        }
    }

    // assert the rep invariant
    private checkRep(): void {
        
        // all labels must have a non-empty interval set.
        for (const intervalset of this.intervalSetMap.values()) {
            assert(intervalset.labels().size > 0, "there is an empty intervalSet");
        }
        
        // all intervals across all interval sets must appear also in allIntervalsArr
        let intervalsCounter = 0;
        for (const interevalSet of this.intervalSetMap.values()) {
            intervalsCounter += interevalSet.labels().size;
        }
        assert.strictEqual(this.allIntervalsArr.length, intervalsCounter, "different amount of intervals in map and intervals list");

        // no two intervals in allIntervalsArr can overlap
        for (let i = 0; i < this.allIntervalsArr.length; i++) {
            const firstInterval = this.allIntervalsArr[i] ?? assert.fail("Interval undefined");
            const [firstStart, firstEnd]: [bigint, bigint] = [firstInterval.start, firstInterval.end];
            for(let j = i + 1; j < this.allIntervalsArr.length; j++) {
                const secondInterval = this.allIntervalsArr[j] ?? assert.fail("Interval undefined");
                const [secondStart, secondEnd]: [bigint, bigint] = [secondInterval.start, secondInterval.end];

                if (firstStart < secondEnd && secondStart < firstEnd) {
                    throw new IntervalConflictError("conflicting intervals exist");
                }
            }
        }
    }

    /**
     * Add a labeled interval to this set, if it is not already present and it does not conflict with
     * existing intervals.
     * 
     * Labeled intervals *conflict* if:
     * - they have the same label with different, overlapping intervals; or
     * - they have different labels with overlapping intervals.
     * 
     * For example, if this set is { "A"=[[0,10),[20,30)] },
     * - add("A"=[0,10)) has no effect
     * - add("B"=[10,20)) adds "B"=[[10,20)]
     * - add("C"=[20,30)) throws IntervalConflictError
     * 
     * @param start low end of the interval, inclusive
     * @param end high end of the interval, exclusive, must be greater than start
     * @param label label to add
     * @throws an {@link IntervalConflictError} if label is already in this set and is associated with
     *   an interval other than [start,end) that overlaps [start,end), or if an interval in this set
     *   with a different label overlaps [start,end)
     */
    public add(start: bigint, end: bigint, label: Label): void {

        // deal with existing label
        if (this.intervalSetMap.has(label)) {
            const curSet: IntervalSet<number> = this.intervalSetMap.get(label) ?? assert.fail("expected to get interval");
            const allLabels: Set<number> = curSet.labels() ?? assert.fail("expected to get all labels");
            for (const existingLabel of allLabels) {
                const interval = curSet.interval(existingLabel);
                const intervalStart: bigint = interval?.start ?? 0n; // deal with static error
                const intervalEnd: bigint = interval?.end ?? 0n;
                // check if inteval exists
                if (interval?.start === start && interval.end === end) {   
                    this.checkRep(); 
                    return;     // no need to add the interval already exists
                // check if overlaps
                } else if (start < intervalEnd && intervalStart < end) {
                    throw new IntervalConflictError("trying to add conflicting interval during add");
                }                    
            }
            
            // if has label but not same interval add to curSet
            const newLabel: number = Math.max(...allLabels) + 1;
            curSet.add(start, end, newLabel);
            this.allIntervalsArr.push(new Interval(start, end)); // update all interval too
            this.checkRep();
            return; // stop processing the rest
        }

        // check if there is an overlap
        for (const interval of this.allIntervalsArr) {
            if (start < interval.end && interval.start < end) {
                throw new IntervalConflictError("trying to add conflicting interval during add");
            }
        }

        // if no label we add a new one
        const setToAdd: IntervalSet<number> = makeIntervalSet<number>();
        setToAdd.add(start, end, 0);
        this.intervalSetMap.set(label,setToAdd);
        this.allIntervalsArr.push(new Interval(start, end)); // update all interval too
        
        this.checkRep();
    }

    /**
     * Remove all intervals from this set.
     * 
     * @returns true if this set was non-empty, and false otherwise
     */
    public clear(): boolean {
        this.checkRep();

        if (this.intervalSetMap.size === 0 && this.allIntervalsArr.length === 0) {
            return false;
        } else if (this.intervalSetMap.size > 0 && this.allIntervalsArr.length > 0) {
            this.intervalSetMap.clear();
            this.allIntervalsArr.length = 0;
            return true;
        }
        // if the code reached here there's a problem
        throw new IntervalConflictError("map and array have different lengths");
    }

    /**
     * Get the labels in this set.
     * 
     * @returns the labels in this set
     */
    public labels(): Set<Label> {
        this.checkRep();
        return new Set(this.intervalSetMap.keys());
    }

    /**
     * Get all the intervals in this set associated with a given label, if any. The returned set has
     * integer labels that act as indices: label 0 is associated with the lowest interval, 1 the next,
     * and so on, for all the intervals in this set that have the provided label.
     * 
     * For example, if this set is { "A"=[[0,10),[20,30)], "B"=[[10,20)] },
     * - intervals("A") returns { 0=[0,10), 1=[20,30) }
     * 
     * @param label the label
     * @returns a new interval set that associates integer indices with the in-order intervals of
     *          label in this set
     */
    public intervals(label: Label): IntervalSet<number> {
        this.checkRep();
        
        // if label doesn't exist
        if (!this.intervalSetMap.has(label)) {
            return makeIntervalSet<number>();
        }
        
        // variables for calculations
        const curSet: IntervalSet<number> = this.intervalSetMap.get(label) ?? makeIntervalSet<number>();
        const allLabels: Set<number> = curSet.labels();
        const ten = 10n; // to deal with magic numbers
        const power = 300n;
        const bigNumber = ten**power;
        let intervalCounter = 0;
        const orderedIntervals: IntervalSet<number> = makeIntervalSet<number>();
        
        // loop to sort the intervals
        while (allLabels.size > 0) {
            let firstInterval: Interval = new Interval(bigNumber, 2n*bigNumber);
            let firstIndex = -1; 
            for (const index of allLabels) {
                const interval = curSet.interval(index) ?? new Interval(bigNumber, 2n*bigNumber);
                // if starts before replace
                if (interval?.start < firstInterval.start) {
                    firstInterval = interval;
                    firstIndex = index;
                }
            }

            allLabels.delete(firstIndex); // remove the index of the smallest to end the loop
            orderedIntervals.add(firstInterval.start, firstInterval.end, intervalCounter);
            intervalCounter++; // to add the next interval in the correct place
        }

        // ordered intervals is ready
        return orderedIntervals;
    }

    public toString(): string {
        let outputString = "MultiIntervalSet\n{\n";
        for (const [label, intervalset] of this.intervalSetMap.entries()) {
            outputString = outputString.concat(`  ${label}: ${intervalset.toString()} \n`);
        }
        outputString = outputString.concat('}');
        return outputString;
    }

}
