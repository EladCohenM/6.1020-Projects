/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'assert';
import * as parserlib from 'parserlib';
import { Canvas, Image, createCanvas, ImageLibrary, type TextMetrics } from '../src/imagelibrary.ts';
import { MemeExpression, parse } from '../src/expression.ts';

// HELPER FUNCTIONS
import { checkChars, convertStringToImage } from '../src/helpers.ts';




const library = new ImageLibrary('img',
    'boromir.jpg',
    'tech1.png', 'tech2.png', 'tech3.png', 'tech4.png', 'tech5.png', 'tech6.png',
    'blue.png', 'red.png', 'black.png', 'white.png',
    // if you depend on additional images in your tests, add them here
    // keep image files small to ensure Didit can build your repo
);

/**
 * Tests for the MemeExpression abstract data type.
 */
 describe('MemeExpression', function () {

    // Testing strategy
    //   testing methods of MemeExpression
    // toString(): filename, caption, side-by-side, resize, top-bottom, top overlay, bottom overlay, nested expressions
    // equalValue(): equal, not equal
    // size(): 
    //  filename exists, filename doesn't exist,
    //  caption, empty caption, 
    //  side-by-side, top-bottom,
    //  resize: explicit dimensions, left is ?, right is ?, both are ?, 
    //  top overlay, bottom overlay,
    //  nested expressions
    // image(): 
    //  leaves: filename exists, filename doesn't exist, caption
    //  side by side: side-by-side same size, side-by-side different height
    //  top-bottom: top-bottom same size, top-bottom different widths
    //  overlay: top overlay, bottom overlay
    //  resize: explicit dimensions, left is ?, right is ?, both are ?
    //  nesting: nested expressions

    // toString()
    it('parserlib needs to be version 4.0.x', function() {
        assert(parserlib.VERSION.startsWith("4.0"));
    });
    
    it("toString() filename", function () {
        assert.strictEqual(parse("a-_1..jpeg").toString(), "a-_1..jpeg");
    })

    it("toString() caption", function() {
        assert.strictEqual(parse('"hello"').toString(), '"hello"')
    })

    it("toString() side-by-side", function() {
        assert.strictEqual(parse('"hello" | (hello.png) | "hi"').toString(), '(("hello" | hello.png) | "hi")')
    })

    it("toString() one resize", function() {
        assert.strictEqual(parse("a.png @ 100 x 100").toString(), "(a.png @ 100x100)")
    })

    it("toString() top-bottom", function() {
        assert.strictEqual(parse('"hello" --- (hello.png) ----- "hi"').toString(), '(("hello" --- hello.png) --- "hi")')
    })
    
    it("toString() top overlay", function() {
        assert.strictEqual(parse('hello.png ^ "hi"').toString(), '(hello.png ^ "hi")')
    })
    
    it("toString() bottom overlay", function() {
        assert.strictEqual(parse('hello.png _ "hi"').toString(), '(hello.png _ "hi")')
    })
    
    it("toString() nested expressions", function() {
        assert.strictEqual(parse('a.png ^ "a" _ "b" --- ("hello" | a.png) | ("hi" | b.png @ 100x100)').toString(), '(((a.png ^ "a") _ "b") --- (("hello" | a.png) | ("hi" | (b.png @ 100x100))))')
    })

    

    // equalValue()    
    it("equalValue() equal", function() {
        assert(parse('a.png ^ "a" _ "b" --- ("hello" | a.png) | ("hi" | b.png @ 100x100)').equalValue(parse('(((a.png ^ "a") _ "b") --- (("hello" | a.png) | (("hi") | (b.png @ 100x100))))')))
    })
    
    it("equalValue() not equal", function() {
        assert(!parse('("hello" | a.png) | ("hi" | b.png @ 100x100)').equalValue(parse('"hello" | a.png | "hi" | b.png @ 100x100')))
    })



    // size()
    it("size() filename exists", function() {
        assert.deepStrictEqual(parse('tech1.png').size(library), { width: 200, height: 150 });
    })
    
    it("size() filename doesn't exist", function() {
        assert.throws( () => { parse("a.png").size(library) } )
    })
    
    it("size() caption", function() {
        const expected = convertStringToImage("hello");
        assert.deepStrictEqual(parse('"hello"').size(library), { width: expected.width, height: expected.height })
    })
    
    it("size() empty caption", function() {
        assert.deepStrictEqual(parse('""').size(library), { width: 1, height: 1 })
    })
    
    it("size() side-by-side", function() {
        assert.deepStrictEqual(parse('tech1.png | tech2.png').size(library), { width: 400, height: 150 });
    })
    
    it("size() top-bottom", function() {
        assert.deepStrictEqual(parse('tech1.png --- tech2.png').size(library), { width: 200, height: 290 });
    })
    
    it("size() resize explicit dimensions", function() {
        assert.deepStrictEqual(parse('tech1.png @ 400x200').size(library), { width: 400, height: 200 });
    })
    
    it("size() resize left is ?", function() {
        assert.deepStrictEqual(parse('black.png @ ?x60').size(library), { width: 60, height: 60 });
    })
    
    it("size() resize right is ?", function() {
        assert.deepStrictEqual(parse('black.png @ 60x?').size(library), { width: 60, height: 60 });
    })
    
    it("size() resize both are ?", function() {
        assert.throws( () => { parse('black.png @ ?x?').size(library) });
    })

    it("size() top overlay", function() {
        assert.deepStrictEqual(parse('tech2.png ^ tech1.png').size(library), { width: 200, height: 150 });
    })
    
    it("size() bottom overlay", function() {
        assert.deepStrictEqual(parse('tech2.png _ tech1.png').size(library), { width: 200, height: 150 });
    })
    
    it("size() nested expressions", function() {
        assert.deepStrictEqual(parse('tech1.png | tech2.png @ 400 x 200').size(library), { width: 600, height: 200 });
    })



    // image()
    const maxPixelValue = 255;

    it("image() filename exists", function() {
        const expression = parse('black.png');
        const image = expression.image(library).getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = image.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = image.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenter: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], // red=0%, green=0%, blue=0%, alpha=100%
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [0, 0, 0, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenter], 
                [0, 0, 0, maxPixelValue], 
                `center ${pixelCenter}`
            );
    })

    it("image() filename doesn't exist", function() {
        assert.throws( () => { parse("a.png").image(library) } )
    })
    
    it("image() caption", function() {
        const expression = parse('"hello"');
        const image = expression.image(library);
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        assert.strictEqual(image.width, imageWidth, `width ${image.width}`);
        assert.strictEqual(image.height, imageHeight, `height ${image.height}`);
    })

    it("image() side-by-side same size", function() {
        const expression = parse('black.png | white.png');
        const image = expression.image(library).getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = image.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = image.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenterleft: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2 - 1), Math.floor(imageHeight/2 - 1), 1, 1).data;
        const pixelCenterRight: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], // red=100%, green=100%, blue=100%, alpha=100%
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenterleft], 
                [0, 0, 0, maxPixelValue], 
                `center left ${pixelCenterleft}`
            );
        assert.deepStrictEqual(
                [...pixelCenterRight], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `center right ${pixelCenterRight}`
            );
    })

    it("image() top-bottom same size", function() {
        const expression = parse('black.png --- white.png');
        const image = expression.image(library).getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = image.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = image.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenterTop: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2 - 1), Math.floor(imageHeight/2 - 1), 1, 1).data;
        const pixelCenterBottom: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenterTop], 
                [0, 0, 0, maxPixelValue], 
                `center left ${pixelCenterTop}`
            );
        assert.deepStrictEqual(
                [...pixelCenterBottom], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `center right ${pixelCenterBottom}`
            );
    })

    it("image() top-bottom different widths", function() {
        const expression = parse('black.png --- white.png @ 60 x 60');
        const image = expression.image(library).getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = image.getImageData(0, 0, 1, 1).data;
        const pixelTrasparentBorder: Uint8ClampedArray  = image.getImageData(45, 29, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = image.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenterTop: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2 - 1), Math.floor(imageHeight/3 - 1), 1, 1).data;
        const pixelCenterBottom: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;

        assert.deepStrictEqual(
                pixelTopLeft[3], 
                0, 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                pixelTrasparentBorder[3], 
                0, 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenterTop], 
                [0, 0, 0, maxPixelValue], 
                `center top ${pixelCenterTop}`
            );
        assert.deepStrictEqual(
                [...pixelCenterBottom], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `center bottom ${pixelCenterBottom}`
            );
    })

    it("image() top overlay", function() {
        const expression = parse('black.png @ 60 x 60 ^ white.png');
        const image = expression.image(library).getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = image.getImageData(0, 0, 1, 1).data;
        const pixelTopLeftOverlay: Uint8ClampedArray  = image.getImageData(15, 0, 1, 1).data;
        const pixelBottomRightOverlay: Uint8ClampedArray  = image.getImageData(44, 29, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = image.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenterTop: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2 - 1), Math.floor(imageHeight/2 - 1), 1, 1).data;
        const pixelCenterBottom: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelTopLeftOverlay], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue],  
                `top left ${pixelTopLeftOverlay}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRightOverlay], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue],  
                `top left ${pixelBottomRightOverlay}`
            );
        assert.deepStrictEqual(
                [...pixelCenterTop], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `center left ${pixelCenterTop}`
            );
            assert.deepStrictEqual(
                [...pixelCenterBottom], 
                [0, 0, 0, maxPixelValue], 
                `center right ${pixelCenterBottom}`
            );
    })

    it("image() bottom overlay", function() {
        const expression = parse('black.png @ 60 x 60 _ white.png');
        const image = expression.image(library).getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = image.getImageData(0, 0, 1, 1).data;
        const pixelTopLeftOverlay: Uint8ClampedArray  = image.getImageData(15, 30, 1, 1).data;
        const pixelBottomRightOverlay: Uint8ClampedArray  = image.getImageData(44, 59, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = image.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenterTop: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2 - 1), Math.floor(imageHeight/2 - 1), 1, 1).data;
        const pixelCenterBottom: Uint8ClampedArray  = image.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelTopLeftOverlay], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue],  
                `top left ${pixelTopLeftOverlay}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRightOverlay], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue],  
                `top left ${pixelBottomRightOverlay}`
            );
        assert.deepStrictEqual(
                [...pixelCenterTop], 
                [0, 0, 0, maxPixelValue], 
                `center left ${pixelCenterTop}`
            );
            assert.deepStrictEqual(
                [...pixelCenterBottom], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `center right ${pixelCenterBottom}`
            );
    })

    it("image() resize explicit dimensions", function() {
        const expression = parse('black.png @ 60x60');
        const image = expression.image(library);
        const context = image.getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = context.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = context.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenter: Uint8ClampedArray  = context.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;
        
        assert.strictEqual(image.width, imageWidth, `width ${image.width}`);
        assert.strictEqual(image.height, imageHeight, `height ${image.height}`);

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [0, 0, 0, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenter], 
                [0, 0, 0, maxPixelValue], 
                `center ${pixelCenter}`
            );
    })

    it("image() resize left is ?", function() {
        const expression = parse('black.png @ ?x60');
        const image = expression.image(library);
        const context = image.getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = context.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = context.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenter: Uint8ClampedArray  = context.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;
        
        assert.strictEqual(image.width, imageWidth, `width ${image.width}`);
        assert.strictEqual(image.height, imageHeight, `height ${image.height}`);

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [0, 0, 0, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenter], 
                [0, 0, 0, maxPixelValue], 
                `center ${pixelCenter}`
            );
    })

    it("image() resize right is ?", function() {
        const expression = parse('black.png @ 60x?');
        const image = expression.image(library);
        const context = image.getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = context.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = context.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenter: Uint8ClampedArray  = context.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;
        
        assert.strictEqual(image.width, imageWidth, `width ${image.width}`);
        assert.strictEqual(image.height, imageHeight, `height ${image.height}`);

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue], 
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [0, 0, 0, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenter], 
                [0, 0, 0, maxPixelValue], 
                `center ${pixelCenter}`
            );
    })

    it("image() resize both are ?", function() {
        assert.throws( () => { parse("black.png @ ?x?").image(library) } )
    })
    
    it("image() side-by-side different dimensions and nested expressions", function() {
        const expression = parse('(black.png @ 60x60 | white.png) | (black.png | white.png @ 60x60)');
        const image = expression.image(library);
        const context = image.getContext('2d');
        const size = expression.size(library);
        const [imageWidth, imageHeight] = [size.width, size.height];
        
        const pixelTopLeft: Uint8ClampedArray  = context.getImageData(0, 0, 1, 1).data;
        const pixelBottomRight: Uint8ClampedArray  = context.getImageData(imageWidth-1, imageHeight-1, 1, 1).data;
        const pixelCenterleft: Uint8ClampedArray  = context.getImageData(Math.floor(imageWidth/2 - 1), Math.floor(imageHeight/2 - 1), 1, 1).data;
        const pixelCenterRight: Uint8ClampedArray  = context.getImageData(Math.floor(imageWidth/2), Math.floor(imageHeight/2), 1, 1).data;
        const pixelFirstTopTransparent: Uint8ClampedArray  = context.getImageData(60, 0, 1, 1).data;
        const pixelLastBottomTransparent: Uint8ClampedArray  = context.getImageData(119, 119, 1, 1).data;
        
        assert.strictEqual(image.width, imageWidth, `width ${image.width}`);
        assert.strictEqual(image.height, imageHeight, `height ${image.height}`);

        assert.deepStrictEqual(
                [...pixelTopLeft], 
                [0, 0, 0, maxPixelValue],
                `top left ${pixelTopLeft}`
            );
        assert.deepStrictEqual(
                [...pixelBottomRight], 
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `bottom right ${pixelBottomRight}`
            );
        assert.deepStrictEqual(
                [...pixelCenterleft],
                [maxPixelValue, maxPixelValue, maxPixelValue, maxPixelValue], 
                `center left ${pixelCenterleft}`
            );
        assert.deepStrictEqual(
                [...pixelCenterRight], 
                [0, 0, 0, maxPixelValue], 
                `center right ${pixelCenterRight}`
            );
        assert.deepStrictEqual(
                pixelFirstTopTransparent[3], // alpha only
                0, // transparent
                `first top transparent ${pixelFirstTopTransparent}`
            );
        assert.deepStrictEqual(
                pixelLastBottomTransparent[3],
                0, 
                `last bottom transparent ${pixelLastBottomTransparent}`
            );
    })
});

