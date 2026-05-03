/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Implementation of image meme expressions. @module */

import assert from 'node:assert';
import { MemeExpression } from './expression.ts';
import { Canvas, Image, createCanvas, type ImageLibrary, type TextMetrics } from './imagelibrary.ts';
// HELPER FUNCTIONS
import { checkChars, convertStringToImage } from './helpers.ts';

/*
 * PS3 instructions: implement MemeExpression in this file.
 */

// Data type definition
//   MemeExpression = FileName(filename: string) 
//                    + Caption(caption: string) 
//                    + SideGlue(left: MemeExpression, right: MemeExpression) 
//                    + Resize(element: MemeExpression, width: number, hight: number)
//

// CONSTANTS
const FILENAME_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.";


/** make a Caption */
export class FileName implements MemeExpression {
    
    // Abstraction function
    //  AF(name) = the file who's name is filename
    // Rep invariant
    //  filename consist of letters, digits, periods, hyphens -, underscores _ only
    //  hyphens and underscores are not the first character
    //  filename ends with a period followed by one of these: .apng, .avif, .gif, .jpeg, .jpg, .jfif, .pjpeg, .pjp, .png, .svg, .webp
    // Safety from rep exposure
    //  all fields are immutable and unreassignable    

    public constructor(
        private readonly filename: string
    ) { 
        this.checkRep();
    }

    // assert rep invariant
    private checkRep(): void {
        // only letters, digits, periods, hyphens, underscores
        checkChars(this.filename, FILENAME_CHARS);

        // hyphens and undescores not in the first char
        if (this.filename[0] === "-" || this.filename[0] === "_") {
            throw new Error("filename starts with _ or -");
        }
    }
    
    /** @inheritdoc */
    public toString(): string {
        this.checkRep();
        return this.filename;
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        this.checkRep();
        if (that instanceof FileName) {
            if (that.filename === this.filename) {
                this.checkRep();
                return true;
            }
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        return { width: library.getImage(this.filename).width, height: library.getImage(this.filename).height };
    }

    
    public image(library: ImageLibrary): Canvas {
        const image: Image = library.getImage(this.filename);
        
        // dimensions
        const upperLeftX = 0;
        const upperLeftY = 0;
        const outputImageWidth = image.width;
        const outputImageHeight = image.height;
        
        // draw
        const canvas = createCanvas(outputImageWidth, outputImageHeight);
        const context = canvas.getContext('2d');
        context.drawImage(image, upperLeftX, upperLeftY, outputImageWidth, outputImageHeight);

        return canvas;
    }
}

/** make a Caption */
export class Caption implements MemeExpression {
    
    // Abstraction function
    //  AF(caption) = the variable caption consists caption
    // Rep invariant
    //  caption is not consist of newlines and double-quotes
    // Safety from rep exposure
    //  all fields are immutable and unreassignable

    public constructor(
        private readonly caption: string
    ) { 
        this.checkRep();
    }

    // assert rep invariant
    private checkRep(): void {
        if (this.caption.includes("\n") || this.caption.includes("\"")) {
            throw new Error("caption includes newline or double-quote");
        }
    }
    
    /** @inheritdoc */
    public toString(): string {
        this.checkRep();
        return '"' + this.caption + '"';
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        this.checkRep();
        if (that instanceof Caption) {
            if (that.caption === this.caption) {
                return true;
            }
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        const textImage = convertStringToImage(this.caption);
        return { width: textImage.width, height: textImage.height };
    }

    /** @inheritdoc */
    public image(library: ImageLibrary): Canvas {
        return convertStringToImage(this.caption);
    }
}

/** make a SideGlue which is left side by side with right*/
export class SideGlue implements MemeExpression {
    
    // Abstraction function
    //  AF(left, right) = left MemeExpression side by side with right MemeExpression
    // Rep invariant
    //  true
    // Safety from rep exposure
    //  all fields are immutable and unreassignable

    public constructor(
        private readonly left: MemeExpression,
        private readonly right: MemeExpression
    ) { 
    }
    
