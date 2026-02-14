/**
 * KICKBACK LOUNGE — 8-Ball Pool Game Logic (Server-Side)
 * Turn-based 2-player billiards with standard 8-ball rules
 * Physics run client-side; server validates results and manages state
 */

// Ball rack order: 8-ball in center, mix of solids/stripes
const RACK_ORDER = [
  [1],               // row 0 (apex)
  [11, 2],           // row 1
  [9, 8, 3],         // row 2 (8 in center)
  [12, 4, 10, 5],    // row 3
  [13, 6, 15, 7, 14],// row 4
];

const TABLE_W = 800;
const TABLE_H = 400;
const BALL_R = 10;
const BORDER = 30;

export function initPool(playerIds) {
  if (playerIds.length !== 2) {
    throw new Error('Pool requires exactly 2 players');
  }

  // Create ball positions
  const balls = [];

  // Cue ball
  balls.push({ id: 0, x: TABLE_W * 0.25, y: TABLE_H / 2, pocketed: false });

  // Rack balls
  const rackX = TABLE_W * 0.68;
  const rackY = TABLE_H / 2;
  const rowDx = BALL_R * Math.sqrt(3);
  const colDy = BALL_R * 2.05;

  RACK_ORDER.forEach((row, rowIdx) => {
    row.forEach((ballId, colIdx) => {
      const x = rackX + rowIdx * rowDx;
      const y = rackY + (colIdx - (row.length - 1) / 2) * colDy;
      balls.push({ id: ballId, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, pocketed: false });
    });
  });

  return {
    phase: 'playing',
    turnOrder: playerIds,
    currentPlayerIndex: 0,
    balls,
    assignments: {}, // playerId -> 'solids' | 'stripes'
    pocketedSolids: [],
    pocketedStripes: [],
    eightPocketed: false,
    cueBallInHand: false,
    breakShot: true,
    lastShotFoul: false,
    winner: null,
    turnNumber: 0,
    lastPocketed: [],
  };
}

/**
 * Apply a pool move (shot result from client)
 * data: { ballPositions: [{id, x, y, pocketed}], pocketedThisShot: [ballIds], scratch: bool }
 */
