import { FileName, SideGlue, Caption, Resize } from "./expression-impls.ts";
import { Parser, ParseTree, compile, visualizeAsUrl } from 'parserlib';
import { parseExpression } from "./expressionparser.ts";
import assert from 'node:assert';
import { image } from "./commands.ts";
import { ImageLibrary } from "./imagelibrary.ts";
import { parse } from "./expression.ts";

const library = new ImageLibrary('img',
    'boromir.jpg',
    'tech1.png', 'tech2.png', 'tech3.png', 'tech4.png', 'tech5.png', 'tech6.png',
    'blue.png', 'red.png', 'black.png', 'white.png',
    // if you depend on additional images in your tests, add them here
    // keep image files small to ensure Didit can build your repo
);

console.log(parse('"hello'));