    /** @inheritdoc */
    public toString(): string {
        return `(${this.left.toString()} | ${this.right.toString()})`;
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        if (that instanceof SideGlue) {
            return this.left.equalValue(that.left) && this.right.equalValue(that.right);
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        return {
            width: this.left.size(library).width + this.right.size(library).width,
            height: Math.max(this.left.size(library).height, this.right.size(library).height)
        };
    }

    /** @inheritdoc */
    public image(library:  ImageLibrary): Canvas {
        // sub images to draw
        const leftImage: Canvas = this.left.image(library);
        const rightImage: Canvas = this.right.image(library);

        // dimensions
        const upperLeftX = 0;
        const canvasWidth = leftImage.width + rightImage.width;
        const canvasHeight = Math.max(leftImage.height, rightImage.height);
        const leftImageYStart = Math.max(0, Math.floor((rightImage.height - leftImage.height)/2)); // center if smaller
        const rightImageYStart = Math.max(0, Math.floor((leftImage.height - rightImage.height)/2)); // center if smaller

        // draw
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const context = canvas.getContext('2d');
        context.drawImage(leftImage, upperLeftX, leftImageYStart, leftImage.width, leftImage.height);
        context.drawImage(rightImage, leftImage.width, rightImageYStart, rightImage.width, rightImage.height);

        return canvas;
    }
}

/** make a SideGlue which is left side by side with right*/
export class Resize implements MemeExpression {
    
    // Abstraction function
    //  AF(element, width, height) = the element MemeExpression resized to the size width x height
    // Rep invariant
    //  true
    // Safety from rep exposure
    //  all fields are immutable and unreassignable

    public constructor(
        private readonly element: MemeExpression,
        private readonly width: number | '?',
        private readonly height: number | '?'
    ) { 
        if (width === '?' && height === '?') {
            throw new Error('exepcted at least one number');
        } 
    }
    
    /** @inheritdoc */
    public toString(): string {
        return `(${this.element.toString()} @ ${this.width}x${this.height})`;
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        if (that instanceof Resize) {
            return (
                this.element.equalValue(that.element) &&
                this.width === that.width &&
                this.height === that.height
            );
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        if (this.width !== '?' && this.height !== '?') {
            return {
                width: this.width,
                height: this.height
            };
        } else {
            const elementSize = this.element.size(library);
            if (this.width === '?' && this.height !== '?') {
                const newWidth = Math.round((this.height / elementSize.height) * elementSize.width);
                return {
                    width: newWidth,
                    height: this.height
                };
            } else if (this.width !== '?' && this.height === '?') {
                const newHeight = Math.round((this.width / elementSize.width) * elementSize.height);
                return {
                    width: this.width,
                    height: newHeight
                };
            }
        }
        // shouldn't get here
        throw new Error('got to the last line of size, unexpected');
    }

    /** @inheritdoc */
    public image(library: ImageLibrary): Canvas {
        const image = this.element.image(library);

        // dimensions
        const upperLeftX = 0;
        const upperLeftY = 0;
        const imageWidth = this.size(library).width;
        const imageHeight = this.size(library).height;

        // draw
        const canvas = createCanvas(imageWidth, imageHeight);
        const context = canvas.getContext('2d');
        context.drawImage(image, upperLeftX, upperLeftY, imageWidth, imageHeight);

        return canvas;
    }
}

export class TopBottom implements MemeExpression {
    
    // Abstraction function
    //  AF(top, bottom) = top MemeExpression vertically on top of bottom MemeExpression
    // Rep invariant
    //  true
    // Safety from rep exposure
    //  all fields are immutable and unreassignable

    public constructor(
        private readonly top: MemeExpression,
        private readonly bottom: MemeExpression,
    ) {
    }
    
    /** @inheritdoc */
    public toString(): string {
        return `(${this.top.toString()} --- ${this.bottom.toString()})`;
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        if (that instanceof TopBottom) {
            return this.top.equalValue(that.top) && this.bottom.equalValue(that.bottom);
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        return {
            width: Math.max(this.top.size(library).width, this.bottom.size(library).width),
            height: this.top.size(library).height + this.bottom.size(library).height
        };
    }

    /** @inheritdoc */
    public image(library:  ImageLibrary): Canvas {
        // sub images to draw
        const topImage: Canvas = this.top.image(library);
        const bottomImage: Canvas = this.bottom.image(library);

        // dimensions
        const canvasWidth = Math.max(topImage.width, bottomImage.width);
        const canvasHeight = topImage.height + bottomImage.height;
        const topImageXStart = Math.max(0, Math.floor((bottomImage.width - topImage.width)/2)); // center if smaller
        const bottomImageXStart = Math.max(0, Math.floor((topImage.width - bottomImage.width)/2)); // center if smaller

        // draw
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const context = canvas.getContext('2d');
        context.drawImage(topImage, topImageXStart, 0 , topImage.width, topImage.height);
        context.drawImage(bottomImage, bottomImageXStart, topImage.height, bottomImage.width, bottomImage.height);

        return canvas;
    }

}

export class TopOverlay implements MemeExpression {
    
