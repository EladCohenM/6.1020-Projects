/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import process from 'node:process';
import { Board } from './board.ts';
import { WebServer } from './server.ts';

/**
 * Start a game server using the given arguments.
 * 
 * PS4 instructions: you are advised *not* to modify this file.
 * 
 * Command-line usage:
 *     npm start PORT FILENAME
 * where:
 * 
 *   - PORT is an integer that specifies the server's listening port number,
 *     0 specifies that a random unused port will be automatically chosen.
 *   - FILENAME is the path to a valid board file, which will be loaded as
 *     the starting game board.
 * 
 * For example, to start a web server on a randomly-chosen port using the
 * board in `boards/hearts.txt`:
 *     npm start 0 boards/hearts.txt
 * 
 * @throws Error (in a rejected promise) if an error occurs parsing a file or starting a server
 */
async function main(): Promise<void> {
    const [portString, filename]
        = process.argv.slice(2); // skip the first two arguments
                                 // (argv[0] is node executable file, argv[1] is this script)
    if (portString === undefined) { throw new Error('missing PORT'); }
    const port = parseInt(portString);
    if (isNaN(port) || port < 0) { throw new Error('invalid PORT'); }
    if (filename === undefined) { throw new Error('missing FILENAME'); }

    const board = await Board.parseFromFile(filename);
    const server = new WebServer(board, port);
    await server.start();
}

await main();
