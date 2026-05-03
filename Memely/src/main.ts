/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Console interface to the meme expression system. @module */

import fs from 'node:fs';
import readline from 'node:readline';
import { Image } from 'canvas';
import open from 'open';
import * as commands from './commands.ts';
import { MemeExpression, parse } from './expression.ts';
import { ImageLibrary, createCanvas } from './imagelibrary.ts';

/*
 * PS3 instructions: you are free to change this file if you want to add new features
 * or explore beyond the problem set.
 */

console.log('Memely console');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const keywords = {
    size: '!size',
    image: '!image',
    exit: '!quit',
};

const library = new ImageLibrary('img',
    'boromir.jpg',
    'tech1.png', 'tech2.png', 'tech3.png', 'tech4.png', 'tech5.png', 'tech6.png',
    'blue.png', 'red.png', 'black.png', 'white.png',
    // to work with additional images, add them here
    // keep image files small to ensure Didit can build your repo
);

const outputFilename = 'main-output.png';

let currentExpression: MemeExpression|undefined;

/**
 * Receive and handle user inputs.
 */
function promptForCommands(): void {
    rl.question('> ', function(command) {
        try {
            switch (command) {
                case '':
                    // ignore blank lines
                    break;

                case keywords.size:
                    if (currentExpression === undefined) {
                        console.error('must enter an expression before using this command');
                        break;
                    }
                    console.log(commands.size(currentExpression, library));
                    break;

                case keywords.image:
                    if (currentExpression === undefined) {
                        console.error('must enter an expression before using this command');
                        break;
                    }
                    saveImageToFile(commands.image(currentExpression, library), outputFilename);
                    void open(outputFilename);
                    break;

                case keywords.exit:
                    process.exit(0);
                    break;

                default:
                    currentExpression = parse(command);
                    console.log(currentExpression.toString());
                    break;
            }
        } catch(e) {
            console.error(e);
        }
        promptForCommands();
    });
}

/**
 * Write an image in PNG format to a file, running in Node.js.
 * 
 * @param dataUrl `data:` URL containing image data
 * @param filename filename to write image to
 */
function saveImageToFile(dataUrl: string, filename: string): void {
    const image = new Image();
    image.src = dataUrl;
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pngData = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, pngData);
}

promptForCommands();
