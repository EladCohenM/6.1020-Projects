/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { parseExpression } from './expressionparser.ts';
import { Canvas, Image, type ImageLibrary } from './imagelibrary.ts';

/*
 * PS3 instructions:
 * MemeExpression is a required ADT interface.
 * You MUST NOT change its name or the names or type signatures of existing methods.
 * You will, however, add additional methods, and you may strengthen the specs of existing methods.
 *  -and-
 * parse is a required function, you MUST NOT change its name, type signature, or spec.
 */

/**
 * An immutable data type representing an image meme expression, as defined in the PS3 handout.
 */
export interface MemeExpression {

    // Data type definition: in expression-impls.ts
    
    /**
     * @returns a parsable representation of this expression, such that
     *          for all expr: MemeExpression, expr.equalValue(parse(expr.toString()))
     */
    toString(): string;
    
    /**
     * @param that any MemeExpression
     * @returns true if and only if this and that are structurally-equal MemeExpressions,
     *          as defined in the PS3 handout
     */
    equalValue(that: MemeExpression): boolean;
    
    /**
     * Compute the dimensions of the image produced by this meme expression
     * @param library library used to look up image files referenced by filename expressions
     * @returns width and height of the rendered image
     * @throws Error if this expression refers to a filename that is not in the library
     */
    size(library: ImageLibrary): { width: number, height: number };
    
    /**
     * Render this meme expression as an image
     * @param library library used to look up image files referenced by filename expressions
     * @returns canvas containing the rendered image of this expression
     * @throws Error if this expression refers to a filename that is not in the library
     */
    image(library: ImageLibrary): Canvas;
    
}

/**
 * Parse an expression.
 * 
 * @param input expression to parse, as defined in the PS3 handout
 * @returns expression AST for the input
 * @throws Error if the expression is syntactically invalid
 */
export function parse(input: string): MemeExpression {
    // implement with glue code only, at most three lines
    return parseExpression(input);
}
