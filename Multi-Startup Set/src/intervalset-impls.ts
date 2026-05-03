/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Interval set implementations. @module */

import assert from 'node:assert';
import { Interval } from './interval.ts';
import { IntervalSet, IntervalConflictError } from './intervalset.ts';
import * as utils from './utils.ts';

/**
 * An implementation of IntervalSet.
 * 
 * PS2 instructions: you must use the provided rep. You may not change the spec of the constructor.
 */
export class RepMapIntervalSet<Label> implements IntervalSet<Label> {

    private readonly startMap: Map<Label, bigint> = new Map();
    private readonly endMap: Map<bigint, bigint> = new Map();

    // Abstraction function:
    //  AF(startMap, endMap) = the set of intervals with label L [startMap[l], endMap[startMap[L]]) for all L in startMap keys.
    
    // Representation invariant:
    //  all values in startMap must be distinct
    //  every value in startMap has to be a key in endMap
    //  a key in endMap can't be bigger than a key and smaller than its matching value in endMap 

    // Safety from rep exposure:
    //  all fields are private
    //  interval() returns a new interval
    //  labels() returns map keys in a new array that doesn't affect the map itself

    /**
     * Create an empty interval set.
     */
    public constructor() {
    }

    // assert the rep invarient
    private checkRep(): void {
        
        //  all values in startMap must be distinct
        assert([...this.startMap.values()].length === new Set([...this.startMap.values()]).size, "not all startMap are unique");
        
        //  every value in startMap has to be a key in endMap
        assert.deepStrictEqual(new Set([...this.startMap.values()]),new Set([...this.endMap.keys()]), 
            "no matching between startMap values and endMap keys");
        
        //  a key in endMap can't be bigger than a key and smaller than its matching value in endMap 
        const checkArray: Array<[bigint, bigint]> = Array.from(this.endMap);
        for (let i = 0; i < checkArray.length; i++) {
            const [firstStart, firstEnd]: [bigint, bigint] = checkArray[i] ?? assert.fail("key is undefined");
            for (let j = i+1; j < checkArray.length; j++) {
                const [secondStart, secondEnd]: [bigint, bigint] = checkArray[j] ?? assert.fail("inner is undefined");
                
                if (firstStart < secondEnd && secondStart < firstEnd) {
                    throw new IntervalConflictError("intervals overlap");
                }
            }
        }
    }

    /**
     * @inheritdoc
     */
    public add(start: bigint, end: bigint, label: Label): void {
        // check that the key doesn't already exist
        if (this.startMap.has(label)) {
            if ( // throw error only if it's not the same interval
                this.startMap.get(label) !== start ||
                this.endMap.get(this.startMap.get(label) ?? assert.fail("startMap.get(label) undefined")) !== end
            ) {
                throw new IntervalConflictError("label already exists, not matching interval");
            }
        } else {
            // check that both the new start and the new end don't fall within an existing interval
            for (const [curentSetStart, curentSetEnd] of this.endMap.entries()) {
                if (start < curentSetEnd && curentSetStart < end) { 
                    throw new IntervalConflictError("new interval conflicts with existing during add");
                }
            }
        }

        // if no error we can add
        this.startMap.set(label, start);
        this.endMap.set(start,end);

        // double check that everything is still good
        this.checkRep();
    }

    /**
     * @inheritdoc
     */
    public labels(): Set<Label> {
        this.checkRep();
        return new Set([...this.startMap.keys()]);
    }

    /**
     * @inheritdoc
     */
    public interval(label: Label): Interval | undefined {
        this.checkRep();
        const start = this.startMap.get(label);
        if (start === undefined) {
            return undefined;
        }
        const end = this.endMap.get(start) ?? 0n;
        return new Interval(start, end);
    }

    public toString(): string {
        this.checkRep();
        let outputString = "{";
        for (const [label,start] of this.startMap.entries()) {
            const end = this.endMap.get(start);
            outputString = outputString.concat(`${label}: [${start},${end}), `);
        }
        outputString = outputString.concat("}");
        return outputString;
    }
}

/**
 * An implementation of IntervalSet.
 * 
 * PS2 instructions: you must use the provided rep. You may not change the spec of the constructor.
 */
export class RepArrayIntervalSet<Label> implements IntervalSet<Label> {

    // labelList contain all labels, valueList contain both start and end one after another
    private readonly labelList: Array<Label> = [];
    private readonly valueList: Array<bigint> = [];

