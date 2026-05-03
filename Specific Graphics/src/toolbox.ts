/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Toolbox of functions for constructing simple animations. @module */

import assert from 'node:assert';
import { Polyline, Frame, Animation, framerate, animateToFile } from '../lib/animate.ts';
import { Color, lerpColor, fillGradient, makePalette, interpolate } from './colors.ts';
import { Point, bezierInterpolate, bezierPath } from './curves.ts';
import * as utils from './utils.ts';

/*
 * PS1 instructions: define animation toolbox functions below.
 */

/**
 * @param points array of points to move, nonempty
 * @param vector how to move
 * @returns new poly moved by the vector and has the new color if was given.
 */
export function movePoints(points: Array<Point>, vector: Point): Array<Point> {
    const newPoints = points.map(point => ({x: point.x + vector.x, y: point.y + vector.y}));
    return newPoints;
}


/**
 * convert array of numbers to array of points.
 * @param numbers array of numbers
 * @returns Array of the same numbers as points. values are at x, y = 0.
 */
export function numbersToPoints(numbers: Array<number>): Array<Point> {
    const points: Array<Point> = [];
    for (const num of numbers) {
        points.push({ x: num, y: 0});
    }
    return points;
}



/*
 * PS1 instructions: everything above is entirely up to you.
 * Implement the functions below to reproduce the animations in the problem set handout, using
 * your functions above. A useful toolbox should keep these implementations short!
 * Do NOT change the names or signatures of these functions.
 */

/**
 * Generate and save example #1 "alley-oop" from the handout to "example1.html".
 */
export function handoutExampleOne(): void {
    // ESLint will complain about magic numbers in the following declarations, but you may ignore
    // those warnings. For example, naming the individual red/green/blue components of the staff's
    // arbitrarily-chosen colors does not make the code easier to understand.
    
    // constants
    const framesPerSec = 24;
    const durationSec = 1;
    const framerate = 1/framesPerSec;
    const numOfFrames = durationSec/framerate;
    const numOfPointsCircle = 200;

    const circleShape = [
        [ { x: 10, y: 10 }, { x: 10, y: 17 }, { x: 20, y: 17 }, { x: 20, y: 10 } ],
        // [ { x: 10, y: 10 }, { x: 10, y: 3 }, { x: 20, y: 3 }, { x: 20, y: 10 } ],
        [ { x: 20, y: 10 }, { x: 20, y: 3 }, { x: 10, y: 3 }, { x: 10, y: 10 } ],
    ];
    const upDown = [ { x: 0, y: 0 }, { x: 40, y: 110 }, { x: 80, y: 0 } ];
    const cubicInOut = (t: number): number => 4 * (t - .5)**3 + .5;
    const gray: Color = [ 128, 128, 128 ];
    const greenYellow: Color = [ 173, 255, 47 ];

    // create the circle
    let pointsOfCircle: Array<Point> = [];
    for (const controlPoints of circleShape) {
        pointsOfCircle = pointsOfCircle.concat(bezierPath(controlPoints,t => t,numOfPointsCircle));
    }
    
    // calculate colors
    const colors = new Map <number, Color>([[0,gray],[numOfFrames-1,greenYellow]]);
    fillGradient(colors);

    // movement points
    const movementPoints = bezierPath(upDown,cubicInOut, numOfFrames);

    // create numOfFrames frames, each frame holds only one poly (the ball)
    const circleAnimation: Animation = [];
    for (let i = 0; i < numOfFrames; i++) {
        // adding frames to circleAnimation
        const poly: Polyline = {
            color: colors.get(i) ?? assert.fail("color undefined"),
            points: movePoints(pointsOfCircle,movementPoints[i])
        };
        circleAnimation.push([poly]);
    };

    // send number of frames to animate
    animateToFile(circleAnimation, 'example1.html');
}

/**
 * Generate and save example #2 "rainbow connection" from the handout to "example2.html".
 */
export function handoutExampleTwo(): void {
    // ESLint will complain about magic numbers in the following declarations, but you may ignore
    // those warnings. For example, naming the individual control points in the staff's
    // arbitrarily-chosen easing function does not make the code easier to understand.
    
    // constants
    const framesPerSec = 24;
    const durationSec = 2;
    const framerate = 1/framesPerSec;
    const numOfFrames = durationSec/framerate;
    const numOfPoly = 40;

    const heartShape = [
        [ { x: 50, y: 25 }, { x: 34, y: 42 }, { x: 2, y: 36 }, { x: 0, y: 0 }, { x: 50, y: -40 } ],
        [ { x: 50, y: -40 }, { x: 100, y: 0 }, { x: 98, y: 36 }, { x: 66, y: 42 }, { x: 50, y: 25 } ],
    ];
    const easeInOutIn = [ .25, 1, -1, 1, 1, 1, 1 ];
    const turquoise: Color = [ 39, 229, 220 ];

    // creating the palette
    const colorPalette = makePalette(turquoise,numOfPoly);

    // drawing the two lines
    const firstLine = bezierPath(heartShape[0],t => t, numOfPoly+1);
    const secondLine = bezierPath(heartShape[1],t => t, numOfPoly+1);
    
    // create the colorful heart; base shape
    const frame: Frame = [];
    for (let i = 0; i < colorPalette.length; i++) {
        frame.push({ color: colorPalette[i], points: firstLine.slice(i,i+2) });
        frame.push({ color: colorPalette[i], points: secondLine.slice(i,i+2) });
    }

    // get easing
    let newEasing = numbersToPoints(easeInOutIn);
    newEasing = bezierPath(newEasing ,t => t, numOfFrames);

    // create animation
    const animation: Animation = [];
    for (const point of newEasing) {
        const numShowing = Math.round(point.x*numOfPoly)*2;
        animation.push(frame.slice(0,numShowing));
    }    

    animateToFile(animation, 'example2.html');
}
