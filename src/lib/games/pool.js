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

const TABLE_W = 1200;
const TABLE_H = 600;
const BALL_R = 13;
const BORDER = 48;

export function initPool(playerIds) {
  if (playerIds.length !== 2) {
    throw new Error('Pool requires exactly 2 players');
  }

  // Create ball positions
  const balls = [];

  // Cue ball
  balls.push({ id: 0, x: TABLE_W * 0.25, y: TABLE_H / 2, pocketed: false });

  // Rack balls
  const rackX = TABLE_W * 0.72;
  const rackY = TABLE_H / 2;
  const spacing = BALL_R * 2.06;
  const rowDx = spacing * Math.sqrt(3) / 2;
  const colDy = spacing;

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

/**
 * AI Shot Calculator — finds best ball-to-pocket angle with slight random error
 * Returns: { angle, power } for the cue stick
 */
export function calculateAiShot(state) {
  const cueBall = state.balls.find(b => b.id === 0 && !b.pocketed);
  if (!cueBall) return { angle: 0, power: 12 };

  const aiPlayer = state.turnOrder[state.currentPlayerIndex];
  const assignment = state.assignments[aiPlayer];

  // Pocket positions (corner + side pockets)
  const pockets = [
    { x: BORDER, y: BORDER },
    { x: TABLE_W / 2, y: BORDER - 4 },
    { x: TABLE_W - BORDER, y: BORDER },
    { x: BORDER, y: TABLE_H - BORDER },
    { x: TABLE_W / 2, y: TABLE_H - BORDER + 4 },
    { x: TABLE_W - BORDER, y: TABLE_H - BORDER },
  ];

  // Get target balls
  const targetBalls = state.balls.filter(b => {
    if (b.pocketed || b.id === 0) return false;
    if (!assignment) return b.id !== 8; // no assignment yet — hit anything except 8
    if (assignment === 'solids') {
      const allSolidsPocketed = state.pocketedSolids.length >= 7;
      return allSolidsPocketed ? b.id === 8 : (b.id >= 1 && b.id <= 7);
    } else {
      const allStripesPocketed = state.pocketedStripes.length >= 7;
      return allStripesPocketed ? b.id === 8 : (b.id >= 9 && b.id <= 15);
    }
  });

  if (targetBalls.length === 0) {
    // Defensive shot — hit any non-pocketed ball
    const anyBall = state.balls.find(b => !b.pocketed && b.id !== 0);
    if (!anyBall) return { angle: Math.random() * Math.PI * 2, power: 10 };
    const dx = anyBall.x - cueBall.x;
    const dy = anyBall.y - cueBall.y;
    return { angle: Math.atan2(dy, dx), power: 8 + Math.random() * 4 };
  }

  // Score each ball-pocket combination — pick the easiest shot
  let bestScore = -Infinity;
  let bestAngle = 0;
  let bestPower = 12;

  for (const ball of targetBalls) {
    for (const pocket of pockets) {
      // Ghost ball position: where cue ball needs to be to send target ball into pocket
      const ballToPocketDx = pocket.x - ball.x;
      const ballToPocketDy = pocket.y - ball.y;
      const ballToPocketDist = Math.sqrt(ballToPocketDx ** 2 + ballToPocketDy ** 2);
      if (ballToPocketDist < 1) continue;

      const normX = ballToPocketDx / ballToPocketDist;
      const normY = ballToPocketDy / ballToPocketDist;

      // Ghost ball position (contact point)
      const ghostX = ball.x - normX * BALL_R * 2;
      const ghostY = ball.y - normY * BALL_R * 2;

      // Angle from cue ball to ghost position
      const cueToDx = ghostX - cueBall.x;
      const cueToDy = ghostY - cueBall.y;
      const cueToDist = Math.sqrt(cueToDx ** 2 + cueToDy ** 2);

      if (cueToDist < BALL_R * 2) continue; // too close

      // Score: prefer shorter shots, straighter shots, closer to pocket
      const straightness = Math.abs(Math.atan2(cueToDy, cueToDx) - Math.atan2(-normY, -normX));
      const adjustedStraightness = Math.min(straightness, Math.PI * 2 - straightness);
      const score = (1 / (cueToDist + 1)) * (1 / (adjustedStraightness + 0.1)) * (1 / (ballToPocketDist + 1));

      // Check for obstructing balls (simplified — just check if any ball is near the line)
      let obstructed = false;
      for (const other of state.balls) {
        if (other.pocketed || other.id === ball.id || other.id === 0) continue;
        // Point-to-line distance
        const t = Math.max(0, Math.min(1, ((other.x - cueBall.x) * cueToDx + (other.y - cueBall.y) * cueToDy) / (cueToDist * cueToDist)));
        const projX = cueBall.x + t * cueToDx;
        const projY = cueBall.y + t * cueToDy;
        const dist = Math.sqrt((other.x - projX) ** 2 + (other.y - projY) ** 2);
        if (dist < BALL_R * 2.5) { obstructed = true; break; }
      }

      const finalScore = obstructed ? score * 0.1 : score;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestAngle = Math.atan2(cueToDy, cueToDx);
        bestPower = Math.min(20, Math.max(8, cueToDist * 0.04 + 8));
      }
    }
  }

  // Add slight random error for realism (medium difficulty)
  const errorRange = 0.06; // ~3.4 degrees
  bestAngle += (Math.random() - 0.5) * errorRange;
  bestPower += (Math.random() - 0.5) * 3;
  bestPower = Math.max(6, Math.min(20, bestPower));

  return { angle: bestAngle, power: bestPower };
}
