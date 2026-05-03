/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { MultiIntervalSet } from './multiintervalset.ts';
import { Interval } from './interval.ts';
import { IntervalConflictError } from './intervalset.ts';
import * as utils from './utils.ts';

/** A 3-tuple associating a string pair with a number. */
export type LabelSimilarity = [string, string, number];

/**
 * Measure similarity between multi-interval sets with string labels.
 * 
 * Uses a client-provided definition of label similarities, where 0 is least- and 1 is most-similar.
 * 
 * The similarity between two multi-interval sets, where at least one is nonempty, is the ratio:
 *     (sum of piecewise-matching between the sets) / (span of the sets)
 * where the span is the length of the smallest interval that contains all the intervals from both
 * sets, and the amount of piecewise-matching for any unit interval [i, i+1) is:
 * -    0 if neither set has a label on that interval
 * -    0 if only one set has a label on that interval
 * -    otherwise, the similarity between labels as defined by the client, explained below
 * 
 * Two empty sets have similarity 0.
 * 
 * For example, suppose you have multi-interval sets that use labels "happy", "sad", and "meh"; and
 * similarity between labels is defined as:
 * -    1 if both are "happy", both "sad", or both "meh"
 * -    0.5 if one is meh and the other is "happy" or "sad"
 * -    0 otherwise
 * Then the similarity between these two sets:
 *     { "happy" = [[0, 1), [2,4)], "sad" = [[1,2)] }
 *     { "sad" = [[1, 2)], "meh" = [[2,3)], "happy" = [[3,4)] }
 * ... would be: (0 + 1 + 0.5 + 1) / (4 - 0) = 0.625
 * 
 * Label similarities are provided as an array of tuples, where the first two elements give a pair of
 * labels, and the third element gives the similarity between them, between 0 and 1 inclusive.
 * Similarity between labels is symmetric, so the order of labels in each tuple is irrelevant, and a
 * pair of labels may not appear more than once. The similarity between all other pairs of labels is:
 * -    1 iff they are the same string, and
 * -    0 otherwise
 * 
 * For example, the following gives the similarity values used above:
 *     [ ["happy","meh",0.5], ["meh","sad",0.5] ]
 * 
 * When the individual piecewise-matching terms, the sum of piecewise-matching between the sets, and
 * the span of the sets can be represented as number values with high precision, the returned value
 * will have similar precision. Otherwise, it may be similarly imprecise.
 * 
 * PS2 instructions: this is a required function.
 * You may strengthen its specification, but may NOT weaken it.
 * 
 * @param similarities label similarity definition as described above
 * @param setA multi-interval set with string labels
 * @param setB multi-interval set with string labels
 * @returns similarity between setA and setB as defined above
 */
export function similarity(similarities: Array<LabelSimilarity>, setA: MultiIntervalSet<string>, setB: MultiIntervalSet<string>): number {
    const calculator = new SimilarityCalc(setA,setB);
    return calculator.calcSimilarity(similarities);
}

/**
 * An immutable version of MultiIntervalSet with different methods.
 */
export class SimilarityCalc {

    private readonly setOne: Array<[string, Interval]> = [];    
    private readonly setTwo: Array<[string, Interval]> = [];
    private readonly span: Interval|undefined;    

    // Abstraction function:
    //  AF(setOne, setTwo) = a data package that contains two MultiIntervalSets and allows computing their similarities.
    // Representation invariant:
    //  no two intervals in the same set can overlap
    // Safety from rep exposure:
    //  all fields are private
    //  similarity() returns new number representing similarity between the interval sets
    
    public constructor(initialOne: MultiIntervalSet<string>, initialTwo:MultiIntervalSet<string>) {
        this.convertMulti(initialOne, this.setOne);
        this.convertMulti(initialTwo, this.setTwo);
        this.span = this.findSpan(this.setOne, this.setTwo);
        this.checkRep();
    }

    private checkRep(): void {
        //  no two intervals in the same set can overlap
        this.checkOverlap(this.setOne);
        this.checkOverlap(this.setTwo);
    }

    public calcSimilarity(similarities: Array<LabelSimilarity>): number {
        this.checkRep();

        if (this.span === undefined) {
            return 0;
        }

        // variables for calculation
        const spanDenom = Number(this.span.end - this.span.start);
        let numerator = 0;

        // similarity is 0 if one set is empty
        if (this.setOne.length === 0 || this.setTwo.length === 0) {
            return 0;
        }

        // go over all intervals of both and check similarity
        for (const [outerLabel, outerInterval] of this.setOne) {
            for (const [innerLabel, innerInterval] of this.setTwo) {
                const overlap = Number(this.calcOverlap(outerInterval, innerInterval));
                if (overlap > 0) {
                    const multiplier: number = this.findMultiplier(outerLabel, innerLabel, similarities);
                    numerator += overlap*multiplier;
                }
            }
        }

        return numerator/spanDenom;
    }

    public toString(): string {
        this.checkRep();
        return(
            `Set one: ${this.setOne.toString()} \nSet two: ${this.setTwo.toString()}`
        );
    }


    // HELPER FUNCTIONS

    // HELPERS FOR CONSTRUCTOR