export function applyPoolMove(state, playerId, data) {
  const currentPlayer = state.turnOrder[state.currentPlayerIndex];

  if (playerId !== currentPlayer) {
    return { valid: false, error: 'Not your turn' };
  }

  if (state.phase !== 'playing') {
    return { valid: false, error: 'Game is not in progress' };
  }

  const { ballPositions, pocketedThisShot = [], scratch } = data;

  // Update ball positions from client physics
  const newBalls = state.balls.map(b => {
    const updated = ballPositions.find(bp => bp.id === b.id);
    if (updated) {
      return { ...b, x: updated.x, y: updated.y, pocketed: updated.pocketed || b.pocketed };
    }
    return b;
  });

  // Track pocketed balls
  const newPocketedSolids = [...state.pocketedSolids];
  const newPocketedStripes = [...state.pocketedStripes];
  let eightPocketed = state.eightPocketed;
  let cueScratch = scratch || false;

  for (const ballId of pocketedThisShot) {
    if (ballId === 0) {
      cueScratch = true;
    } else if (ballId === 8) {
      eightPocketed = true;
    } else if (ballId >= 1 && ballId <= 7) {
      if (!newPocketedSolids.includes(ballId)) newPocketedSolids.push(ballId);
    } else if (ballId >= 9 && ballId <= 15) {
      if (!newPocketedStripes.includes(ballId)) newPocketedStripes.push(ballId);
    }
  }

  // Assign groups on first legal pocket (not on break scratch)
  let newAssignments = { ...state.assignments };
  const assignmentsMade = Object.keys(newAssignments).length === 2;

  if (!assignmentsMade && !cueScratch) {
    const solidsPocketed = pocketedThisShot.filter(id => id >= 1 && id <= 7);
    const stripesPocketed = pocketedThisShot.filter(id => id >= 9 && id <= 15);

    if (solidsPocketed.length > 0 && stripesPocketed.length === 0) {
      newAssignments[currentPlayer] = 'solids';
      newAssignments[state.turnOrder[1 - state.currentPlayerIndex]] = 'stripes';
    } else if (stripesPocketed.length > 0 && solidsPocketed.length === 0) {
      newAssignments[currentPlayer] = 'stripes';
      newAssignments[state.turnOrder[1 - state.currentPlayerIndex]] = 'solids';
    } else if (solidsPocketed.length > 0 && stripesPocketed.length > 0) {
      // Both pocketed — assign based on first in array
      newAssignments[currentPlayer] = 'solids';
      newAssignments[state.turnOrder[1 - state.currentPlayerIndex]] = 'stripes';
    }
  }

  // Check win/loss conditions
  let winner = null;
  let phase = 'playing';

  if (eightPocketed) {
    const myAssignment = newAssignments[currentPlayer];
    const myPocketed = myAssignment === 'solids' ? newPocketedSolids : newPocketedStripes;
    const needed = myAssignment === 'solids' ? 7 : 7;

    if (cueScratch) {
      // Scratch on 8-ball = lose
      winner = state.turnOrder[1 - state.currentPlayerIndex];
      phase = 'finished';
    } else if (myPocketed.length >= needed) {
      // Legally pocketed 8 after clearing group
      winner = currentPlayer;
      phase = 'finished';
    } else {
      // Pocketed 8 too early = lose
      winner = state.turnOrder[1 - state.currentPlayerIndex];
      phase = 'finished';
    }
  }

  // Determine next turn
  let nextPlayerIndex = state.currentPlayerIndex;
  let continueTurn = false;

  if (phase === 'playing') {
    // Player continues if they pocketed one of their own balls and no foul
    if (!cueScratch && assignmentsMade) {
      const myAssignment = newAssignments[currentPlayer];
      const myBallsPocketed = pocketedThisShot.filter(id =>
        myAssignment === 'solids' ? (id >= 1 && id <= 7) : (id >= 9 && id <= 15)
      );
      continueTurn = myBallsPocketed.length > 0;
    } else if (!cueScratch && !assignmentsMade && pocketedThisShot.filter(id => id !== 0).length > 0) {
      // First pocket — player continues
      continueTurn = true;
    }

    if (!continueTurn) {
      nextPlayerIndex = 1 - state.currentPlayerIndex;
    }
  }

  // Handle cue ball scratch — reset cue ball position for opponent
  let cueBallInHand = false;
  if (cueScratch && phase === 'playing') {
    cueBallInHand = true;
    // Reset cue ball to left quarter
    const cueBall = newBalls.find(b => b.id === 0);
    if (cueBall) {
      cueBall.x = TABLE_W * 0.25;
      cueBall.y = TABLE_H / 2;
      cueBall.pocketed = false;
    }
  }

  const newState = {
    ...state,
    balls: newBalls,
    assignments: newAssignments,
    pocketedSolids: newPocketedSolids,
    pocketedStripes: newPocketedStripes,
    eightPocketed,
    currentPlayerIndex: nextPlayerIndex,
    cueBallInHand,
    breakShot: false,
    lastShotFoul: cueScratch,
    winner,
    phase,
    turnNumber: state.turnNumber + 1,
    lastPocketed: pocketedThisShot,
  };

  // Build result info
  const results = {};
  if (phase === 'finished') {
    state.turnOrder.forEach(pid => {
      results[pid] = {
        outcome: pid === winner ? 'win' : 'loss',
        reason: pid === winner
          ? (eightPocketed && !cueScratch ? 'Pocketed the 8-ball!' : 'Opponent fouled on 8-ball')
          : (cueScratch ? 'Scratched on the 8-ball' : 'Opponent pocketed the 8-ball'),
      };
    });
    newState.results = results;
  }

  return {
    valid: true,
    state: newState,
    moveDetails: {
      pocketed: pocketedThisShot,
      scratch: cueScratch,
      continueTurn,
      winner,
    },
  };
}

export function sanitizePoolState(state) {
  // Pool has no hidden information — return as-is
  return { ...state };
}
