import assert from 'node:assert';
import { MemeExpression } from './expression.ts';
import { Canvas, Image, createCanvas, type ImageLibrary, type TextMetrics } from './imagelibrary.ts';

// HELPER FUNCTIONS


/**
 * checks if a string consists of only allowed chars
 * @param expr expression to check
 * @param chars the allowed chars
 */
export function checkChars(expr: string, chars: string): void {
    for (const char of expr) {
        if (!chars.includes(char)) {
            throw new Error(`char ${char} in ${expr} is not allowed for filename`);
        }
    }
}


/**
 * takes a string and convert it to an image
 * @param str string to convert 
 * @returns a canvas that renders the string as text using the default system font
 */
export function convertStringToImage(str: string): Canvas {
        const font = '96pt bold';
        const padding = 0;
        const fillStyle = 'white';
        const strokeStyle = 'black';

        // make a tiny 1x1 image at first so that we can get a Graphics object, 
        // which we need to compute the width and height of the text
        const measuringContext = createCanvas(1, 1).getContext('2d');
        measuringContext.font = font;
        const strMetrics: TextMetrics = measuringContext.measureText(str);

        // dimensions
        const textWidth = Math.ceil(strMetrics.width);
        const textHeight = Math.ceil(strMetrics.actualBoundingBoxAscent + strMetrics.actualBoundingBoxDescent);
        const canvasWidth = Math.max(1, textWidth + 2 * padding); // for empty captions
        const canvasHeight = Math.max(1, textHeight + 2 * padding); // for empty captions

        // now make a canvas sized to fit the text
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const context = canvas.getContext('2d');

        // font
        context.font = font;
        context.fillStyle = fillStyle;
        context.strokeStyle = strokeStyle;
        
        // draw
        const x = padding;
        const y = padding + Math.ceil(strMetrics.actualBoundingBoxAscent);
        context.fillText(str, x, y);
        context.strokeText(str, x, y);

        return canvas;
    }
