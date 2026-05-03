/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Interval } from '../src/interval.ts';
import { IntervalSet, IntervalConflictError, makeIntervalSet } from '../src/intervalset.ts';
import { MultiIntervalSet } from '../src/multiintervalset.ts';
import * as utils from '../src/utils.ts';

/*
 * PS2 instructions: tests you write in this file must be runnable against any implementations that
 * follow the spec! Your tests will be run against staff implementations of MultiIntervalSet.
 * 
 * Do NOT strengthen the spec of any of the tested methods.
 */

describe('MultiIntervalSet', function() {

    /*
     * Testing strategy for MultiIntervalSet
     * covering all subdomains at lest once, not cartesian product of all partitions
     * 
     * partition on the input: with initial, withtout initial
     * partition on the label: immutable, mutable
     * add():
     *  partition on the input: label exist / doesn't exist V, interval same/overlap/not overlaps/touching (e.g [0,10][10,20])
     *  partition on start and end: both negative, both positive, start negtive end positive
     * labels():
     *  partition on set: empty/not empty, multiple intervals per label / one interval per label
     * clear():
     *  partition on set: empty/not empty
     * intervals():
     *  partition on label: multiple per one/one per one/not existing
     * 
     */

    it("covers with initial, immutable, add() label doesn't exist, intervals touching, intervals() one per one, positive", function() {
        const initial = makeIntervalSet<string>();
        initial.add(0n, 10n, "A");
        const notEmpty = new MultiIntervalSet<string>(initial);
        notEmpty.add(10n, 20n, "B");
        const actual = [notEmpty.intervals("B")?.interval(0)?.start, notEmpty.intervals("B")?.interval(0)?.end];
        assert.deepStrictEqual(actual, [10n, 20n], "expected to add B")
    });
    
    it("covers no initial, immutable, add() label doesn't exist, interval overlaps, negative and positive", function() {
        const notEmpty = new MultiIntervalSet<string>();
        notEmpty.add(-5n, 10n, "A");
        assert.throws(() => {notEmpty.add(5n, 20n, "B")}, IntervalConflictError, "adding conflicting interval was successful");
    });
    
    it("covers no initial, immutable, add() label doesn't exist, same interval", function() {
        const notEmpty = new MultiIntervalSet<string>();
        notEmpty.add(-5n, 10n, "A");
        assert.throws(() => {notEmpty.add(-5n, 10n, "B")}, IntervalConflictError, "adding conflicting interval was successful");
    });

    it("covers with initial, immutable, add() label exist, interval not overlaps, intervals() many per one, all negative", function() {
        const initial = makeIntervalSet<string>();
        initial.add(-20n, -10n, "A");
        const notEmpty = new MultiIntervalSet<string>(initial);
        notEmpty.add(-5n, 0n, "A");
        const actual0 = [notEmpty.intervals("A")?.interval(0)?.start, notEmpty.intervals("A")?.interval(0)?.end];
        const actual1 = [notEmpty.intervals("A")?.interval(1)?.start, notEmpty.intervals("A")?.interval(1)?.end];
        assert.deepStrictEqual(actual0, [-20n,-10n], "expected to have two intervals for A")
        assert.deepStrictEqual(actual1, [-5n,0n], "expected to have two intervals for A")
    });
    
    it("covers with initial, immutable, add() label exist, same interval", function() {
        const initial = makeIntervalSet<string>();
        initial.add(-20n, -10n, "A");
        const notEmpty = new MultiIntervalSet<string>(initial);
        notEmpty.add(-20n, -10n, "A");
        const actual = [notEmpty.intervals("A")?.interval(0)?.start, notEmpty.intervals("A")?.interval(0)?.end];
        assert.deepStrictEqual(actual, [-20n,-10n], "expected Interval[-20, 10) for A")
    });

    it("covers with initial, mutable, add() label exist", function() {
        const initial = makeIntervalSet<Array<string>>();
        initial.add(0n, 10n, ["A"]);
        const notEmpty = new MultiIntervalSet<Array<string>>(initial);
        notEmpty.add(10n, 20n, ["A"]);
        assert.strictEqual(notEmpty.intervals(["A"]).labels().size, 0 , "expected empty IntervalSet<number> for mutable label")
    });

    it('covers labels() empty', function() {
        const empty = new MultiIntervalSet<string>();
        assert.deepStrictEqual(empty.labels(), new Set());
    });
    
    it('covers clear() empty', function() {
        const empty = new MultiIntervalSet<string>();
        empty.clear()
        assert.deepStrictEqual(empty.labels(), new Set());
    });
    
    it('covers clear() not empty', function() {
        const notEmpty = new MultiIntervalSet<string>();
        notEmpty.add(-5n, 10n, "A");
        notEmpty.add(10n, 20n, "B");
        notEmpty.clear();
        assert.deepStrictEqual(notEmpty.labels(), new Set());
    });
    
    it('covers intervals() empty', function() {
        const empty = new MultiIntervalSet<string>();
        assert.deepStrictEqual(empty.intervals("A").labels(), new Set());
    });

});
