/* Copyright (c) 2007-2023 MIT 6.102/6.031/6.005 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

//
// PS0 instructions: do NOT change any of the code in this file.
//

/**
 * Turtle interface.
 * 
 * Defines the interface that any turtle must implement. Note that the
 * standard directions/rotations use Logo semantics: initial heading
 * of zero is 'up', and positive angles rotate the turtle clockwise.
 */
export interface Turtle {

    /**
     * Move the turtle forward a number of steps.
     * 
     * @param units number of steps to move in the current direction; must be positive
     */
    forward(units: number): void;

    /**
     * Change the turtle's heading by a number of degrees clockwise.
     * 
     * @param degrees amount of change in angle, in degrees, with positive being clockwise
     */
    turn(degrees: number): void;

    /**
     * Change the turtle's current pen color.
     * 
     * @param color new pen color
     */
    color(color: PenColor): void;

    /**
     * Get the image created by this turtle.
     * 
     * @returns string containing image in SVG format
     */
    getSVG(): string;
}

// constants used by DrawableTurtle

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

const CIRCLE_DEGREES = 360;
const HORIZONTAL_DEGREES = CIRCLE_DEGREES / 2;
const DEGREES_TO_VERTICAL = HORIZONTAL_DEGREES / 2;

/**
 * @param degrees an angle measured in degrees
 * @returns the same angle expressed in radians
 */
function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / HORIZONTAL_DEGREES);
}

/**
 * Turtle that draws in a window on the screen.
 */
export class DrawableTurtle implements Turtle {
    // current state of turtle
    private currentPosition: Point;
    private currentHeading: number;
    private currentColor: PenColor;

    // lines already drawn by the turtle, in a conventional
    // math coordinate system: (0,0) is in the center of the canvas,
    // x increases to the right, and y increases upwards
    private readonly lines: Array<LineSegment>;

    public constructor() {
        this.currentPosition = new Point(0,0);
        this.currentHeading = 0;
        this.currentColor = PenColor.Black;
        this.lines = [];
    }


    public forward(units: number): void {
        const newPosition = new Point(
            this.currentPosition.x + Math.cos(degreesToRadians(DEGREES_TO_VERTICAL - this.currentHeading)) * units,
            this.currentPosition.y + Math.sin(degreesToRadians(DEGREES_TO_VERTICAL - this.currentHeading)) * units
        );

        this.lines.push(new LineSegment(this.currentPosition, newPosition, this.currentColor));
        this.currentPosition = newPosition;
    }

    public turn(degrees: number): void {
        // shift degrees to [0, CIRCLE_DEGREES), so that currentHeading will remain in that range too
        const degreesClipped = (degrees % CIRCLE_DEGREES + CIRCLE_DEGREES) % CIRCLE_DEGREES;
        this.currentHeading = (this.currentHeading + degreesClipped) % CIRCLE_DEGREES;
    }

    public color(color: PenColor): void {
        this.currentColor = color;
    }

    public getSVG(): string {

        /**
         * @param n an x or y coordinate
         * @returns SVG coordinate corresponding to n
         */
        function coord(n: number): string { return n.toFixed(2); }

        /**
         * @param color a PenColor
         * @returns corresponding SVG color name
         */
        function svgColor(color: PenColor): string { return PenColor[color].toLowerCase(); }

        const centerX = CANVAS_WIDTH/2;
        const centerY = CANVAS_HEIGHT/2;
        let svg = `
<svg viewBox="0 0 ${coord(CANVAS_WIDTH)} ${coord(CANVAS_HEIGHT)}" xmlns="http://www.w3.org/2000/svg">
<g transform="translate(${coord(centerX)} ${coord(centerY)}) scale(1 -1)">
`;
        for (const line of this.lines) {
            svg += (`
  <path fill="none" stroke="${svgColor(line.color)}"
        d="M ${coord(line.start.x)},${coord(line.start.y)} L ${coord(line.end.x)},${coord(line.end.y)}"/>
`);
        }
        svg += `
</g>
</svg>

`;
        return svg;
    }
}

/**
 * Enumeration of turtle pen colors.
 */
export enum PenColor {
    Transparent,
    Black,
    Gray,
    Red,
    Pink,
    Orange,
    Yellow,
    Green,
    Cyan,
    Blue,
    Magenta,
}

/**
 * An immutable line segment in floating-point pixel space.
 */
export class LineSegment {

    /**
     * Construct a line segment from start and end points.
     * 
     * @param start one end of the line segment
     * @param end the other end of the line segment
     * @param color line segment color
     */
    public constructor(public readonly start: Point,
                       public readonly end: Point,
                       public readonly color: PenColor) {
    }

    /**
     * Construct a line segment from coordinate pairs.
     * 
     * @param startx x-coordinate of start point
     * @param starty y-coordinate of start point
     * @param endx x-coordinate of end point
     * @param endy y-coordinate of end point
     * @param color line segment color
     * @returns line segment from (startx,starty) to (endx,endy) colored `color`
     */
    public static fromCoordinates(startx: number, starty: number,
                       endx: number, endy: number,
                       color: PenColor): LineSegment {
        return new LineSegment(new Point(startx, starty), new Point(endx, endy), color);
    }

    /**
     * Compute the length of this segment.
     * 
     * @returns the length of the line segment
     */
    public length(): number {
        return Math.sqrt(
                (this.start.x - this.end.x) ** 2
              + (this.start.y - this.end.y) ** 2
        );
    }

    /**
     * @param that  line segment to compare `this` with
     * @returns true iff this and that represent the same line segment
     */
    public equalValue(that:LineSegment):boolean {
        return (
            this.start.equalValue(that.start)
            && this.end.equalValue(that.end)
            && this.color === that.color
        );
    }
}

/**
 * An immutable point in floating-point pixel space.
 */
export class Point {

    /**
     * Construct a point from an x and y coordinate.
     *
     * @param x the x-coordinate of the point
     * @param y the y-coordinate of the point
     */
    public constructor(public readonly x: number,
                       public readonly y: number) {
    }

    public toString(): string {
        return "Point(" + this.x + "," + this.y + ")";
    }

    /**
     * @param that  point to compare `this` with
     * @returns true iff this and that represent the same point
     */
    public equalValue(that:Point):boolean {
        return this.x === that.x && this.y === that.y;
    }

}
