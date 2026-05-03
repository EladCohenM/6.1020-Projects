/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

/** Memory Scramble game board. @module */

import assert from 'node:assert';
import fs from 'node:fs';

// HELPER DATA STRUCTURES
export type Position = [number, number];
export type CardState = 'up' | 'down';
export interface Cell {
    exists: boolean,
    card: string,
    state: CardState,
    controller: string | undefined,
}
type CellKey = `${number},${number}`;
export type PlayerState =
    | { kind: 'one-flipped', firstCard: CellKey }
    | { kind: 'cleanup-pending', cards: [CellKey, CellKey] };
type Waiter = {
    promise: Promise<void>;
    resolve: () => void;
}; 

/**
 * Board represents a mutable rectangular grid of fixed dimensions.
 * Each cell is either empty or contains a card.
 * Each card on the board is either face up or face down.
 * A face-up card may or may not be controlled by a player.
 */
export class Board {

    private readonly cells: Map<CellKey, Cell> = new Map();
    private readonly playersStatus: Map<string, PlayerState> = new Map();
    private readonly waiters: Map<CellKey, Array<Waiter>>;
    private readonly changeWatchers: Array<Waiter> = [];

    // Abstraction function:
    //  AF(width, height, cells, playersStatus) = a Memory Scramble board of size height x width.
    //      For each valid location key "row,column", cells maps that location to the state of the cell there:
    //      either an empty cell, or a card with its content, face-up/face-down state, and controller.
    //      If a player ID appears in playersStatus, then playersStatus maps that player ID to a list of one or two
    //      location keys for cards previously flipped by that player. If a player currently control no cards they would be 
    //      deleted from playersStatus.
    //      A list of length 1 means the player has flipped a first card and is waiting to flip a second card.
    //      A list of length 2 means the player completed a previous move and those two cards still matter for cleanup.
    // Representation invariant:
    //  - width > 0 and height > 0
    //  - number of cells is equal to width * height
    //  - every key in cells has the form "row,column" for a valid board location
    //  - a card can't face down and have a player as controller
    //  - every location key stored in playersStatus is a key in cells
    //  - a player appears in playersStatus iff that player currently has tracked state on the board
    //  - if a player has a card in their PlayerState as firstCard or in cards, then the card must have that player as the controller
    // Safety from rep exposure:
    //  - width and height are primitive immutable values and are not reassigned
    //  - cells and playersStatus are private and readonly
    //  - getCell returns a defensive copy of the cell rather than the internal Cell object
    //  - any functions that have mutable parameters never directly store mutable inputs, but rather copying them
    