/**
 * Tests for the parse function.
 */
 describe('parse', function () {

    // Testing strategy
    //  testing creating MemeExpressions with parse (therefore testing parse and parseExpression as well)
    //  see if it manages to parse valid expressions and throws error for not valid ones
    //  cover all subdomains
    // partition on input:
    //  valid:
    //      single primitive: filename, caption, parenthesized expression
    //      side-by-side: one operator, repeated operators
    //      top-bottom: one operator, repeated operators
    //      overlay: top overlay, bottom overlay
    //      resize: one resize, repeated resize, left is ?, right is ?
    //      mixed side-by-side, resize, parenthesis and primitives
    //  not valid:
    //      invalid filename: starts with -
    //      invalid caption: unterminated, forbidden character
    //      missing operand around |, ---, ^, _
    //      malformed resize

    it("valid filename", function () {
        assert.strictEqual(parse("a-_1..jpeg").toString(), "a-_1..jpeg");
    })

    it("invalid filename, starts with -", function() {
        assert.throws(() => { parse("-a-_1..jpeg") })
    })

    it("valid caption", function() {
        assert(parse('"hello"').equalValue(parse('"hello"')))
    })

    it("valid primitive parenthesized expression", function () {
        assert(parse("(((a-_1..jpeg)))").equalValue(parse("a-_1..jpeg")));
    })
    
    it("invalid caption forbidden characters", function() {
        assert.throws(() => { parse('"hello\n"')})
        assert.throws(() => { parse('"hel\"lo"')})
    })
    
    it("invalid caption unterminated", function() {
        assert.throws(() => { parse('"hello') })
    })

    it("valid side-by-side one operator", function() {
        assert.strictEqual(parse('"hello" | (hello.png)').toString(), '("hello" | hello.png)')
    })
    
    it("valid side-by-side multiple operator", function() {
        assert.strictEqual(parse('"hello" | (hello.png) | "hi"').toString(),'(("hello" | hello.png) | "hi")')
    })

    it("valid top-bottom one operator", function() {
        assert.strictEqual(parse('"hello" --- (hello.png)').toString(), '("hello" --- hello.png)')
    })
    
    it("valid top-bottom multiple operator", function() {
        assert.strictEqual(parse('"hello" --- (hello.png) --- "hi"').toString(),'(("hello" --- hello.png) --- "hi")')
    })
    
    it("invalid side-by-side missing operand", function() {
        assert.throws( () => { parse('"hello" | ') } )
    })
    
    it("invalid top-bottom missing operand", function() {
        assert.throws( () => { parse('"hello" --- ') } )
    })
    
    it("invalid top-overlay missing operand", function() {
        assert.throws( () => { parse('black.png ^ ') } )
    })
    
    it("invalid bottom-overlay missing operand", function() {
        assert.throws( () => { parse('black.png _ ') } )
    })

    it("valid top overlay", function() {
        assert.strictEqual(parse('hello.png ^ ("hello")').toString(), '(hello.png ^ "hello")')
    })

    it("valid bottom overlay", function() {
        assert.strictEqual(parse('hello.png _ ("hello")').toString(), '(hello.png _ "hello")')
    })
    
    it("valid one resize", function() {
        assert.strictEqual(parse("a.png @ 100 x 100").toString(), "(a.png @ 100x100)")
    })
    
    it("valid repeated resize", function() {
        assert.strictEqual(parse("a.png @ 100 x 100 @ 300x400").toString(), "((a.png @ 100x100) @ 300x400)")
    })
    
    it("invalid malformed resize", function() {
        assert.throws( () => { parse("a.png @") })
        assert.throws( () => { parse("a.png @ 100x") })
        assert.throws( () => { parse("a.png @ a x b") })
        assert.throws( () => { parse("a.png @ ? x ?") })
    })
    
    it("valid mixed side-by-side, resize, parenthesis and primitives", function() {
        assert.strictEqual(parse('(a.png ^ "hi" --- b.png _ "bye") | ("hello" | b.png @ 100x100)').toString(),
        '(((a.png ^ "hi") --- (b.png _ "bye")) | ("hello" | (b.png @ 100x100)))');
    })
    
    it("invalid open paranthesis", function() {
        assert.throws( () => { parse('("hello"') } )
    })
});