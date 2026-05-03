/* Copyright (c) 2025 MIT 6.102 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Very simple animation library. @module */

import fs from 'node:fs';

/*
 * PS1 instructions: do NOT modify this file, treat it as a library.
 */

import type { Color } from '../src/colors.ts';
import type { Point } from '../src/curves.ts';

/** A single-color polyline. */
export type Polyline = { color: Color, points: Array<Point> };
/** A collection of polylines. */
export type Frame = Array<Polyline>;
/** A sequence of frames. */
export type Animation = Array<Frame>;

/** Framerate for animateToFile. */
export const framerate = 24;

const decimals = 3;
const maxScale = 4;

/**
 * Animate a sequence of frames in a loop at 24 frames per second, where each frame is a collection
 * of polylines in specified colors. Writes the result as a SVG to the given file.
 * 
 * Each frame in the input appears for 1/24th of a second.
 * 
 * Each polyline is drawn with line segments that connect the adjacent pairs of points in its
 * `points` array. It is drawn in its RGB `color`, which must be a [r,g,b] tuple of integers
 * 0 <= r,g,b <= 255.
 * 
 * @param frames sequence of frames; each frame is a collection of polylines, and each polyline
 *               is a polygonal chain connecting `points` in order, drawn in RGB `color`
 * @param filename output filename, e.g. "example.html"
 */
export function animateToFile(frames: Animation, filename: string): void {
    fs.writeFileSync(filename, svg(frames));
}

function svg(frames: Animation): string {
    const size = extent(frames);
    const [ xmin, ymin, width, height ] = size;
    const maxWidth = width * maxScale;
    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${size.join(' ')}" style="max-width: ${maxWidth}px;">`,
        `<g fill="none" transform="scale(1 -1)" transform-origin="${xmin+width/2} ${ymin+height/2}">`,
        ...frames.map(drawFrame),
        '</g>',
        '</svg>',
    ].join('\n');
}

function extent(frames: Animation): [number,number,number,number] {
    const points = [ ...allPoints(frames) ];
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    const xmin = Math.floor(Math.min(...xs))-1;
    const ymin = Math.floor(Math.min(...ys))-1;
    return [ xmin, ymin, Math.ceil(Math.max(...xs))-xmin+1, Math.ceil(Math.max(...ys))-ymin+1 ];
}

function* allPoints(frames: Animation): Generator<Point> {
    for (const frame of frames) {
        for (const figure of frame) {
            for (const point of figure.points) {
                yield point;
            }
        }
    }
}

function drawFrame(frame: Frame, n: number, frames: Frame[]): string {
    return `<g>${frame.map(drawPolyline).join('')}${animateTag(n, frames.length)}</g>`;
}

function drawPolyline(polyline: Polyline): string {
    return `<polyline points="${toPoints(polyline.points)}" stroke="rgb(${polyline.color.join(',')})"/>`;
}

function toPoints(points: Array<Point>): string {
    return points.map(({ x, y }) => `${toFixed(x)},${toFixed(y)}`).join(' ');
}

function animateTag(n: number, total: number): string {
    const keytimes = [ 0, toFixed(n/total), toFixed((n+1)/total) ];
    const duration = toFixed(total/framerate);
    return `<animate attributeName="opacity" values="0;1;0" keyTimes="${keytimes.join(';')}" calcMode="discrete" dur="${duration}s" repeatCount="indefinite"/>`;
}

function toFixed(v: number): string {
    return v.toFixed(decimals);
}
