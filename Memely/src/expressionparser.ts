/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Parser for image meme expressions. @module */

import assert from 'node:assert';
import { Parser, ParseTree, compile, visualizeAsUrl } from 'parserlib';
import { MemeExpression } from './expression.ts';
import { FileName, Caption, SideGlue, Resize, TopBottom, TopOverlay, BottomOverlay } from './expression-impls.ts';

/*
 * PS3 instructions: you are free to change this file.
 */

// PS3 instructions: do not read image data in the parser
type ImageLibrary = undefined; type Canvas = undefined; type Image = undefined; const createCanvas = undefined, loadImage = undefined;

// the grammar
const grammar = `
@skip whitespace {
    expression ::= sideGlue (topToBottomOperator sideGlue)*;
    sideGlue ::= bottomOverlay ('|' bottomOverlay)*;
    bottomOverlay ::= topOverlay ('_' topOverlay)*;
    topOverlay ::= resize ('^' resize)*;
    resize ::= primitive ('@' (number | questionMark) 'x' (number | questionMark))*;
    primitive ::= filename | caption | '(' expression ')';
}
topToBottomOperator ::= '---' '-'*;
filename ::= [A-Za-z0-9.][A-Za-z0-9._-]*;
questionMark ::= '?';
caption ::= '"' [^"\\n]* '"';
number ::= [0-9]+;
whitespace ::= [ \\t\\r\\n]+;
`;

// the nonterminals of the grammar
enum ExpressionGrammar {
    Expression, SideGlue, BottomOverlay, TopOverlay, Resize, Primitive, TopToBottomOperator, Filename, Caption, Number, Whitespace, QuestionMark
}

// compile the grammar into a parser
const parser: Parser<ExpressionGrammar> = compile(grammar, ExpressionGrammar, ExpressionGrammar.Expression);

/**
 * Parse a string into an expression.
 * 
 * @param input string to parse
 * @returns MemeExpression parsed from the string
 * @throws ParseError if the string doesn't match the meme expression grammar
 */
export function parseExpression(input: string): MemeExpression {
    // parse the example into a parse tree
    const parseTree: ParseTree<ExpressionGrammar> = parser.parse(input);

    // display the parse tree in various ways, for debugging only
    // console.log("parse tree:\n" + parseTree);
    // console.log(visualizeAsUrl(parseTree, ExpressionGrammar));

    // make an AST from the parse tree
    const expression: MemeExpression = makeAbstractSyntaxTree(parseTree);
    // console.log("abstract syntax tree:\n" + expression);
    
    return expression;
}
    
/**
 * Convert a parse tree into an abstract syntax tree.
 * 
 * @param parseTree constructed according to the grammar for image meme expressions
 * @returns abstract syntax tree corresponding to the parseTree
 */
