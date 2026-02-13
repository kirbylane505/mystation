/**
 * KICKBACK LOUNGE — Slides & Ladders Game Logic
 * Server-authoritative: dice rolls on server
 *
 * Rules:
 * - 2-4 players, turn-based
 * - Roll 1 die, move that many spaces
 * - Land on ladder bottom → climb to top
 * - Land on slide top → slide down to bottom
 * - Exact landing on 100 required to win (bounce back on overshoot)
 * - Roll a 6 → bonus roll
 */

import { LADDERS, SLIDES } from './constants';
import { rollDice } from './deck';

/**
 * Initialize a new Slides & Ladders game
 * @param {string[]} playerIds - 2-4 player IDs
 * @returns {object} initial game state
 */
export function initSlidesLadders(playerIds) {
  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new Error('Slides & Ladders requires 2-4 players');
  }

  const positions = {};
  for (const pid of playerIds) {
    positions[pid] = 0; // off the board, enter on first roll
  }

  return {
    gameType: 'slidesLadders',
    positions,
    playerOrder: [...playerIds],
    currentTurnIndex: 0,
    phase: 'playing', // playing, finished
    winner: null,
    lastRoll: null,
    lastMove: null,
    moveHistory: [],
    turnCount: 0,
  };
}

/**
 * Apply a dice roll move
 * @param {object} state - current game state
 * @param {string} playerId - who rolled
 * @returns {{ state: object, valid: boolean, error?: string, moveDetails?: object }}
 */
export function applySlidesLaddersMove(state, playerId) {
  if (state.phase !== 'playing') {
    return { state, valid: false, error: 'Game is finished' };
  }

  const currentPlayerId = state.playerOrder[state.currentTurnIndex];
  if (currentPlayerId !== playerId) {
    return { state, valid: false, error: 'Not your turn' };
  }

  // Roll 1 die (server-side secure)
  const [diceValue] = rollDice(1);

  const oldPos = state.positions[playerId];
  let newPos = oldPos + diceValue;

  // Must land exactly on 100
  if (newPos > 100) {
    newPos = 100 - (newPos - 100); // bounce back
  }

  // Check ladders
  let ladder = null;
  if (LADDERS[newPos]) {
    ladder = { from: newPos, to: LADDERS[newPos] };
    newPos = LADDERS[newPos];
  }

  // Check slides
  let slide = null;
  if (SLIDES[newPos]) {
    slide = { from: newPos, to: SLIDES[newPos] };
    newPos = SLIDES[newPos];
  }

  const moveDetails = {
    playerId,
    diceValue,
    from: oldPos,
    to: newPos,
    ladder,
    slide,
    bonusRoll: diceValue === 6,
  };

  const newState = {
    ...state,
    positions: { ...state.positions, [playerId]: newPos },
    lastRoll: diceValue,
    lastMove: moveDetails,
    moveHistory: [...state.moveHistory, moveDetails],
    turnCount: state.turnCount + 1,
  };

  // Check win condition
  if (newPos === 100) {
    newState.phase = 'finished';
    newState.winner = playerId;
    return { state: newState, valid: true, moveDetails };
  }

  // Advance to next player (unless rolled a 6 = bonus roll)
  if (diceValue !== 6) {
    newState.currentTurnIndex =
      (state.currentTurnIndex + 1) % state.playerOrder.length;
  }
  // If rolled 6, same player goes again (currentTurnIndex stays)

  return { state: newState, valid: true, moveDetails };
}

/**
 * Sanitize state for client — Slides & Ladders has no hidden info
 */
export function sanitizeSlidesLaddersState(state) {
  return {
    gameType: 'slidesLadders',
    positions: state.positions,
    playerOrder: state.playerOrder,
    currentTurnIndex: state.currentTurnIndex,
    currentPlayerId: state.playerOrder[state.currentTurnIndex],
    phase: state.phase,
    winner: state.winner,
    lastRoll: state.lastRoll,
    lastMove: state.lastMove,
    turnCount: state.turnCount,
  };
}