    /**
     * a helper function to convert the MultiInervalSets to flat array of intervals. 
     * @param multi MultiIntervalSet to convert, all labels must contain at least one interval
     * @param arrayToMutate the array that will represent the intervalset after the conversion
     */
    private convertMulti(multi: MultiIntervalSet<string>, arrayToMutate: Array<[string, Interval]>): void {
        // go over all of the labels of multi and add each interval to convertedSet
        const labels: Set<string> = multi.labels();
        for (const label of labels) {
            const interevalSet = multi.intervals(label);
            const indices = interevalSet.labels();
            for (const index of indices) {
                const intereval: Interval = interevalSet.interval(index) ?? new Interval(0n, 1n);
                arrayToMutate.push([label,intereval]);
            }
        }        
    }
    
    /**
     * a helper function to get the span of one multisetinterval. 
     * @param set flatten multiintervalset
     * @returns an interval that represents the span of this multi interval set or undefined if it's empty.
     */
    private findMinMax(set: Array<[string,Interval]>): Interval|undefined {

        // deal with empty interval set
        if (set.length === 0) {
            return undefined;
        }
        
        const ten = 10n; // to deal with magic numbers
        const negTen = -10n; // to deal with magic numbers
        const power = 301n;
        const bigPositiveNumber = ten**power;
        const bigNegativeNumber = negTen**power;
        
        let min: bigint = bigPositiveNumber; 
        let max: bigint = bigNegativeNumber; 
        for (const [_, intereval] of set) {
            min = intereval.start < min ? intereval.start : min; // change to interval.start if it's smaller
            max = intereval.end > max ? intereval.end : max; // change to interval.end if it's bigger
        }
        return new Interval(min, max);
    }

    /**
     * a helper function that takes two interval sets and returns a new interval that represents their combined span.
     * @param firstSet flatten multi interval set
     * @param secondSet flatten multi interval set
     * @returns an interval of the combined span or undefined if they are both empty
     */
    private findSpan(firstSet: Array<[string,Interval]>, secondSet: Array<[string,Interval]>): Interval|undefined {
        
        // deal with emptiness
        if (firstSet.length === 0 && secondSet.length === 0) {
            return undefined;
        } else if (firstSet.length > 0 && secondSet.length === 0) {
            return this.findMinMax(firstSet);
        } else if (firstSet.length === 0 && secondSet.length > 0) {
            return this.findMinMax(secondSet);
        } else {
            const spanOneStart = this.findMinMax(firstSet)?.start ?? 0n;
            const spanOneEnd = this.findMinMax(firstSet)?.end ?? 1n;
            const spanTwoStart = this.findMinMax(secondSet)?.start ?? 0n;
            const spanTwoEnd = this.findMinMax(secondSet)?.end ?? 1n;

            return new Interval(
                this.bigintMin(spanOneStart, spanTwoStart),
                this.bigintMax(spanOneEnd, spanTwoEnd)
            );
        }
    }

    // HELPER FOR CHECKREP

    // true if there is overlap false if there isn't
    private checkOverlap(set: Array<[string, Interval]>): void {
        for (let i = 0; i < set.length; i++) {
            const outerInterval = set[i]?.[1];
            for (let j = i+1; j < set.length; j++) {
                const innerInterval = set[j]?.[1];
                // deal with static errors
                assert((outerInterval !== undefined) && (innerInterval !== undefined), "outer interval is undefined");
                if ( outerInterval.start < innerInterval.end && innerInterval.start < outerInterval.end ) {
                    throw new IntervalConflictError("there exist an interval conflict");
                }
            }
        }
    }


    // HELPERS FOR CALC METHOD

    /**
     * helper function that takes two intervals and calculates the overlap between them
     * @param firstInterval first interval to find overlap
     * @param secondInterval second interval to find overlap
     * @returns a bigint value of the total overlap between the intervals
     */
    private calcOverlap(firstInterval: Interval, secondInterval: Interval): bigint {
        return( this.bigintMax(
            0n, this.bigintMin(firstInterval.end, secondInterval.end) - this.bigintMax(firstInterval.start, secondInterval.start)
            ) 
        );
    }

    /**
     * takes two labels and an array of label similarities and returns the similarity value between the two labels
     * @param firstLabel first label 
     * @param secondLabel second label 
     * @param similarities array of label similarities
     * @returns the similarity multiplier between the two labels if exists else 0
     */
    private findMultiplier(firstLabel:string, secondLabel: string, similarities:Array<LabelSimilarity>): number {
        for (const labelSimilarity of similarities) {
            const labelA: string = labelSimilarity[0]; 
            const labelB: string = labelSimilarity[1];
            if (
                (firstLabel === labelA && secondLabel === labelB) ||
                (firstLabel === labelB && secondLabel === labelA)
            ) {
                return labelSimilarity[2];
            }
        } 
        // if couldn't find similarity
        if (firstLabel === secondLabel) {
            return 1;
        } else {
            return 0;
        }
    }

    /**
     * finds the minimum between two bigints
     * @param bigint1 first bigint to compare
     * @param bigint2 second bigint to compare
     * @returns the smaller of them
     */
    private bigintMin(bigint1: bigint, bigint2: bigint): bigint {
        return bigint1 < bigint2 ? bigint1 : bigint2;
    }

    /**
     * finds the maximum between two bigints
     * @param bigint1 first bigint to compare
     * @param bigint2 second bigint to compare
     * @returns the bigger of them
     */
    private bigintMax(bigint1: bigint, bigint2: bigint): bigint {
        return bigint1 > bigint2 ? bigint1 : bigint2;
    }

}
