/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import { type Server } from 'node:http';
import express, { type Application } from 'express';
import { StatusCodes } from 'http-status-codes';
import { type Board } from './board.ts';
import * as commands from './commands.ts';

/**
 * HTTP web Memory Scramble game server.
 */
export class WebServer {

    private readonly app: Application;
    private server: Server|undefined;

    // Abstraction function: AF(board, requestedPort, app, server) =
    //   web server providing the protocol documented below (GET /look/<playerId>, etc.) on
    //   requestedPort (or an available port if 0) to observe and modify the shared board board
    // Representation invariant: RI(board, requestedPort, app, server) =
    //   app has the HTTP handlers documented below (GET /look/<playerId>, etc.) using board, and
    //   server != undefined => ( app is the request listener for server, and
    //                            requestedPort != 0 => server.address.port = requestedPort )
    // Safety from rep exposure:
    //   all fields are private, requestedPort is immutable, no express.Application or http.Server
    //   is taken or returned, and concurrent mutation of board by other clients is expected

    /**
     * Make a new web game server using board that listens for connections on port.
     * 
     * @param board shared game board
     * @param requestedPort server port number
     */
    public constructor(
        private readonly board: Board,
        private readonly requestedPort: number
    ) {
        this.app = express();
        this.app.use((request, response, next) => {
            // allow requests from web pages hosted anywhere
            response.set('Access-Control-Allow-Origin', '*');
            next();
        });

        /*
         * GET /look/<playerId>
         * playerId must be a nonempty string of alphanumeric or underscore characters
         * 
         * Response is the board state from playerId's perspective, as described in the PS4 handout.
         */
        this.app.get('/look/:playerId', async(request, response) => {
            const { playerId } = request.params;
            assert(playerId);

            const boardState = await commands.look(this.board, playerId);
            response
            .status(StatusCodes.OK) // 200
            .type('text')
            .send(boardState);
        });

        /*
         * GET /flip/<playerId>/<row>,<column>
         * playerId must be a nonempty string of alphanumeric or underscore characters;
         * row and column must be integers, 0 <= row,column < height,width of board (respectively)
         * 
         * Response is the state of the board after the flip from the perspective of playerId,
         * as described in the PS4 handout.
         */
        this.app.get('/flip/:playerId/:location', async(request, response) => {
            const { playerId, location } = request.params;
            assert(playerId);
            assert(location);

            const [ row, column ] = location.split(',').map( s => parseInt(s) );
            assert(row !== undefined && !isNaN(row));
            assert(column !== undefined && !isNaN(column));

            try {
                const boardState = await commands.flip(this.board, playerId, row, column);
                response
                .status(StatusCodes.OK) // 200
                .type('text')
                .send(boardState);
            } catch (err) {
                response
                .status(StatusCodes.CONFLICT) // 409
                .type('text')
                .send(`cannot flip this card: ${err}`);
            }
        });

        /*
         * GET /replace/<playerId>/<oldcard>/<newcard>
         * playerId must be a nonempty string of alphanumeric or underscore characters;
         * oldcard and newcard must be nonempty strings.
         * 
         * Replaces all occurrences of oldcard with newcard (as card labels) on the board.
         * 
         * Response is the state of the board after the replacement from the perspective of
         * playerId, as described in the PS4 handout.
         */
        this.app.get('/replace/:playerId/:fromCard/:toCard', async(request, response) => {
            const { playerId, fromCard, toCard } = request.params;
            assert(playerId);
            assert(fromCard);
            assert(toCard);

            const f = async (card: string): Promise<string> => card === fromCard ? toCard : card;
            const boardState = await commands.map(this.board, playerId, f);
            response
            .status(StatusCodes.OK) // 200
            .type('text')
            .send(boardState);
        });

        /*
         * GET /watch/<playerId>
         * playerId must be a nonempty string of alphanumeric or underscore characters
         * 
         * Waits until the next time the board changes (defined as any cards turning face up or face
         * down, being removed from the board, or changing from one string to a different string).
         * 
         * Response is the new state of the board from the perspective of playerId, as described
         * in the PS4 handout.
         */
        this.app.get('/watch/:playerId', async(request, response) => {
            const { playerId } = request.params;
            assert(playerId);

            const boardState = await commands.watch(this.board, playerId);
            response
            .status(StatusCodes.OK) // 200
            .type('text')
            .send(boardState);
        });

        /*
         * GET /
         *
         * Response is the game UI as an HTML page.
         */
        this.app.use(express.static('public/'));
    }

    /**
     * Start this server.
     * 
     * @returns (a promise that) resolves when the server is listening
     */
    public start(): Promise<void> {
        const { promise, resolve } = Promise.withResolvers<void>();
        this.server = this.app.listen(this.requestedPort);
        this.server.on('listening', () => {
            console.log(`server now listening at http://localhost:${this.port}`);
            resolve();
        });
        return promise;
    }

    /**
     * @returns the actual port that server is listening at (may be different than the
     *          requestedPort used in the constructor, since if requestedPort = 0 then an
     *          arbitrary available port is chosen);
     *          requires that start() has already been called and completed
     */
    public get port(): number {
        const address = this.server?.address() ?? 'not connected';
        if (typeof(address) === 'string') {
            throw new Error('server is not listening at a port');
        }
        return address.port;
    }

    /**
     * Stop this server. Once stopped, this server cannot be restarted.
     */
     public stop(): void {
        this.server?.close();
        console.log('server stopped');
    }
}
