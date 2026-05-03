/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Functions for working with Bézier curves. @module */

import assert from 'node:assert';
import { lerp } from './lerp.ts';
import * as utils from './utils.ts';

/*
 * PS1 instructions:
 * - You must strengthen, but may NOT weaken, the specifications in this file.
 */

/**
 * A point on the Cartesian plane.
 */
export type Point = { x: number, y: number };

/**
 * TODO: you determine the detailed spec, which must be stronger than what is provided
 * @param controlPoints point for interpolations
 * @param t interpolation parameter
 * @returns a point based on the calculation of Bezier Curve. 
 *      if t < 0 or t > 1 or t = undefined treat as t = 0.
 *      if controlPoints has only one point returns it.
 * @throws Error if and only if controlPoints is empty
 */
export function bezierInterpolate(controlPoints: Array<Point>, t: number|undefined): Point {
    // : PS1 requires you to implement Bézier curve evaluation, so you should refer to
    //       references on Bézier curves, but you must write your own code to compute points;
    //       if you see code on Wikipedia or elsewhere, do NOT use it

    // : a recursive implementation is recommended,
    //       see https://en.wikipedia.org/wiki/Bézier_curve#Recursive_definition
    //       or https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm
    // base case: 1 control point
    // recursive case: n control points
    //  - compute n-1 new control points by taking each adjacent pair of control points and
    //    linearly interpolating between them
    //  - interpolate along the new (n-1)-point curve

    t = (t === undefined || t < 0 || t > 1) ? 0 : t;
    
    // Base cases
    if (controlPoints.length === 0) {
        throw new Error("controlPoints is empty");
    } else if (controlPoints.length === 1) {
        return controlPoints[0];
    }

    // recursive call
    const nextIteration: Array<Point> = [];
    for (let i = 0; i < controlPoints.length-1; i++) {
        nextIteration.push(lerpPoint(controlPoints[i],controlPoints[i+1],t));
    }
    return bezierInterpolate(nextIteration,t);
}

/**
 * Given a Bézier curve and an easing function, produce a sequence of points suitable for animating
 * the eased movement along the curve. See https://en.wikipedia.org/wiki/Bézier_curve for an explanation
 * of Bézier curves. The easing function must satisfy:
 * - easing(0) = 0  and  easing(1) = 1, so that the interpolation goes from P_0 to P_n
 * - easing(t) is always in [0, 1], so that the interpolation stays on the curve
 * 
 * @param controlPoints Bézier curve control points P_0 through P_n, nonempty
 * @param easing function mapping input interpolation parameter ti, 0 <= ti <= 1, to an applied
 *   interpolation parameter, as constrained above
 * @param numberOfPoints number of points on the curve. throws error when undefined. integer bigger than 1 or undefined.
 * @returns an array of points that represent the Bezier Curve.
 *  if t is out the boundaries or undefined it is treated as t = 0.
 *  if controlPoint length is 1 all points in the array are the same point.
 * 
 * TODO: you determine the detailed postcondition, but you may NOT add "throws" cases
 */
export function bezierPath(controlPoints: Array<Point>, easing: (ti: number) => number, numberOfPoints: number|undefined): Array<Point> {
    const defNumPoints = 3;
    numberOfPoints = numberOfPoints ?? defNumPoints;
    let t: number;
    const curvePoints: Array<Point> = [];
    for (let i = 0; i < numberOfPoints; i++) {
        t = easing(i/(numberOfPoints-1));
        curvePoints.push(bezierInterpolate(controlPoints,t));
    }
    return curvePoints;
}

// HELPER FUNCTIONS
/**
 * takes two points and does linear interpolation between them.
 * @param p1 point 1
 * @param p2 point 2
 * @param t linear interpolation between them.
 * @returns a point. the linear interpolation between two points.
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point { //exporting to test
    t = (t < 0 || t > 1) ? 0 : t;
    return {
        x: lerp(p1.x, p2.x, t),
        y: lerp(p1.y, p2.y, t)
    };
}