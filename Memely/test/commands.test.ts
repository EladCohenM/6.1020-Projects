import assert from 'assert';
import * as parserlib from 'parserlib';
import { Canvas, Image, createCanvas, ImageLibrary, type TextMetrics } from '../src/imagelibrary.ts';
import { MemeExpression, parse } from '../src/expression.ts';
import { size, image } from '../src/commands.ts';

const library = new ImageLibrary('img',
    'boromir.jpg',
    'tech1.png', 'tech2.png', 'tech3.png', 'tech4.png', 'tech5.png', 'tech6.png',
    'blue.png', 'red.png', 'black.png', 'white.png',
    // if you depend on additional images in your tests, add them here
    // keep image files small to ensure Didit can build your repo
);

describe("size command", function() {
    /**
     * Testing Strategy:
     *  cover all subpartitions
     * partition on expression shape:
     *  simple expression
     *  nested/composite expression
     * partition on resize behavior:
     *  no ?
     *  uses ?
     * partition on validity:
     *  expression can be sized
     *  expression refers to missing filename
     */

    it("simple expression, expression can be sized", function() {
        assert.strictEqual(size(parse('black.png'), library), '30x30');
    })

    it("composite expression, no ?", function() {
        assert.strictEqual(size(parse('(black.png ^ ("white" @ 30x10)) @ 100x100'), library), '100x100');
    })

    it("uses ?", function() {
        assert.strictEqual(size(parse('black.png @ 60x?'), library), '60x60');
    })

    it("expression refers to missing filename", function() {
        assert.throws( () => { size(parse('hi.png'), library) } );
    })
})

describe("image command", function() {
    /**
     * Testing Strategy:
     *  cover all subparitions
     * partition on expression:
     *  simple filename expression
     *  caption expression
     *  composite expression
     * partition on validity:
     *  expression can be rendered
     *  expression refers to missing filename
     * partition on output:
     *  returned string is a valid image data URL
     */

    it("simple filename expression, expression can be rendered, output is a valid URL", function() {
        assert.strictEqual(image(parse('black.png'), library), parse('black.png').image(library).toDataURL());
    })

    it("caption expression", function() {
        assert.strictEqual(image(parse('"Hello"'), library), parse('"Hello"').image(library).toDataURL());
    })

    it("composite expression", function() {
        assert.strictEqual(image(parse('black.png ^ "hello" @ 30x10'), library), parse('black.png ^ "hello" @ 30x10').image(library).toDataURL());
    })

    it("missing filename", function() {
        assert.throws( () => { image(parse('hello.png ^ "hello" @ 30x10'), library)});
    })
})

