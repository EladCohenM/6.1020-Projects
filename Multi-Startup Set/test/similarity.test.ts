/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { Interval } from '../src/interval.ts';
import { IntervalSet, IntervalConflictError, makeIntervalSet } from '../src/intervalset.ts';
import { MultiIntervalSet } from '../src/multiintervalset.ts';
import { similarity, SimilarityCalc } from '../src/similarity.ts';
import * as utils from '../src/utils.ts';

/*
 * Tests for the similarity module.
 */

describe('similarity', function() {

    /*
     * Testing strategy for similarity(..)
     * 
     * partition on similarities: 
     *  empty 
     *  same label not similarity = 1
     *  double labelSimilarity
     *  not empty 
     * 
     * partition on the sets: 
     *  both empty 
     *  one is empty 
     *  bot not empty 
     * 
     * partial on overlaping:
     *  includes partial overlapping 
     *  includes exact overlapping 
     * 
     * partition on the output:
     *  similarity = 0 
     *  similarity = 1 
     *  0 < similarity < 1 
     * 
     */

    // constants for all tests
    const setOne = new MultiIntervalSet<string>();
    const setTwo = new MultiIntervalSet<string>();

    it('covers both sets empty', function() {
        const result = similarity([], new MultiIntervalSet<string>(), new MultiIntervalSet<string>());
        assert.strictEqual(result, 0);
    });
    
    it('covers one is empty', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(2n, 4n, "happy"); setOne.add(2n, 4n, "happy");

        const result = similarity([["meh", "happy", 0.5], ["meh", "sad", 0.5]],setOne, setTwo);
        assert.strictEqual(result, 0);
    });

    it('covers both not empty, not empty similarities, partial overlapping', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(1n, 2n, "sad"); setOne.add(2n, 4n, "happy");
        setTwo.add(1n, 2n, "sad"); setTwo.add(2n, 3n, "meh"); setTwo.add(3n, 4n, "happy");

        const result = similarity([["meh", "happy", 0.5], ["meh", "sad", 0.5]],setOne, setTwo);
        assert.strictEqual(result, 0.625);
    });
    
    it('covers both not empty, similarity = 0', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(1n, 2n, "sad"); setOne.add(2n, 4n, "happy");
        setTwo.add(11n, 12n, "sad"); setTwo.add(12n, 13n, "meh"); setTwo.add(13n, 14n, "happy");

        const result = similarity([["meh", "happy", 0.5], ["meh", "sad", 0.5]],setOne, setTwo);
        assert.strictEqual(result, 0);
    });
    
    it('covers empty similarities, exact overlapping, similarity = 1', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(1n, 2n, "sad"); setOne.add(2n, 4n, "happy");
        setTwo.add(0n, 1n, "happy"); setTwo.add(1n, 2n, "sad"); setTwo.add(2n, 4n, "happy");

        const result = similarity([], setOne, setTwo);
        assert.strictEqual(result, 1, "expected similarity = 1");
    });

    it('covers [label1, label1, not 1] labelSimilarity', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); 
        setTwo.add(0n, 1n, "happy");

        const result = similarity([["happy", "happy", 0.5]], setOne, setTwo);
        assert.strictEqual(result, 0.5, "expected similarity = 0.5");
    });
    
    it('covers double labelSimilarity', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); 
        setTwo.add(0n, 1n, "meh");

        const result = similarity([["meh", "happy", 0.5], ["happy", "meh", 0.5]], setOne, setTwo);
        assert.strictEqual(result, 0.5, "expected similarity = 0.5");
    });

});

describe('SimilarityCalc', function() {

    /*
     * Testing strategy for SimilarityCalc ADT
     *
     * partition on the input:
     *  one set is empty, both empty, both not empty
     * 
     * calcSimilarity():
     *  partition on similarities: empty, same label not similarity = 1, double labelSimilarity, not empty 
     *  partition on the sets: both empty, one is empty, bot not empty
     *  partial on overlaping: includes partial overlapping, includes exact overlapping 
     *  partition on the output: similarity = 0, similarity = 1, 0 < similarity < 1
     * 
     */

    // all calcSimilarity tests are being taken care of in the test cases for similarity function above.

    const setOne = new MultiIntervalSet<string>();
    const setTwo = new MultiIntervalSet<string>();

    // INPUT

    it('covers both empty', function() {
        setOne.clear(); setTwo.clear();
        const calc = new SimilarityCalc(setOne, setTwo); 
        assert.strictEqual(calc.toString(),"Set one:  \nSet two: ")
    });
    
    it('covers one empty', function() {
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy");
        const calc = new SimilarityCalc(setOne, setTwo); 
        assert.strictEqual(calc.toString(),"Set one: happy,Interval[0,1) \nSet two: ")
    });
    
    it('covers both not empty', function() {
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy");
        setTwo.add(0n, 1n, "meh");
        const calc = new SimilarityCalc(setOne, setTwo); 
        assert.strictEqual(calc.toString(),"Set one: happy,Interval[0,1) \nSet two: meh,Interval[0,1)")
    });

    // CALCSIMILARITY

    it('covers both sets empty', function() {
        setOne.clear(); setTwo.clear();
        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = calculator.calcSimilarity([]);
        assert.strictEqual(result, 0);
    });
    
    it('covers one is empty', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(2n, 4n, "happy"); setOne.add(2n, 4n, "happy");

        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = similarity([["meh", "happy", 0.5], ["meh", "sad", 0.5]],setOne, setTwo);
        assert.strictEqual(result, 0);
    });

    it('covers both not empty, not empty similarities, partial overlapping', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(1n, 2n, "sad"); setOne.add(2n, 4n, "happy");
        setTwo.add(1n, 2n, "sad"); setTwo.add(2n, 3n, "meh"); setTwo.add(3n, 4n, "happy");

        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = calculator.calcSimilarity([["meh", "happy", 0.5], ["meh", "sad", 0.5]]);
        assert.strictEqual(result, 0.625);
    });
    
    it('covers both not empty, similarity = 0', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(1n, 2n, "sad"); setOne.add(2n, 4n, "happy");
        setTwo.add(11n, 12n, "sad"); setTwo.add(12n, 13n, "meh"); setTwo.add(13n, 14n, "happy");

        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = calculator.calcSimilarity([["meh", "happy", 0.5], ["meh", "sad", 0.5]]);
        assert.strictEqual(result, 0);
    });
    
    it('covers empty similarities, exact overlapping, similarity = 1', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); setOne.add(1n, 2n, "sad"); setOne.add(2n, 4n, "happy");
        setTwo.add(0n, 1n, "happy"); setTwo.add(1n, 2n, "sad"); setTwo.add(2n, 4n, "happy");

        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = calculator.calcSimilarity([]);
        assert.strictEqual(result, 1, "expected similarity = 1");
    });

    it('covers [label1, label1, not 1] labelSimilarity', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); 
        setTwo.add(0n, 1n, "happy");

        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = calculator.calcSimilarity([["happy", "happy", 0.5]]);
        assert.strictEqual(result, 0.5, "expected similarity = 0.5");
    });
    
    it('covers double labelSimilarity', function() {
        // set up for test
        setOne.clear(); setTwo.clear();
        setOne.add(0n, 1n, "happy"); 
        setTwo.add(0n, 1n, "meh");

        const calculator = new SimilarityCalc(setOne, setTwo);
        const result = calculator.calcSimilarity([["meh", "happy", 0.5], ["happy", "meh", 0.5]]);
        assert.strictEqual(result, 0.5, "expected similarity = 0.5");
    });

});
