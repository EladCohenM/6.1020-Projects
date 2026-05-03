/* Copyright (c) 2007-2023 MIT 6.102/6.031/6.005 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import fs from 'node:fs';
import open from 'open';
import { Turtle, DrawableTurtle, LineSegment, PenColor, Point } from './turtle.ts';

const RADIUS_SIDELENGTH_RATIO = Math.sqrt(2);
const FULL_CIRCUMFERENCE = 360;
const HALF_CIRCUMFERENCE: number = FULL_CIRCUMFERENCE/2;
const RIGHT_ANGLE: number = HALF_CIRCUMFERENCE/2;
const SMALL_STEP = 0.2;
const SIDES_FOR_CIRCLE = 100;
const PERSONAL_ART_RADIUS = 150;
const SPIRAL_SIDES = 50;
const SQUARE_SIDES = 4;

/**
 * Draw a square.
 * 
 * @param turtle the turtle context
 * @param sideLength length of each side, must be >= 0
 */
export function drawSquare(turtle: Turtle, sideLength: number): void {
    drawApproximateCircle(turtle,sideLength/RADIUS_SIDELENGTH_RATIO,SQUARE_SIDES);
}

/**
 * Determine the length of a chord of a circle.
 * (There is a simple formula; derive it or look it up.)
 * 
 * @param radius radius of a circle, must be > 0
 * @param angle in radians, where 0 <= angle < Math.PI
 * @returns the length of the chord subtended by the given `angle` 
 *          in a circle of the given `radius`
 */
export function chordLength(radius: number, angle: number): number {
    return 2*radius*Math.sin(angle/2);
}

/**
 * Approximate a circle by drawing a many-sided regular polygon, 
 * using exactly `numSides` small counterclockwise turns,
 * so that the turtle is back to its original heading and position
 * after the drawing is complete.
 * 
 * @param turtle the turtle context
 * @param radius radius of the circle circumscribed around the polygon, must be > 0
 * @param numSides number of sides of the polygon to draw, must be >= 10
 */
export function drawApproximateCircle(turtle: Turtle, radius: number, numSides: number): void {
    const len: number = chordLength(radius,Math.PI/numSides);
    for (let i = 0; i < numSides; i++) {
        turtle.forward(len);
        turtle.turn(-FULL_CIRCUMFERENCE/numSides);
    };
}

/**
 * Calculate the distance between two points.
 * 
 * @param p1 one point
 * @param p2 another point
 * @returns Euclidean distance between p1 and p2
 */
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
}

/**
 * Given a list of points, find a sequence of turns and moves that visits the points in order,
 * ending with the turtle facing its original heading.
 * 
 * @param points array of N input points.  Adjacent points must be distinct, and the array must not start with (0,0).
 * @returns an array of length 2N+1 of the form [turn_0, move_0, ..., turn_N-1, move_N-1, turn_N]
 *    such that if the turtle starts at (0,0) heading up (positive y direction), 
 *    and executes turn(turn_i) and forward(move_i) actions in the same order, 
 *    then it will be at points[i] after move_i for all valid i,
 *    and be back to its original upward heading after turn_N.
 */
export function findPath(points: Array<Point>): Array<number> {
    const commands: Array<number> = [];

    // Helper arrays
    let previousPoint: Point = new Point(0,0);
    let previousAngle = 0;

    for (const point of points) {

        // calculate the angle between the points
        const angleFromUpward: number = Math.atan2(
            point.x - previousPoint.x,
            point.y - previousPoint.y) * HALF_CIRCUMFERENCE / Math.PI; /* atan 2 return in radians, converting to degrees */

        // add to that angle the direction of the turtle
        const turnAngle: number = angleFromUpward + previousAngle;
        commands.push(turnAngle);
        
        // calculate distance and add it to commands
        const distanceToMove: number = distance(previousPoint, point);
        commands.push(distanceToMove);
        
        // set variables for next iteration
        previousPoint = point;
        previousAngle = -angleFromUpward;
    }
    commands.push(previousAngle); // add the return to direct upward
    return commands;
}

/**
 * Draw your personal, custom art.
 * Drawing a spirale with circle in different color at each turn
 * 
 * Many interesting images can be drawn using the simple implementation of a turtle.
 * See the problem set handout for more information.
 * 
 * @param turtle the turtle context
 */
export function drawPersonalArt(turtle: Turtle): void {
    const COLORS: Array<PenColor>  = [
        PenColor.Blue,
        PenColor.Green,
        PenColor.Orange,
        PenColor.Pink,
        PenColor.Red,
        PenColor.Yellow,
        PenColor.Magenta
    ];

    for (let i = 0; i < SPIRAL_SIDES; i = i + SMALL_STEP) {
        turtle.color(PenColor.Black); // color of the spiral sides
        turtle.forward (i + i); // sides of the spiral grow gradually as needed
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        turtle.color(randomColor); // color of the circle
        drawApproximateCircle(turtle,PERSONAL_ART_RADIUS,SIDES_FOR_CIRCLE);
        turtle.turn (RIGHT_ANGLE - i);
    }
}

/**
 * Main program.
 * 
 * This function creates a turtle and draws in a window.
 */
export function main(): void {
    const turtle: Turtle = new DrawableTurtle();

    // const sideLength = 40;
    // drawSquare(turtle, sideLength);
    // drawApproximateCircle(turtle,sideLength,1000);
    // drawPersonalArt(turtle);

    // draw into a file
    const svgDrawing = turtle.getSVG();
    fs.writeFileSync('output.html', `<html>\n${svgDrawing}</html>\n`);

    // open it in a web browser
    void open('output.html');
}
