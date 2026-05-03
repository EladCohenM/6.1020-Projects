/* Copyright (c) 2021-25 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { Board, Cell, CardState } from '../src/board.ts';


/**
 * Tests for the Board abstract data type.
 */
describe('Board', function() {
    
    // Testing strategy:
    //  cover all subdomains
    // parseFromFile():
    //  partition on input: valid board, invalid board
    // getCell():
    //  partition on location: inside - not edge, inside - edge, outside
    //  behavior: returns a defensive copy
    // flip():
    //  partition on player's tracked state before flip:
    //  - player has no tracked prior state
    //  - player has one flipped first card
    //  - player has cleanup pending from a mismatched pair
    //  - player has cleanup pending from a matched pair
    //  partition on cell state:
    //  - empty
    //  - face down
    //  - face up - controlled
    //  - face up - not controlled
    //  partition on match:
    //  - match
    //  - no match
    //  partition on cell location (row, column):
    //  - inside - not edge
    //  - inside - edge
    //  - outside 
    //  partition on player identity:
    //  - same player
    //  - different player
    // mapCards():
    //  partition on the conversion function:
    //  - identity. 
    //  - one-to-one 
    //  - many-to-one
    //  partition on cell existence:
    //  - exists 
    //  - doesn't exist
    //  partition on number of conversions:
    //  - one 
    //  - multiple 
    //  partition on the cell state:
    //  - face down 
    //  - face up uncontrolled
    //  - face up controlled 
    //  partition on async behavior of f:
    //  - resolves immediatelly 
    //  - resolves after waiting
    // waitForChange()/watch():
    //  partition on kind of board change:
    //  - card turns face up
    //  - card turns face down
    //  - card is removed
    //  - card value changes
    //  partition on non-change:
    //  - controller changes only
    //  - failed flip with no visible board change
    //  partition on waiting behavior:
    //  - watch resolves after a change
    //  - watch continues waiting if no change

    // parseFromFile()
    it('parseFromFile(), valid board', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        const cell: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(1,1), cell);
    })

    it('parseFromFile(), invalid board', async function() {
        await assert.rejects(Board.parseFromFile('boards/invalid.txt'));
    })


    // getCell()
    it('getCell(), inside - not edge', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        const rainbowCell: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        const unicornCell: Cell = {
            exists: true,
            card: '🦄',
            state: 'down',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(1,1), rainbowCell);
        assert.deepStrictEqual(board.getCell(0,0), unicornCell);
    })
    
    it('getCell(), inside - edge', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        const cell: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(0,2), cell);
    })
    
    it('getCell(), outside', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        assert.throws( () => { board.getCell(3,3) } )
    })

    it('getCell(), check defensive copy', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        const rainbowCell: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        rainbowCell.controller = 'elad';
        assert.notDeepStrictEqual(board.getCell(1,1), rainbowCell);
    })


    // flip()
    it('flip(), player has no tracked prior state, face down, inside - not edge', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        const cellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        const cellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        }
        assert.deepStrictEqual(board.getCell(1,1), cellBefore);
        await board.flip('elad', 1,1);               
        assert.deepStrictEqual(board.getCell(1,1), cellAfter);
    })
    
    it('flip(), player has no tracked prior state, empty, inside - not edge', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('ron', 1,1);
        await board.flip('ron', 0,2);
        await board.flip('ron', 2,2);
        const cellBefore: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        const cellAfter: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(1,1), cellBefore);
        await assert.rejects(board.flip('elad', 1,1));               
        assert.deepStrictEqual(board.getCell(1,1), cellAfter);          
    })
    
    it('flip(), player has no tracked prior state, face up - not controlled, inside - edge', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('ron', 0,2);
        await board.flip('ron', 0,0);
        const cellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        const cellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        }
        assert.deepStrictEqual(board.getCell(0,2), cellBefore);
        await board.flip('elad', 0,2);
        assert.deepStrictEqual(board.getCell(0,2), cellAfter);             
    })
    
    it('flip(), first flip waits for a card controlled by another player until it is released', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        const controlledByRon: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'ron',
        };

        const controlledByElad: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        };

        await board.flip('ron', 0,2);
        assert.deepStrictEqual(board.getCell(0,2), controlledByRon);
        
        const eladWaiting = board.flip('elad', 0,2);
        await Promise.resolve(); // let watcher register first
        assert.deepStrictEqual(board.getCell(0,2), controlledByRon);

        await board.flip('ron', 0,0); // mismatch, releases control of (0,2)
        await eladWaiting;

        assert.deepStrictEqual(board.getCell(0,2), controlledByElad);             
    })
    
    it('flip(), outside', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await assert.rejects(board.flip('elad', 3, 3));              
    })

    it('flip(), player has one flipped first card, empty', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 1,1);
        await board.flip('elad', 0,2);
        await board.flip('elad', 2,2);
        const emptyCellBefore: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        const emptyCellAfter: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        const firstCellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        }
        const firstCellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(1,1), emptyCellBefore);
        assert.deepStrictEqual(board.getCell(2,2), firstCellBefore);
        await assert.rejects(board.flip('elad', 1,1));               
        assert.deepStrictEqual(board.getCell(1,1), emptyCellAfter);                
        assert.deepStrictEqual(board.getCell(2,2), firstCellAfter);
    })

    it('flip(), player has one flipped first card, face down, match', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 0,2);
        const cellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        const cellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        }
        assert.deepStrictEqual(board.getCell(1,1), cellBefore);
        await board.flip('elad', 1,1);               
        assert.deepStrictEqual(board.getCell(1,1), cellAfter);           
        assert.deepStrictEqual(board.getCell(0,2), cellAfter);           
    })
    
    it('flip(), player has one flipped first card, face down, no match', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 0,2);
        const unicornCellBefore: Cell = {
            exists: true,
            card: '🦄',
            state: 'down',
            controller: undefined,
        }
        const rainbowCellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        const unicornCellAfter: Cell = {
            exists: true,
            card: '🦄',
            state: 'up',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(0,0), unicornCellBefore);
        await board.flip('elad', 0,0);               
        assert.deepStrictEqual(board.getCell(0,0), unicornCellAfter);           
        assert.deepStrictEqual(board.getCell(0,2), rainbowCellAfter);           
    })

    it('flip(), player has one flipped first card, face up - not controlled, no match', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('ron', 0,2);
        await board.flip('ron', 0,0);
        await board.flip('elad', 1,1);               
        const unicornCellBefore: Cell = {
            exists: true,
            card: '🦄',
            state: 'up',
            controller: undefined,
        }
        const unicornCellAfter: Cell = {
            exists: true,
            card: '🦄',
            state: 'up',
            controller: undefined,
        }
        const rainbowCellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(0,0), unicornCellBefore);
        await board.flip('elad', 0,0);               
        assert.deepStrictEqual(board.getCell(0,0), unicornCellAfter);
        assert.deepStrictEqual(board.getCell(1,1), rainbowCellAfter);             
    })

    it('flip(), player has one flipped first card, face up - controlled', async function(){
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('ron', 0,2);
        await board.flip('elad', 1,1);               
        const ronCellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'ron',
        }
        const ronCellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'ron',
        }
        const eladCellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(0,2), ronCellBefore);
        await assert.rejects(board.flip('elad', 0,2));
        assert.deepStrictEqual(board.getCell(0,2), ronCellAfter);
        assert.deepStrictEqual(board.getCell(1,1), eladCellAfter);       
    })

    it('flip(), cleanup-pending mismatch, new first flip turns previous mismatched cards down', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 0,2);
        await board.flip('elad', 0,0);
        const rainbowCellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        const rainbowCellAfter: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        }
        const unicornCellBefore: Cell = {
            exists: true,
            card: '🦄',
            state: 'up',
            controller: undefined,
        }
        const unicornCellAfter: Cell = {
            exists: true,
            card: '🦄',
            state: 'down',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(0,2), rainbowCellBefore);
        assert.deepStrictEqual(board.getCell(0,0), unicornCellBefore);
        await board.flip('elad', 1,1);                              
        assert.deepStrictEqual(board.getCell(0,2), rainbowCellAfter);
        assert.deepStrictEqual(board.getCell(0,0), unicornCellAfter);    
    })

    it('flip(), cleanup-pending match, new first flip removes previous matched pair', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 0,2);
        await board.flip('elad', 1,1);
        const cellBefore: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        }
        const cellAfter: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        }
        assert.deepStrictEqual(board.getCell(0,2), cellBefore);
        assert.deepStrictEqual(board.getCell(1,1), cellBefore);
        await board.flip('elad', 2,2);                              
        assert.deepStrictEqual(board.getCell(0,2), cellAfter);
        assert.deepStrictEqual(board.getCell(1,1), cellAfter); 
    })

    it('flip(), cleanup-pending mismatch, new first flip on empty cell still turns previous mismatched cards down', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 0,2);
        await board.flip('elad', 0,0);

        const rainbowUp: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: undefined,
        };
        const unicornUp: Cell = {
            exists: true,
            card: '🦄',
            state: 'up',
            controller: undefined,
        };
        const rainbowDown: Cell = {
            exists: true,
            card: '🌈',
            state: 'down',
            controller: undefined,
        };
        const unicornDown: Cell = {
            exists: true,
            card: '🦄',
            state: 'down',
            controller: undefined,
        };

        assert.deepStrictEqual(board.getCell(0,2), rainbowUp);
        assert.deepStrictEqual(board.getCell(0,0), unicornUp);

        await board.flip('ron', 1,1);
        await board.flip('ron', 2,2);
        await board.flip('ron', 1,2); // two above are empty
        await assert.rejects(board.flip('elad', 1,1)); // press on empty and see if released the two in the top

        assert.deepStrictEqual(board.getCell(0,2), rainbowDown);
        assert.deepStrictEqual(board.getCell(0,0), unicornDown);
    })

    it('flip(), cleanup-pending match, new first flip on empty cell still removes previous matched pair', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');
        await board.flip('elad', 0,2);
        await board.flip('elad', 1,1);

        const matchedUp: Cell = {
            exists: true,
            card: '🌈',
            state: 'up',
            controller: 'elad',
        };
        const removed: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        };

        assert.deepStrictEqual(board.getCell(0,2), matchedUp);
        assert.deepStrictEqual(board.getCell(1,1), matchedUp);

        await board.flip('ron', 0,0);
        await board.flip('ron', 0,1);
        await board.flip('ron', 2,2); // two above are empty
        await assert.rejects(board.flip('elad', 0,0)); // press on empty and check if released

        assert.deepStrictEqual(board.getCell(0,2), removed);
        assert.deepStrictEqual(board.getCell(1,1), removed);
    })


    // mapCards():
    it('mapCards(), one-to-one function, exists, multiple conversions, face down, resolves immediatlly', async function() {
        const board: Board = await Board.parseFromFile('boards/ab 2x2.txt');
        const CCell: Cell = {
            exists: true,
            card: 'C',
            state: 'down',
            controller: undefined,
        }
        const DCell: Cell = {
            exists: true,
            card: 'D',
            state: 'down',
            controller: undefined,
        }
        await board.mapCards( async (card: string): Promise<string> => { 
            if (card === 'A') return 'C';
            if (card === 'B') return 'D';
            return card;
        } )
        assert.deepStrictEqual(board.getCell(0,0), CCell);
        assert.deepStrictEqual(board.getCell(0,1), DCell);
        assert.deepStrictEqual(board.getCell(1,0), DCell);
        assert.deepStrictEqual(board.getCell(1,1), DCell);
    })
    
    it('mapCards(), identity function, one conversion, face up controlled, resolves after waiting', async function() {
        const board: Board = await Board.parseFromFile('boards/a.txt');
        const ACell: Cell = {
            exists: true,
            card: 'A',
            state: 'up',
            controller: 'elad',
        }
        await board.flip('elad', 0, 0);
        await board.mapCards( async (card: string): Promise<string> => { 
            await new Promise(resolve => setTimeout(resolve, 1));
            return card; } )
        assert.deepStrictEqual(board.getCell(0,0), ACell);
    })

    it('mapCards(), many-to-one function, exists and doesnt exist, face up uncontrolled', async function() {
        const board: Board = await Board.parseFromFile('boards/ab 2x2.txt');
        const CCell: Cell = {
            exists: true,
            card: 'C',
            state: 'up',
            controller: undefined,
        }
        const emptyCell: Cell = {
            exists: false,
            card: 'B',
            state: 'up',
            controller: undefined,
        }
        await board.flip('elad', 1, 0);
        await board.flip('elad', 1, 1); 
        await board.flip('elad', 0, 0); // bottom line doesnt exist anymore
        await board.flip('elad', 0, 1); // face up no control
        await board.mapCards( async (card: string): Promise<string> => { 
            if (card === 'A' || card === 'B') return 'C';
            return card;
        } )
        assert.deepStrictEqual(board.getCell(0,0), CCell);
        assert.deepStrictEqual(board.getCell(0,1), CCell);
        assert.deepStrictEqual(board.getCell(1,0), emptyCell);
        assert.deepStrictEqual(board.getCell(1,1), emptyCell);
    })

    // watchForChange():
    it('watchForChange(), resolves when a card turns up', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');

        const waitingForChange = board.waitForChange();
        await Promise.resolve(); // let watcher register first

        await board.flip('elad', 0, 0);

        await assert.doesNotReject(waitingForChange);

        const expected: Cell = {
            exists: true,
            card: '🦄',
            state: 'up',
            controller: 'elad',
        };
        assert.deepStrictEqual(board.getCell(0,0), expected);
    })

    it('watchForChange(), resolves when cards turn face down', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');

        await board.flip('elad', 0,2);
        await board.flip('elad', 0,0); // mismatch, both up uncontrolled

        const waitingForChange = board.waitForChange();
        await Promise.resolve(); // let watcher register first

        await board.flip('elad', 1,1); // next first flip triggers cleanup, old cards turn down

        await assert.doesNotReject(waitingForChange);
    })

    it('watchForChange(), resolves when matched cards are removed', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');

        await board.flip('elad', 0, 2);
        await board.flip('elad', 1, 1);

        const waitingForChange = board.waitForChange();
        await Promise.resolve(); // let watcher register first

        await board.flip('elad', 2, 2);

        await assert.doesNotReject(waitingForChange);

        const removed: Cell = {
            exists: false,
            card: '🌈',
            state: 'up',
            controller: undefined,
        };
        assert.deepStrictEqual(board.getCell(0,2), removed);
        assert.deepStrictEqual(board.getCell(1,1), removed);
    })

    it('watchForChange(), resolves when mapCards changes card values', async function() {
        const board: Board = await Board.parseFromFile('boards/a.txt');

        const waitingForChange = board.waitForChange();
        await Promise.resolve(); // let watcher register first

        await board.mapCards(async (card: string): Promise<string> => {
            if (card === 'A') return 'C';
            return card;
        });

        await assert.doesNotReject(waitingForChange);

        const expected: Cell = {
            exists: true,
            card: 'C',
            state: 'down',
            controller: undefined,
        };
        assert.deepStrictEqual(board.getCell(0,0), expected);
    })

    it('watchForChange(), continues waiting when only controller changes', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');

        await board.flip('ron', 0,2);
        await board.flip('ron', 0,0); // mismatch, both are now up uncontrolled

        const waitingForChange = board.waitForChange();
        await Promise.resolve(); // let watcher register first

        await board.flip('elad', 0,2); // card already up, only control changes

        const timeout = new Promise<string>(resolve =>
            setTimeout(() => resolve('timed out'), 1)
        );

        const result = await Promise.race([
            waitingForChange.then(() => 'resolved'),
            timeout
        ]);

        assert.strictEqual(result, 'timed out');
    })

    it('watchForChange(), continues waiting after failed flip with no visible board change', async function() {
        const board: Board = await Board.parseFromFile('boards/perfect.txt');

        await board.flip('ron', 1,1);
        await board.flip('ron', 0,2);
        await board.flip('ron', 2,2); // (1,1) and (0,2) removed

        const waitingForChange = board.waitForChange();
        await Promise.resolve(); // let watcher register first

        await assert.rejects(board.flip('elad', 1,1)); // empty cell, failed flip, no visible change

        const result = await Promise.race([
            waitingForChange.then(() => 'resolved'),
            new Promise<string>(resolve => setTimeout(() => resolve('timed out'), 1)),
        ]);

        assert.strictEqual(result, 'timed out');
    })

});


/**
 * Example test case that uses async/await to test an asynchronous function.
 * Feel free to delete this example test.
 * 
 * Note: Mocha does *not* support passing an async function to `describe`.
 * Only pass an async function to individual `it` unit tests.
 */
describe('async test cases', function() {

    it('reads a file asynchronously', async function() {
        const fileContents = (await fs.promises.readFile('boards/ab.txt')).toString();
        assert(fileContents.startsWith('5x5'));
    });
});
