/* Copyright (c) 2021-2024 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Web interface to the expression system, client side. @module */

import * as commands from './commands.ts';
import { parse } from './expression.ts';
import { ImageLibrary } from './imagelibrary.ts';

/*
 * PS3 instructions: you are free to change this file if you want to add new features
 * or explore beyond the problem set.
 */

const library = new ImageLibrary('img',
  'boromir.jpg',
  'tech1.png', 'tech2.png', 'tech3.png', 'tech4.png', 'tech5.png', 'tech6.png',
  'blue.png', 'red.png', 'black.png', 'white.png',
  // to work with additional images, add them here
  // keep image files small to ensure Didit can build your repo
);

/**
 * @param parent parent DOM element
 * @param tag HTML element tag
 * @param selector single CSS selector, optional
 * @returns asserted first child of parent of type tag matching selector
 */
function findElement<Tag extends keyof HTMLElementTagNameMap>(parent: ParentNode, tag: Tag, selector = ''): HTMLElementTagNameMap[Tag] {
  const element = parent.querySelector<HTMLElementTagNameMap[Tag]>(tag + selector);
  if ( ! element) { throw new Error(`no element ${tag}${selector} in ${parent}`); }
  return element;
}

const input = {
  expression: findElement(document, 'textarea', '#expression'),
  generate: findElement(document, 'button', '#generate'),
};
const output = findElement(document, 'tbody', '#output');

type Row = { input: HTMLTableCellElement, tostring: HTMLTableCellElement, size: HTMLTableCellElement, image: HTMLTableCellElement };

/**
 * @returns DOM elements for showing a new row of output
 */
function makeOutputRow(): Row {
  const template = findElement(document, 'template', '#row-template');
  const row = findElement(document.importNode(template.content, true), 'tr');
  output.prepend(row);
  return {
    input: findElement(row, 'td', '.row-input'),
    tostring: findElement(row, 'td', '.row-tostring'),
    size: findElement(row, 'td', '.row-size'),
    image: findElement(row, 'td', '.row-image'),
  };
}

/**
 * Parse the current input and display its toString, size, and image.
 */
function generateMeme(): void {
  const output = makeOutputRow();
  output.input.textContent = input.expression.value;
  let expression;
  try {
    expression = parse(input.expression.value);
  } catch (err) {
    output.tostring.setAttribute('colspan', '3');
    output.tostring.classList.add('table-warning');
    output.tostring.textContent = 'Error calling parse(..): ' + err;
    return;
  }
  try {
    output.tostring.textContent = expression.toString();
  } catch (err) {
    output.tostring.classList.add('table-danger');
    output.tostring.textContent = 'Error calling toString(): ' + err;
  }
  try {
    output.size.textContent = commands.size(expression, library);
  } catch (err) {
    output.size.classList.add('table-danger');
    output.size.textContent = 'Error calling commands.size(..): ' + err;
  }
  try {
    findElement(output.image, 'img').src = commands.image(expression, library);
  } catch (err) {
    output.image.classList.add('table-danger');
    output.image.textContent = 'Error calling commands.image(..): ' + err;
  }
}

input.generate.addEventListener('click', generateMeme);

window.addEventListener('unload', function() {
  document.cookie = `expr=${JSON.stringify(input.expression.value)};max-age=5`;
});
const saved = new RegExp('expr=(.*)').exec(document.cookie);
if (saved !== null && saved[1] !== undefined) {
  try {
    const expression: unknown = JSON.parse(saved[1]);
    if (typeof expression === 'string') {
      input.expression.value = expression;
      const delayInMilliseconds = 250;
      setTimeout(function() { generateMeme(); }, delayInMilliseconds);
    }
  } catch (err) {
    console.log('Could not restore previous expression');
  }
}