    private constructor (
        private readonly width:number,
        private readonly height: number,
        listOfCards: Array<string>
    ) {
        let index = 0;
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column ++) {
                this.cells.set(
                    `${row},${column}`,
                    {
                        exists: true,
                        card: listOfCards[index++] ?? assert.fail("missing card"), 
                        state: 'down',
                        controller: undefined
                    } 
                ); 
            }
        }

        this.waiters = new Map<CellKey, Array<Waiter>>();

        this.checkRep();
    } 

    /** assert rep invariant */
    private checkRep(): void {
        // width > 0 and height > 0
        assert(this.width > 0, "width is 0 or less");
        assert(this.height > 0, "height is 0 or less");

        // number of cells is equal to width * height
        assert.strictEqual(this.cells.size, this.width * this.height, "number of cells is not equal to width * height");

        // every key in cells has the form "row,column" for a valid board location
        for (const [key, cell] of this.cells) {
            // check it has only row and column
            const parts = key.split(',');
            assert.strictEqual(parts.length, 2, "invalid cell key format");

            // check they are both integers and in bounds
            const row = Number(parts[0]);
            const column = Number(parts[1]);

            assert(Number.isInteger(row), 'row is not an integer');
            assert(Number.isInteger(column), 'column is not an integer');
            assert(row >= 0 && row < this.height, 'row is out of bounds');
            assert(column >= 0 && column < this.width, 'column is out of bounds');

            if (cell.state === 'down') {
                assert(cell.controller === undefined, 'card face down and has controller');
            }
        }

        // every location key stored in playersStatus is a key in cells
        for (const playerState of this.playersStatus.values()) {
            if (playerState.kind === 'one-flipped') {
                assert(this.cells.has(playerState.firstCard));
            } else {
                assert(this.cells.has(playerState.cards[0]));
                assert(this.cells.has(playerState.cards[1]));
            }
        }

        // a player appears in playersStatus iff that player currently has tracked state on the board
        for (const [player, playerState] of this.playersStatus.entries()) {
            if (playerState.kind === 'one-flipped') {
                const cell = this.cells.get(playerState.firstCard) ?? assert.fail('missing firstCard');
                assert(cell.exists, 'firstCard does not exist on board');
                assert(cell.controller === player, 'firstCard is not controlled by the player');
            } else {
                for (const key of playerState.cards) {
                    const cell = this.cells.get(key) ?? assert.fail('missing cleanup card');
                    assert(cell.exists || cell.controller === undefined,
                        'removed card should not still be controlled');

                    if (cell.exists && cell.controller !== undefined) {
                        assert(cell.controller === player,
                            'cleanup-pending card is controlled by the wrong player');
                    }
                }
            }
        }
    }

    /**
     * returns a copy of the inspected cell
     * @param row vertical location of the cell
     * @param column horizontal location of the cell
     * @returns a defensive copy of the cell in location (row, column)
     */
    public getCell(row: number, column: number): Cell {
        this.checkRep();
        const card = this.cells.get(`${row},${column}`) ?? assert.fail("card is not in cells");
        return {
            exists: card.exists,
            card: card.card,
            state: card.state,
            controller: card.controller
        };
    }

    /**
     * tries to reveal the card in location (row, column)
     * @param player the flipping player id
     * @param row vertical location of the cell
     * @param column horizontal location of the cell
     * @returns Promise to flip the card in the cell
     */
    public async flip(player: string, row: number, column: number): Promise<void> {
        
        const cellKey: CellKey = `${row},${column}`;
        // Rule 1-A: first flip on empty cell fails
        const cellToFlip: Cell = this.cells.get(cellKey) ?? assert.fail(`cell ${cellKey} doesn't exist`); 

        // Rule 3-A / 3-B: before a new first flip, clean up the player's previous move if needed
        if (this.playersStatus.has(player)) {
            const playerState: PlayerState = this.playersStatus.get(player) ?? assert.fail('no player');
            // Rule 2: the player is attempting a second flip
            if (playerState.kind === 'one-flipped') {
                const playerCell = this.cells.get(playerState.firstCard) ?? assert.fail('player cell doesnt exist');

                // Rule 2-A / 2-B: second flip fails on empty cell or controlled card,
                // and the player relinquishes control of the first card
                if (!cellToFlip.exists || cellToFlip.controller !== undefined) {
                    playerCell.controller = undefined;
                    this.releaseOneWaiter(playerState.firstCard);
                    this.playersStatus.delete(player);
                    throw new Error("can't flip, card is missing or controlled by another player");
                }

                // can flip
                this.playersStatus.set(
                    player, 
                    {
                        kind: 'cleanup-pending',
                        cards: [playerState.firstCard, cellKey]
                    }
                );
                // Rule 2-C: if the second card is face down, turn it face up
                const wasDown = cellToFlip.state === 'down';
                cellToFlip.state = 'up';
                    // down -> up
                if (wasDown) this.notifyChange();
                
                // Rule 2-D / 2-E: keep control on match, relinquish control on mismatch
                if (cellToFlip.card === playerCell.card) {
                    cellToFlip.controller = player; // player cell already has player as controller
                } else {
                    playerCell.controller = undefined; // cell to flip already has undefined controller
                    this.releaseOneWaiter(playerState.firstCard);
                }
            } 
            
            // Rule 3-A / 3-B: on the next attempted first flip, perform pending cleanup first
            else if (playerState.kind === 'cleanup-pending') {
                this.cleanup(playerState.cards);
                this.playersStatus.delete(player); 
                return this.flip(player, row, column);
            }
        } 

        // Rule 1: the player is attempting a first flip
        else {
            // Rule 1-A: first flip on empty cell fails
            if (!cellToFlip.exists) throw new Error("can't flip, card is missing");
            
            // Rule 1-D: first flip on a card controlled by another player waits
            else if (cellToFlip.controller !== player && cellToFlip.controller !== undefined) {
                await this.waitForRelease(cellKey);
                return this.flip(player, row, column);
            }
            
            // Rule 1-B / 1-C: take control of a first card, turning it face up if needed
            else {
                cellToFlip.controller = player;
                const wasDown = cellToFlip.state === 'down';
                cellToFlip.state = 'up';
                    // down -> up
                if (wasDown) this.notifyChange();
                this.playersStatus.set(
                    player,
                    { kind: 'one-flipped', firstCard: cellKey }
                );
            }
        }

        this.checkRep();
    }

    /**
     * @param player player id
     * @returns a string that describes the board state from the player perspective 
     */
    public playerBoardState(player: string): string {
        this.checkRep();

        let boardState = '';

        // add dimensions
        boardState += `${this.height}x${this.width}\n`;

        // add lines
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                const cellKey: CellKey = `${row},${column}`;
                const cell = this.cells.get(cellKey) ?? assert.fail('no cell');
                if (!cell.exists) {
                    boardState += 'none\n';
                    continue;
                } else if (cell.state === 'down') {
                    boardState += 'down\n';
                    continue;
                } else if (cell.state === 'up') {
                    if (cell.controller === player) {
                        boardState += `my ${cell.card}\n`;
                    } else {
                        boardState += `up ${cell.card}\n`;
                    }
                } else {
                    assert.fail("shouldn't get here");
                }
            }
        }
        return boardState;
    }

    /**
     * Cleans up the two cards from a player's previous completed move.
     *
     * Precondition:
     * - keys are the two cell keys stored in a cleanup-pending PlayerState
     * - each key is a valid key in cells
     *
     * Postcondition:
     * - if both referenced cards are still on the board, face up, and uncontrolled,
     *   they are turned face down
     * - if both referenced cards are still on the board and controlled by the same player,
     *   they are removed from the board and relinquish control
     * - this method does not modify playersStatus
     *
     * @param keys keys of the two cells to clean up
     */
    private cleanup(keys: [CellKey, CellKey]): void {
        const [key1, key2] = keys;
        const cell1 = this.cells.get(key1) ?? assert.fail();
        const cell2 = this.cells.get(key2) ?? assert.fail();
        
        // Rule 3-B: previous mismatched cards turn face down if still uncontrolled
        if (cell1.controller === undefined && cell2.controller === undefined) {
            [cell1.state, cell2.state] = ['down', 'down'];
            // up -> down
            this.notifyChange();
            this.releaseOneWaiter(key1);
            this.releaseOneWaiter(key2);

        // Rule 3-A: previous matched pair is removed from the board
        } else if (cell1.controller === cell2.controller) {
            [cell1.exists, cell2.exists] = [false, false];
            // exists: true -> false
            this.notifyChange();
            [cell1.controller, cell2.controller] = [undefined, undefined];
            this.releaseOneWaiter(key1);
            this.releaseOneWaiter(key2);
        }
        this.checkRep();
    }

    /**
     * Registers a waiting first-flip attempt for the given cell.
     * A caller uses the returned promise to wait until one blocked player may
     * try again to flip this cell as a first card.
     * @param cellKey key of a cell currently controlled by another player
     * @returns a promise that resolves when one waiter for this cell is released
     */
    private waitForRelease(cellKey: CellKey): Promise<void> {
        const { promise, resolve } = Promise.withResolvers<void>();
        const waiter: Waiter = { promise, resolve };

        const queue = this.waiters.get(cellKey) ?? [];
        queue.push(waiter);
        this.waiters.set(cellKey, queue);

        return promise;
    }

    /**
     * Releases one player waiting to try this cell again.
     * If one or more first-flip attempts are waiting on this cell, resolves the
     * oldest stored waiter for that cell. If no players are waiting, does nothing.
     * @param cellKey key of the cell whose next waiter should be released
     */
    private releaseOneWaiter(cellKey: CellKey): void {
        const queue = this.waiters.get(cellKey);
        if (queue === undefined || queue.length === 0) {
            return;
        }

        const next = queue.shift();
        next?.resolve();
        if (queue.length === 0) {
            this.waiters.delete(cellKey);
        } else {
            this.waiters.set(cellKey, queue);
        }
    }
    
    /**
     * Make a new board by parsing a file.
     * 
     * PS4 instructions: the specification of this method may not be changed.
     * 
     * @param filename path to game board file
     * @returns (a promise for) a new board with the size and cards from the file
     * @throws Error (in a rejected promise) if the file cannot be read or is not a valid game board
     */
    public static async parseFromFile(filename: string): Promise<Board> {
        const file = await fs.promises.readFile(filename, 'utf-8');
        const lines: Array<string> = file.split(/\r?\n/);
        while (lines.length > 0 && lines[lines.length - 1] === '') {
            lines.pop();
        }
        const dimensions = lines.shift();
        if (dimensions === undefined) {
            throw new Error('invalid game board');
        }

        const match = /^(\d+)x(\d+)$/.exec(dimensions);
        if (match === null) {
            throw new Error('invalid game board');
        }

        // ROW x COLUMN
        const height = Number.parseInt(match[1] ?? '', 10);
        const width = Number.parseInt(match[2] ?? '', 10);
        const expectedCards = width * height;
        if (width <= 0 || height <= 0 || lines.length !== expectedCards || lines.some(card => card.length === 0)) {
            throw new Error('invalid game board');
        }

        return new Board(width, height, lines);
    }

    /**
     * Go over all cards and convert their value according to a function 
     * @param f a function to convert a card to another card
     */
    public async mapCards(f: (card: string) => Promise<string>): Promise<void> {
        // list of distinct cards that exist on the board
        const distinctCardsStrings: Set<string> = new Set();
        for (const cell of this.cells.values()) {
            if (cell.exists) {
                distinctCardsStrings.add(cell.card);
            }
        }
        // dictionary for conversion
        const oldNewMatching: Map<string, string> = new Map();
        for (const oldCard of distinctCardsStrings) {
            oldNewMatching.set(oldCard, await f(oldCard));
        }
        // converting all cards on the board
        for (const cell of this.cells.values()) {
            if (cell.exists) {
                const [oldCard, newCard] = [cell.card, oldNewMatching.get(cell.card) ?? assert.fail('no matching')];
                cell.card = newCard;
                // cell.card -> different value
                if (oldCard !== newCard) this.notifyChange();
            }
        }
        this.checkRep();
    }

    /**
     * create a promise that resolves when the board next changes
     * @returns a promise that resolves when the board next changes
     */
    public waitForChange(): Promise<void> {
        const { promise, resolve } = Promise.withResolvers<void>();
        const watcher: Waiter = { promise, resolve };
        this.changeWatchers.push(watcher);
        return promise;
    }

    // changes to notify are: down -> up, up -> down, exists: true -> false, cell.card -> different value
    /**
     * notify for a change in the board
     */
    private notifyChange(): void {
        this.changeWatchers.forEach(waiter => waiter.resolve());
        this.changeWatchers.length = 0; // empty the watchers list
    }
}