    // Abstraction function
    //  AF(below, above) = above MemeExpression placed over below MemeExpression with their tops aligned
    // Rep invariant
    //  true
    // Safety from rep exposure
    //  all fields are immutable and unreassignable

    public constructor(
        private readonly below: MemeExpression,
        private readonly above: MemeExpression,
    ) {
    }
    
    /** @inheritdoc */
    public toString(): string {
        return `(${this.below.toString()} ^ ${this.above.toString()})`;
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        if (that instanceof TopOverlay) {
            return this.below.equalValue(that.below) && this.above.equalValue(that.above);
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        return {
            width: Math.max(this.below.size(library).width, this.above.size(library).width),
            height: Math.max(this.below.size(library).height, this.above.size(library).height)
        };
    }

    /** @inheritdoc */
    public image(library:  ImageLibrary): Canvas {
        // sub images to draw
        const belowImage: Canvas = this.below.image(library);
        const aboveImage: Canvas = this.above.image(library);

        // dimensions
        const canvasWidth = Math.max(belowImage.width, aboveImage.width);
        const canvasHeight = Math.max(belowImage.height, aboveImage.height);
        const belowImageXStart = Math.max(0, Math.floor((aboveImage.width - belowImage.width)/2)); // center if smaller
        const aboveImageXStart = Math.max(0, Math.floor((belowImage.width - aboveImage.width)/2)); // center if smaller

        // draw
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const context = canvas.getContext('2d');
        context.drawImage(belowImage, belowImageXStart, 0, belowImage.width, belowImage.height);
        context.drawImage(aboveImage, aboveImageXStart, 0, aboveImage.width, aboveImage.height);

        return canvas;
    }

}

export class BottomOverlay implements MemeExpression {
    
    // Abstraction function
    //  AF(below, above) = above MemeExpression placed over below MemeExpression with their bottoms aligned
    // Rep invariant
    //  true
    // Safety from rep exposure
    //  all fields are immutable and unreassignable

    public constructor(
        private readonly below: MemeExpression,
        private readonly above: MemeExpression,
    ) {
    }
    
    /** @inheritdoc */
    public toString(): string {
        return `(${this.below.toString()} _ ${this.above.toString()})`;
    }

    /** @inheritdoc */
    public equalValue(that: MemeExpression): boolean {
        if (that instanceof BottomOverlay) {
            return this.below.equalValue(that.below) && this.above.equalValue(that.above);
        }
        return false;
    }

    /** @inheritdoc */
    public size(library: ImageLibrary): { width: number, height: number } {
        return {
            width: Math.max(this.below.size(library).width, this.above.size(library).width),
            height: Math.max(this.below.size(library).height, this.above.size(library).height)
        };
    }

    /** @inheritdoc */
    public image(library:  ImageLibrary): Canvas {
        // sub images to draw
        const belowImage: Canvas = this.below.image(library);
        const aboveImage: Canvas = this.above.image(library);

        // dimensions
        const canvasWidth = Math.max(belowImage.width, aboveImage.width);
        const canvasHeight = Math.max(belowImage.height, aboveImage.height);
        const belowImageXStart = Math.max(0, Math.floor((aboveImage.width - belowImage.width)/2)); // center if smaller
        const aboveImageXStart = Math.max(0, Math.floor((belowImage.width - aboveImage.width)/2)); // center if smaller

        // draw
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const context = canvas.getContext('2d');
        context.drawImage(belowImage, belowImageXStart, 0, belowImage.width, belowImage.height);
        context.drawImage(aboveImage, aboveImageXStart, canvasHeight - aboveImage.height, aboveImage.width, aboveImage.height);

        return canvas;
    }

}


