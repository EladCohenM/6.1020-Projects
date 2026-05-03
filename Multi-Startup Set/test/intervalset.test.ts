/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Interval } from '../src/interval.ts';
import { IntervalSet, IntervalConflictError } from '../src/intervalset.ts';
import { implementationsForTesting } from '../src/intervalset-impls.ts';
import * as utils from '../src/utils.ts';

// Do not use makeIntervalSet here, because it will only return one particular implementation.
const makeIntervalSet = undefined;
// Do not refer to specific concrete implementations.
const RepMapIntervalSet = undefined, RepArrayIntervalSet = undefined;

/*
 * PS2 instructions: tests you write in this file must be runnable against any implementations that
 * follow the spec! Your tests will be run against staff implementations of IntervalSet.
 * 
 * Do NOT strengthen the spec of any of the tested methods.
 * Your tests MUST call `new SomeIntervalSet` to obtain IntervalSet instances, NOT makeIntervalSet.
 * Your tests MUST NOT refer to specific concrete implementations.
 */

implementationsForTesting().forEach(SomeIntervalSet => describe(SomeIntervalSet.name, function() {

    /*
     * Testing strategy for IntervalSet
     * 
     * partition on the label: immutable, mutable
     * add(): 
     *  partition on the input: label exist/not exist and interval same/overlaps/not overlaps/almost overlap
     *  partition on start and end: both negative, both positive, start negative and end positive, start or end is 0
     * labels():
     *  partition on the set: empty, nonempty
     * interval():
     *  partition on label: exist, not exist.
     */


    it('covers add() immutable label exists not overlap, start is 0 end positive', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(0n,10n,"A");
        assert.throws(() => { notEmptySet.add(10n,20n,"A") }, IntervalConflictError, "immutable label already exists")
    });
    
    it('covers add() mutable label exists not overlap, start is 0 end positive', function() {
        const notEmptySet = new SomeIntervalSet<Array<string>>();
        notEmptySet.add(0n,10n,["A"]);
        notEmptySet.add(10n,20n,["A"]);
        assert.strictEqual(notEmptySet.interval(["A"]), undefined, "expected undefined as arrays use reference equality")
    });
    
    it('covers add() label not exists ovelaps, start negative end positive', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(-10n,10n,"A");
        assert.throws(() => { notEmptySet.add(5n,15n,"B") }, IntervalConflictError)
    });
    
    it('covers add() label not exists same interval, both negative', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(-10n,-5n,"A");
        assert.throws(() => { notEmptySet.add(-10n,-5n,"B") }, IntervalConflictError)
    });
    
    it('covers add() label exists same interval, both negative, interval() exists', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(-10n,-5n,"A");
        notEmptySet.add(-10n,-5n,"A");
        assert.deepStrictEqual([notEmptySet.interval("A")?.start, notEmptySet.interval("A")?.end], [-10n,-5n])
    });
    
    it('covers add() not in the set almost overlap, both positive', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(5n,10n,"A");
        notEmptySet.add(10n,20n,"B");
        assert.deepStrictEqual([notEmptySet.interval("B")?.start, notEmptySet.interval("B")?.end], [10n,20n])
    });
    
    it('covers add() not in the set, overlap, both positive', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(5n,10n,"A");
        assert.throws(() => { notEmptySet.add(5n,20n,"B") }, IntervalConflictError)
    });
    
    it('covers add() not in the set, containing existing Interval, both positive', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(10n,20n,"A");
        assert.throws(() => { notEmptySet.add(5n,25n,"B") }, IntervalConflictError)
    });

    it('covers labels() empty set', function() {
        const empty = new SomeIntervalSet<string>();
        assert.deepStrictEqual(empty.labels(), new Set());
    });
    
    it('covers labels() non empty set, start negative end 0', function() {
        const notEmptySet = new SomeIntervalSet<string>();
        notEmptySet.add(-5n,0n,"A");
        notEmptySet.add(10n,20n,"B");
        assert.deepStrictEqual(notEmptySet.labels(), new Set(["A","B"]));
    });
    
    it('covers interval() not exist', function() {
        const empty = new SomeIntervalSet<string>();
        assert.strictEqual(empty.interval("A"), undefined, "expected undefined")
    });

}));
