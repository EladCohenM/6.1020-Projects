/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Interface for accessing Images and Canvases. @module */

import { Image, loadImage } from 'canvas';

/*
 * PS3 instructions: do NOT change this file. Do NOT import 'canvas' in any other file.
 */

export type { Canvas, Image, TextMetrics } from 'canvas';
export { createCanvas } from 'canvas';

/**
 * Library of pre-loaded images.
 */
export class ImageLibrary {
    
    private readonly library: Map<string, Image> = new Map();

    /**
     * Make a new image library, loading images from the filesystem (running in Node.js)
     * or from URLs (running in a web browser).
     * 
     * @param dirname directory containing images, relative to the current folder (Node.js)
     *                or URL (web); must be "img"
     * @param filenames images to load from the directory, e.g. "boromir.jpg"; names must be unique
     */
    public constructor(dirname: 'img', ...filenames: string[]) {
        for (const filename of filenames) {
            this.addImage(`${dirname}/${filename}`);
        }
    }

    private addImage(pathname: string): void {
        const name = basename(pathname);
        if (this.library.has(name)) {
            throw new Error('cannot add duplicate image "' + name + '" from ' + pathname);
        }
        if (typeof window === 'object') {
            // web browser
            loadImage(pathname).then(
                image => this.library.set(name, image),
                err => console.error('unable to load web image from ' + pathname, err));
        } else if (typeof process === 'object') {
            // Node.js
            const image = new Image();
            image.onload = () => this.library.set(name, image);
            image.onerror = () => console.error('unable to load file image from ' + pathname);
            image.src = pathname;
        } else {
            throw new Error('unable to determine platform');
        }
    }

    /**
     * Get an image from this library by name.
     * 
     * @param name image base filename, e.g. "boromir.jpg"
     * @returns fully-loaded Image (so its dimensions and pixels are immediately available for use)
     * @throws Error if no image by that name is in this library
     */
    public getImage(name: string): Image {
        const image = this.library.get(name);
        if (image === undefined) {
            throw new Error('no image named ' + name + ' found in library');
        }
        return image;
    }
}

/**
 * @param pathname pathname of a file
 * @returns final path component of pathname, must not end in '/'.
 *          For example, the basename of 'foo/bar/baz.txt' is 'baz.txt'.
 */
function basename(pathname: string): string {
    const match = pathname.match(/[^/]*$/);
    if ( ! match) { throw new Error('no basename for ' + pathname); }
    const [ basename ] = match;
    if ( ! basename) { throw new Error('empty basename for ' + pathname); }
    return basename;
}