    // Abstraction function:
    //   AF(labelList, valueList) = the set of intervals with label L [valueList[2*labelList.indexOf(L)], valueList[2*labelList.indexOf(L)+1]) for all L in labelList.
    // Representation invariant:
    //   all values in labelList must be distinct
    //   every label index must have start and end values in valueList
    //   valueList should be double the size of labelList
    //   no overlaps: there do not exist indices i < j such that j < value[i]
    // Safety from rep exposure:
    //   all fields are private
    //   interval() return a new interval
    //   labels() returns a new set of the labels

    /**
     * Create an empty interval set.
     */
    public constructor() {
    }

    // assert the rep invarient
    private checkRep(): void {
        
        // all labels must be distinct
        assert(this.labelList.length === new Set(this.labelList).size, "labels are not distinct");
        
        // every label index must have start and end values in valueList
        this.labelList.forEach((_, index) => {
            assert(this.valueList[2*index] !== undefined, "label's index has no matching start in valueList");
            assert(this.valueList[2*index + 1] !== undefined, "label's index has no matching end in valueList");
        });

        // valueList should be double the size of labelList
        assert.strictEqual(2*this.labelList.length, this.valueList.length, "labelList and valueList don't have the same size");

        // no overlaps: there do not exist indices i < j such that j < value[i]
        for (let i = 0; i < this.valueList.length; i += 2) {
            const curStart = this.valueList[i] ?? 0n; 
            const curEnd = this.valueList[i+1] ?? 0n;
            for (let j = i+2; j < this.valueList.length; j += 2) {
                const checkStart = this.valueList[j] ?? 0n;
                const checkEnd = this.valueList[j+1] ?? 0n;
                
                if (curStart < checkEnd && checkStart < curEnd) {
                    throw new IntervalConflictError("conflicting intervals exist");
                }
            }
        }

    }

    /**
     * @inheritdoc
     */
    public add(start: bigint, end: bigint, label: Label): void {
        // check that the key doesn't already exist
        if (this.labelList.includes(label)) {
            // check if interval is not matching
            const existingStart = this.valueList[2*this.labelList.indexOf(label)];
            const existingEnd = this.valueList[2*this.labelList.indexOf(label) + 1];
            if (start !== existingStart || end !== existingEnd) {
                throw new IntervalConflictError("label already exist, interval not the same");
            } else {
                return; // don't want to add the interval again to the arrays
            }

        } else {
            // check that both the new start and the new end don't fall within an existing interval
            for (let i = 0; i < this.valueList.length; i += 2) {
                const curStart = this.valueList[i] ?? assert.fail("curStart undefined"); 
                const curEnd = this.valueList[i+1] ?? assert.fail("curStart undefined");
                
                if (start < curEnd && curStart < end) {
                    throw new IntervalConflictError("conflicting intervals exist during add");
                }
            }
        }

        // if all good add new interval
        this.labelList.push(label);
        this.valueList.push(start); // not sparse so no need to worry
        this.valueList.push(end);
        
        this.checkRep();
    }

    /**
     * @inheritdoc
     */
    public labels(): Set<Label> {
        this.checkRep();
        return new Set(this.labelList);
    }

    /**
     * @inheritdoc
     */
    public interval(label: Label): Interval | undefined {
        this.checkRep();
        const startIndex = 2*this.labelList.indexOf(label);
        if (this.valueList[startIndex] === undefined) {
            return undefined;
        }
        const start: bigint  = this.valueList[startIndex] ?? 0n;
        const end: bigint = this.valueList[startIndex + 1] ?? 1n;
        return new Interval(start, end); 
    }

    public toString(): string {
        this.checkRep();
        let outputString = "{";
        this.labelList.forEach((label, index) => {
            const start = this.valueList[index*2];
            const end = this.valueList[index*2+1];
            outputString = outputString.concat(`${label}: [${start},${end}), `);
        });
        outputString = outputString.concat("}");
        return outputString; 
    }
}

/**
 * PS2 instructions: both implementations are exported for testing purposes only.
 * @returns IntervalSet implementations to test
 */
export function implementationsForTesting(): Array<IntervalSetCtor> {
    return [ RepMapIntervalSet, RepArrayIntervalSet ];
}

type IntervalSetCtor = new <L>() => IntervalSet<L>; 
