/**
 * KICKBACK LOUNGE — Dominoes Game Logic
 * Server-authoritative: draw & play validated on server
 *
 * Rules (Draw Game / Block Game):
 * - 28 double-six tiles (0-0 through 6-6)
 * - 2 players: 7 tiles each | 3-4 players: 5 tiles each
 * - Remaining tiles go to boneyard (draw pile)
 * - Player with highest double goes first
 * - Must match one open end of the chain
 * - Can't play → draw from boneyard (if any left)
 * - Can't play + no boneyard → pass
 * - Win by emptying hand OR lowest pip count when all blocked
 */

import { shuffleDeck } from './deck';

/**
 * Generate full double-six domino set (28 tiles)
 */
function generateDominoes() {
  const tiles = [];
  let id = 0;
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push({ id: id++, a, b });
    }
  }
  return tiles;
}

/**
 * Shuffle tiles using Fisher-Yates
 */
function shuffleTiles(tiles) {
  const arr = [...tiles];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculate pip count for a hand
 */
function pipCount(hand) {
  return hand.reduce((sum, tile) => sum + tile.a + tile.b, 0);
}

/**
 * Check if a tile can be played on either end
 */
function canPlay(tile, leftEnd, rightEnd) {
  return (
    tile.a === leftEnd || tile.b === leftEnd ||
    tile.a === rightEnd || tile.b === rightEnd
  );
}

/**
 * Initialize a new Dominoes game
 * @param {string[]} playerIds - 2-4 player IDs
 * @returns {object} initial game state
 */
export function initDominoes(playerIds) {
  if (playerIds.length < 1 || playerIds.length > 4) {
    throw new Error('Dominoes requires 1-4 players');
  }

  const tiles = shuffleTiles(generateDominoes());
  const tilesPerPlayer = playerIds.length <= 2 ? 7 : 5;

  const hands = {};
  let idx = 0;
  for (const pid of playerIds) {
    hands[pid] = tiles.slice(idx, idx + tilesPerPlayer);
    idx += tilesPerPlayer;
  }

  const boneyard = tiles.slice(idx);

  // Find who has the highest double to go first
  let firstPlayer = 0;
  let highestDouble = -1;
  for (let i = 0; i < playerIds.length; i++) {
    for (const tile of hands[playerIds[i]]) {
      if (tile.a === tile.b && tile.a > highestDouble) {
        highestDouble = tile.a;
        firstPlayer = i;
      }
    }
  }

  return {
    gameType: 'dominoes',
    hands,
    boneyard,
    chain: [], // played tiles in order
    leftEnd: null,  // open left end value
    rightEnd: null, // open right end value
    playerOrder: [...playerIds],
    currentTurnIndex: firstPlayer,
    phase: 'playing',
    winner: null,
    lastPlay: null,
    passCount: 0, // consecutive passes
    moveHistory: [],
    turnCount: 0,
  };
}

/**
 * Apply a dominoes move
 * @param {object} state - current game state
 * @param {string} playerId - who is playing
 * @param {string} action - 'play', 'draw', or 'pass'
 * @param {object} data - { tileId, end } for play moves (end: 'left' or 'right')
 * @returns {{ state: object, valid: boolean, error?: string, moveDetails?: object }}
 */
export function applyDominoesMove(state, playerId, action, data = {}) {
  if (state.phase !== 'playing') {
    return { state, valid: false, error: 'Game is finished' };
  }

  const currentPlayerId = state.playerOrder[state.currentTurnIndex];
  if (currentPlayerId !== playerId) {
    return { state, valid: false, error: 'Not your turn' };
  }

  const hand = state.hands[playerId];

  if (action === 'draw') {
    // Draw from boneyard
    if (state.boneyard.length === 0) {
      return { state, valid: false, error: 'Boneyard is empty — you must pass' };
    }

    // Check if player can already play (can't draw if you can play)
    if (state.chain.length > 0) {
      const canPlayAny = hand.some(t => canPlay(t, state.leftEnd, state.rightEnd));
      if (canPlayAny) {
        return { state, valid: false, error: 'You have a playable tile — must play it' };
      }
    }

    const drawn = state.boneyard[0];
    const newBoneyard = state.boneyard.slice(1);
    const newHand = [...hand, drawn];

    const moveDetails = {
      playerId,
      action: 'draw',
      drawnTile: drawn,
    };

    const newState = {
      ...state,
      hands: { ...state.hands, [playerId]: newHand },
      boneyard: newBoneyard,
      lastPlay: moveDetails,
      passCount: 0,
      moveHistory: [...state.moveHistory, moveDetails],
      turnCount: state.turnCount + 1,
    };

    // Don't advance turn — player gets to play after drawing
    // But check if drawn tile is playable
    const canPlayDrawn = state.chain.length === 0 || canPlay(drawn, state.leftEnd, state.rightEnd);
    const canPlayAnyNow = newHand.some(t =>
      state.chain.length === 0 || canPlay(t, state.leftEnd, state.rightEnd)
    );

    // If still can't play and boneyard empty, auto-pass next
    if (!canPlayAnyNow && newBoneyard.length === 0) {
      // Auto-advance to next player
      newState.currentTurnIndex = (state.currentTurnIndex + 1) % state.playerOrder.length;
      newState.passCount = 1;
    }
    // Otherwise, stay on same player so they can play

    return { state: newState, valid: true, moveDetails };
  }

  if (action === 'pass') {
    // Can only pass if boneyard is empty AND no playable tiles
    if (state.boneyard.length > 0) {
      return { state, valid: false, error: 'Must draw from boneyard first' };
    }

    if (state.chain.length > 0) {
      const canPlayAny = hand.some(t => canPlay(t, state.leftEnd, state.rightEnd));
      if (canPlayAny) {
        return { state, valid: false, error: 'You have a playable tile — must play it' };
      }
    }

    const moveDetails = { playerId, action: 'pass' };
    const newPassCount = state.passCount + 1;

    const newState = {
      ...state,
      currentTurnIndex: (state.currentTurnIndex + 1) % state.playerOrder.length,
      lastPlay: moveDetails,
      passCount: newPassCount,
      moveHistory: [...state.moveHistory, moveDetails],
      turnCount: state.turnCount + 1,
    };

    // If all players passed in a row, game is blocked
    if (newPassCount >= state.playerOrder.length) {
      newState.phase = 'finished';
      // Winner is player with lowest pip count
      let lowestPips = Infinity;
      let winner = null;
      for (const pid of state.playerOrder) {
        const pips = pipCount(state.hands[pid]);
        if (pips < lowestPips) {
          lowestPips = pips;
          winner = pid;
        }
      }
      newState.winner = winner;
      // Build results for each player
      newState.results = {};
      for (const pid of state.playerOrder) {
        newState.results[pid] = {
          outcome: pid === winner ? 'win' : 'loss',
          reason: pid === winner ? 'Lowest pip count' : 'Blocked game',
          pips: pipCount(state.hands[pid]),
        };
      }
    }

    return { state: newState, valid: true, moveDetails };
  }

  if (action === 'play') {
    const { tileId, end } = data;

    // Find tile in hand
    const tileIdx = hand.findIndex(t => t.id === tileId);
    if (tileIdx === -1) {
      return { state, valid: false, error: 'Tile not in your hand' };
    }

    const tile = hand[tileIdx];

    // First tile played
    if (state.chain.length === 0) {
      const newHand = hand.filter((_, i) => i !== tileIdx);
      const moveDetails = {
        playerId,
        action: 'play',
        tile,
        end: 'right',
      };

      const newState = {
        ...state,
        hands: { ...state.hands, [playerId]: newHand },
        chain: [{ ...tile, orientation: 'initial' }],
        leftEnd: tile.a,
        rightEnd: tile.b,
        currentTurnIndex: (state.currentTurnIndex + 1) % state.playerOrder.length,
        lastPlay: moveDetails,
        passCount: 0,
        moveHistory: [...state.moveHistory, moveDetails],
        turnCount: state.turnCount + 1,
      };

      // Check if hand empty — winner!
      if (newHand.length === 0) {
        newState.phase = 'finished';
        newState.winner = playerId;
        newState.results = {};
        for (const pid of state.playerOrder) {
          const pips = pid === playerId ? 0 : pipCount(state.hands[pid]);
          newState.results[pid] = {
            outcome: pid === playerId ? 'win' : 'loss',
            reason: pid === playerId ? 'Played all tiles' : 'Opponent went out',
            pips,
          };
        }
      }

      return { state: newState, valid: true, moveDetails };
    }

    // Subsequent plays — must specify end
    const playEnd = end || 'right';
    const targetValue = playEnd === 'left' ? state.leftEnd : state.rightEnd;

    // Check if tile matches
    if (tile.a !== targetValue && tile.b !== targetValue) {
      return { state, valid: false, error: `Tile [${tile.a}|${tile.b}] doesn't match ${playEnd} end (${targetValue})` };
    }

    // Orient tile: the matching value faces the chain
    let orientedTile;
    if (playEnd === 'left') {
      // Playing on left — matching value goes right (facing chain)
      if (tile.b === targetValue) {
        orientedTile = { ...tile }; // b faces chain, a becomes new left end
      } else {
        orientedTile = { ...tile, a: tile.b, b: tile.a }; // swap
      }
    } else {
      // Playing on right — matching value goes left (facing chain)
      if (tile.a === targetValue) {
        orientedTile = { ...tile }; // a faces chain, b becomes new right end
      } else {
        orientedTile = { ...tile, a: tile.b, b: tile.a }; // swap
      }
    }

    const newHand = hand.filter((_, i) => i !== tileIdx);
    const newChain = playEnd === 'left'
      ? [orientedTile, ...state.chain]
      : [...state.chain, orientedTile];

    const newLeftEnd = playEnd === 'left' ? orientedTile.a : state.leftEnd;
    const newRightEnd = playEnd === 'right' ? orientedTile.b : state.rightEnd;

    const moveDetails = {
      playerId,
      action: 'play',
      tile: { id: tile.id, a: tile.a, b: tile.b },
      end: playEnd,
      newLeftEnd,
      newRightEnd,
    };

    const newState = {
      ...state,
      hands: { ...state.hands, [playerId]: newHand },
      chain: newChain,
      leftEnd: newLeftEnd,
      rightEnd: newRightEnd,
      currentTurnIndex: (state.currentTurnIndex + 1) % state.playerOrder.length,
      lastPlay: moveDetails,
      passCount: 0,
      moveHistory: [...state.moveHistory, moveDetails],
      turnCount: state.turnCount + 1,
    };

    // Check if hand empty — winner!
    if (newHand.length === 0) {
      newState.phase = 'finished';
      newState.winner = playerId;
      newState.results = {};
      for (const pid of state.playerOrder) {
        const pips = pid === playerId ? 0 : pipCount(state.hands[pid]);
        newState.results[pid] = {
          outcome: pid === playerId ? 'win' : 'loss',
          reason: pid === playerId ? 'Played all tiles' : 'Opponent went out',
          pips,
        };
      }
    }

    return { state: newState, valid: true, moveDetails };
  }

  return { state, valid: false, error: `Unknown action: ${action}` };
}

/**
 * Sanitize state for client — hide other players' hands + boneyard
 */
/**
 * AI play for dominoes — picks highest-value playable tile, draws if stuck
 * Returns: { action: 'play'|'draw'|'pass', tileId?, end? }
 */
export function aiPlay(state, playerId) {
  const hand = state.hands[playerId];
  if (!hand || hand.length === 0) return { action: 'pass' };

  // First tile — play the highest double, or highest pip tile
  if (state.chain.length === 0) {
    const doubles = hand.filter(t => t.a === t.b).sort((a, b) => b.a - a.a);
    const tile = doubles.length > 0 ? doubles[0] : hand.sort((a, b) => (b.a + b.b) - (a.a + a.b))[0];
    return { action: 'play', tileId: tile.id, end: 'right' };
  }

  // Find all playable tiles
  const playable = [];
  for (const tile of hand) {
    if (tile.a === state.leftEnd || tile.b === state.leftEnd) {
      playable.push({ tile, end: 'left', value: tile.a + tile.b });
    }
    if (tile.a === state.rightEnd || tile.b === state.rightEnd) {
      // Avoid duplicate if both ends match the same tile
      if (!playable.find(p => p.tile.id === tile.id)) {
        playable.push({ tile, end: 'right', value: tile.a + tile.b });
      } else {
        // Also playable on right — pick the end that gives better value
        playable.push({ tile, end: 'right', value: tile.a + tile.b });
      }
    }
  }

  if (playable.length > 0) {
    // Sort by highest pip value first (dump high-value tiles early)
    playable.sort((a, b) => b.value - a.value);
    const best = playable[0];
    return { action: 'play', tileId: best.tile.id, end: best.end };
  }

  // No playable tile — draw from boneyard if available
  if (state.boneyard.length > 0) {
    return { action: 'draw' };
  }

  // No boneyard — pass
  return { action: 'pass' };
}

export function sanitizeDominoesState(state, playerId) {
  const handCounts = {};
  for (const pid of state.playerOrder) {
    handCounts[pid] = state.hands[pid]?.length || 0;
  }

  return {
    gameType: 'dominoes',
    myHand: playerId && playerId !== '__broadcast__' ? (state.hands[playerId] || []) : [],
    handCounts,
    boneyardCount: state.boneyard.length,
    chain: state.chain,
    leftEnd: state.leftEnd,
    rightEnd: state.rightEnd,
    playerOrder: state.playerOrder,
    currentTurnIndex: state.currentTurnIndex,
    currentPlayerId: state.playerOrder[state.currentTurnIndex],
    phase: state.phase,
    winner: state.winner,
    results: state.results || null,
    lastPlay: state.lastPlay,
    turnCount: state.turnCount,
  };
}
