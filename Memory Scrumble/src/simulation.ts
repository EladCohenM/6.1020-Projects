/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { randomBytes } from 'node:crypto';
import seedrandom from 'seedrandom';
import { Board } from './board.ts';

const seedBytes = 6;

/**
 * Example code for simulating a game.
 * 
 * PS4 instructions: you may use, modify, or remove this file,
 *   completing it is recommended but not required.
 * 
 * @throws Error (in a rejected promise) if an error occurs reading or parsing the board
 */
async function simulationMain(): Promise<void> {
    const filename = 'boards/ab.txt';
    const board: Board = await Board.parseFromFile(filename);
    const size = 5;
    const players = 1;
    const tries = 10;
    const maxDelayMs = 100;

    // seed the pseudorandom number generator with a value that is logged to the console
    const seed = randomBytes(seedBytes).toString('base64');
    // const seed = "..."; // to replay a generated sequence, hard-code its seed value
    const random = seedrandom(seed);

    console.log('simulation', { filename, size, players, tries, maxDelayMs, seed });

    /**
     * @param max positive integer upper bound
     * @returns pseudorandom integer >= 0 and < max
     */
    function randomInt(max: number): number {
        return Math.floor(random() * max);
    }

    // start up one or more players as concurrent asynchronous function calls
    const playerPromises: Array<Promise<void>> = [];
    for (let ii = 0; ii < players; ++ii) {
        playerPromises.push(player(ii));
    }
    // wait for all the players to finish (unless one throws an exception)
    await Promise.all(playerPromises);

    /**
     * @param playerNumber player to simulate repeatedly flipping pseudorandom cards
     */
    async function player(playerNumber: number): Promise<void> {
        // TODO set up this player on the board if necessary

        for (let jj = 0; jj < tries; ++jj) {
            try {
                await timeout(randomInt(maxDelayMs));
                // TODO try to flip over a first card at (randomInt(size), randomInt(size))
                //      which might wait until this player can control that card

                await timeout(randomInt(maxDelayMs));
                // TODO and if that succeeded,
                //      try to flip over a second card at (randomInt(size), randomInt(size))
            } catch (err) {
                console.error('attempt to flip a card failed:', err);
            }
        }
    }
}

/**
 * @param milliseconds duration to wait
 * @returns a promise that fulfills no less than `milliseconds` after timeout() was called
 */
async function timeout(milliseconds: number): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, milliseconds);
    return promise;
}

void simulationMain();