function makeAbstractSyntaxTree(parseTree: ParseTree<ExpressionGrammar>): MemeExpression {
    // EXPRESSION
    if (parseTree.name === ExpressionGrammar.Expression) {
        // expression ::= sideGlue (topToBottomOperator sideGlue)*;
        const glueElements = parseTree.children.filter(child => child.name === ExpressionGrammar.SideGlue);
        const firstAst = makeAbstractSyntaxTree(glueElements[0] ?? assert.fail("expected sideGlue"));
        const glueOutput = glueElements.slice(1).reduce(
            (ast, child) => new TopBottom(ast, makeAbstractSyntaxTree(child)),
            firstAst
        );
        return glueOutput;

    // SIDEGLUE
    } else if (parseTree.name === ExpressionGrammar.SideGlue) {
        const glueElements = parseTree.children.filter(child => child.name === ExpressionGrammar.BottomOverlay);
        const firstAst = makeAbstractSyntaxTree(glueElements[0] ?? assert.fail("expected bottomOverlay"));
        const glueOutput = glueElements.slice(1).reduce(
            (ast, child) => new SideGlue(ast, makeAbstractSyntaxTree(child)),
            firstAst
        );
        return glueOutput;

    // BOTTOMOVERLAY
    } else if (parseTree.name === ExpressionGrammar.BottomOverlay) {
        const glueElements = parseTree.children.filter(child => child.name === ExpressionGrammar.TopOverlay);
        const firstAst = makeAbstractSyntaxTree(glueElements[0] ?? assert.fail("expected topOverlay"));
        const glueOutput = glueElements.slice(1).reduce(
            (ast, child) => new BottomOverlay(ast, makeAbstractSyntaxTree(child)),
            firstAst
        );
        return glueOutput;
    
    // TOPOVERLAY
    } else if (parseTree.name === ExpressionGrammar.TopOverlay) {
        const glueElements = parseTree.children.filter(child => child.name === ExpressionGrammar.Resize);
        const firstAst = makeAbstractSyntaxTree(glueElements[0] ?? assert.fail("expected resize"));
        const glueOutput = glueElements.slice(1).reduce(
            (ast, child) => new TopOverlay(ast, makeAbstractSyntaxTree(child)),
            firstAst
        );
        return glueOutput;

    // RESIZE
    } else if (parseTree.name === ExpressionGrammar.Resize) {
        // resize ::= primitive ('@' number 'x' number)*;
        // only primitives and numbers
        const resizeElements = parseTree.children
            .filter(child => [ExpressionGrammar.Primitive, ExpressionGrammar.Number, ExpressionGrammar.QuestionMark].includes(child.name))
            .map(child => { 
                if (child.name !== ExpressionGrammar.Primitive && child.name !== ExpressionGrammar.Number && child.name !== ExpressionGrammar.QuestionMark) {
                    assert.fail("shouldn't get here"); 
                }

                switch (child.name) {
                case ExpressionGrammar.Primitive:
                    return makeAbstractSyntaxTree(child);
                
                case ExpressionGrammar.Number:
                    return Number(child.text.trim());

                case ExpressionGrammar.QuestionMark:
                    return '?';
                }
            });
        
        // if resize is just a primitive
        if (resizeElements.length === 1) {
            if (typeof resizeElements[0] !== "number" && resizeElements[0] !== undefined && resizeElements[0] !== '?') {
                return resizeElements[0];
            } else {
                throw new Error(`resize first element: ${resizeElements[0]} not meme expression`);
            }
        }

        // if resize has numbers 
        let resizeOutput: Resize | undefined = undefined;
        while (resizeElements.length > 0) {
            const oneResizeIndex = 3;
            const iterationResize = resizeElements.splice(0,oneResizeIndex);

            const expr = iterationResize[0];
            const width = iterationResize[1];
            const height = iterationResize[2];

            if (expr === undefined || width === undefined || height === undefined) {
                assert.fail("expr, width, or height are undefined");
            }
            if (typeof expr === "number" || expr === '?') {
                assert.fail("expr is a number or question mark");
            }
            if ((typeof width !== "number" && width !== '?') || (typeof height !== "number" && height !== '?')) {
                assert.fail("width or height are not numbers or question marks");
            }
            
            resizeOutput = new Resize(expr, width, height);

            if (resizeElements.length === 0) break;

            // add resizeOutput for the next iteration
            resizeElements.unshift(resizeOutput);
        }

        return resizeOutput ?? assert.fail("resize was never assigned");

    // PRIMITIVE
    } else if (parseTree.name === ExpressionGrammar.Primitive) {
        // filename | caption | '(' expression ')';
        for (const child of parseTree.children) {
            if ([ExpressionGrammar.Filename, ExpressionGrammar.Caption, ExpressionGrammar.Expression].includes(child.name)) {
                return makeAbstractSyntaxTree(child);
            }
        }
        // shouldn't get here
        assert.fail("Primitive has no meaningful child");
    
    // FILENAME
    } else if (parseTree.name === ExpressionGrammar.Filename) {
        // filename ::= [A-Za-z0-9./][A-Za-z0-9./_-]*;
        return new FileName(parseTree.text.trim());
    
    // CAPTION
    } else if (parseTree.name === ExpressionGrammar.Caption) {
        // caption ::= '"' [^"\\n]* '"'
        return new Caption(parseTree.text.slice(1,-1)); // removing the double quotes at the start and end
    
    // ERROR
    } else {
        assert.fail(`cannot make AST for ${ExpressionGrammar[parseTree.name]} node`);
    }
}
