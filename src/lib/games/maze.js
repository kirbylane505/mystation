/**
 * KICKBACK LOUNGE — Maze HQ Game Logic
 * Recursive backtracking (DFS) maze generation
 *
 * Rules:
 * - 1-4 players, real-time (not turn-based)
 * - Navigate from start (top-left area) to end (bottom-right area)
 * - Walls block movement — no walking through walls
 * - First to reach the end wins (or best time if solo)
 * - Time limit based on maze size
 * - Scoring: base 1000 + time bonus - move penalty
 */

// ============================================================
// MAZE GENERATION — Recursive Backtracking (DFS)
// ============================================================

/**
 * Generate a perfect maze using recursive backtracking
 * Every cell is reachable from every other cell (exactly one path)
 * @param {number} width - number of columns
 * @param {number} height - number of rows
 * @returns {{ cells: object[][], start: {x,y}, end: {x,y} }}
 */
export function generateMaze(width, height) {
  // Initialize grid — every cell starts with all 4 walls
  const cells = [];
  for (let y = 0; y < height; y++) {
    cells[y] = [];
    for (let x = 0; x < width; x++) {
      cells[y][x] = {
        x,
        y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
      };
    }
  }

  // Direction vectors: [dx, dy, wall to remove from current, wall to remove from neighbor]
  const directions = [
    { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
    { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
    { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
    { dx: -1, dy: 0, wall: 'left', opposite: 'right' },
  ];

  // Shuffle array (Fisher-Yates)
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Iterative DFS with explicit stack (avoids call stack overflow on large mazes)
  const stack = [];
  const startCell = cells[0][0];
  startCell.visited = true;
  stack.push({ x: 0, y: 0 });

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { x, y } = current;

    // Get unvisited neighbors
    const unvisited = [];
    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !cells[ny][nx].visited) {
        unvisited.push({ nx, ny, wall: dir.wall, opposite: dir.opposite });
      }
    }

    if (unvisited.length === 0) {
      // Backtrack
      stack.pop();
    } else {
      // Choose random unvisited neighbor
      const shuffled = shuffle(unvisited);
      const chosen = shuffled[0];

      // Remove walls between current and chosen
      cells[y][x].walls[chosen.wall] = false;
      cells[chosen.ny][chosen.nx].walls[chosen.opposite] = false;

      // Mark chosen as visited and push to stack
      cells[chosen.ny][chosen.nx].visited = true;
      stack.push({ x: chosen.nx, y: chosen.ny });
    }
  }

  // Clean up visited flags — not needed in final state
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      delete cells[y][x].visited;
    }
  }

  // Start in top-left area, end in bottom-right area
  const start = { x: 0, y: 0 };
  const end = { x: width - 1, y: height - 1 };

  return { cells, start, end, width, height };
}

// ============================================================
// GAME INITIALIZATION
// ============================================================

const SIZE_CONFIG = {
  small: { width: 15, height: 15, timeLimit: 60 },
  medium: { width: 25, height: 25, timeLimit: 120 },
  large: { width: 35, height: 35, timeLimit: 180 },
};

/**
 * Initialize a new Maze HQ game
 * @param {string[]} playerIds - 1-4 player IDs
 * @param {string} size - 'small', 'medium', 'large'
 * @returns {object} initial game state
 */
export function initMaze(playerIds, size = 'medium') {
  if (playerIds.length < 1 || playerIds.length > 4) {
    throw new Error('Maze HQ requires 1-4 players');
  }

  const config = SIZE_CONFIG[size] || SIZE_CONFIG.medium;
  const maze = generateMaze(config.width, config.height);

  const players = {};
  for (const pid of playerIds) {
    players[pid] = {
      x: maze.start.x,
      y: maze.start.y,
      moves: 0,
      finished: false,
      finishTime: null,
      visited: [[maze.start.x, maze.start.y]], // track visited cells for trail
    };
  }

  return {
    gameType: 'maze',
    maze,
    players,
    playerOrder: [...playerIds],
    size,
    timeLimit: config.timeLimit,
    startTime: null,
    phase: 'ready', // ready, playing, finished
    winner: null,
    finishOrder: [],
  };
}

// ============================================================
// GAME ACTIONS
// ============================================================

/**
 * Start the maze game — begins the countdown timer
 * @param {object} state - current game state
 * @returns {object} updated state with startTime and phase='playing'
 */
export function startMaze(state) {
  if (state.phase !== 'ready') {
    return state;
  }

  return {
    ...state,
    startTime: Date.now(),
    phase: 'playing',
  };
}

/**
 * Move a player in a direction
 * @param {object} state - current game state
 * @param {string} playerId - who is moving
 * @param {string} direction - 'up', 'down', 'left', 'right'
 * @returns {{ state: object, valid: boolean, error?: string, moveDetails?: object }}
 */
export function movePlayer(state, playerId, direction) {
  if (state.phase !== 'playing') {
    return { state, valid: false, error: 'Game is not active' };
  }

  const player = state.players[playerId];
  if (!player) {
    return { state, valid: false, error: 'Player not found' };
  }

  if (player.finished) {
    return { state, valid: false, error: 'Player already finished' };
  }

  // Check time limit
  const elapsed = (Date.now() - state.startTime) / 1000;
  if (elapsed >= state.timeLimit) {
    return {
      state: { ...state, phase: 'finished' },
      valid: false,
      error: 'Time is up',
    };
  }

  const { x, y } = player;
  const cell = state.maze.cells[y][x];

  // Direction to wall mapping
  const wallMap = {
    up: 'top',
    down: 'bottom',
    left: 'left',
    right: 'right',
  };

  const deltaMap = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  const wallName = wallMap[direction];
  const delta = deltaMap[direction];

  if (!wallName || !delta) {
    return { state, valid: false, error: 'Invalid direction' };
  }

  // Check if wall blocks movement
  if (cell.walls[wallName]) {
    return { state, valid: false, error: 'Wall blocks this path' };
  }

  // Calculate new position
  const newX = x + delta.dx;
  const newY = y + delta.dy;

  // Bounds check (should not be needed with proper maze gen, but safety)
  if (newX < 0 || newX >= state.maze.width || newY < 0 || newY >= state.maze.height) {
    return { state, valid: false, error: 'Out of bounds' };
  }

  // Update player position
  const newVisited = [...player.visited, [newX, newY]];
  const newPlayer = {
    ...player,
    x: newX,
    y: newY,
    moves: player.moves + 1,
    visited: newVisited,
  };

  // Check if player reached the end
  const reachedEnd = newX === state.maze.end.x && newY === state.maze.end.y;
  if (reachedEnd) {
    newPlayer.finished = true;
    newPlayer.finishTime = Date.now() - state.startTime;
  }

  const newPlayers = { ...state.players, [playerId]: newPlayer };
  const newFinishOrder = reachedEnd
    ? [...state.finishOrder, playerId]
    : state.finishOrder;

  // Check if all players finished
  const allFinished = Object.values(newPlayers).every(p => p.finished);

  // Set winner to first finisher
  const winner = newFinishOrder.length > 0 ? newFinishOrder[0] : null;

  const newState = {
    ...state,
    players: newPlayers,
    finishOrder: newFinishOrder,
    winner: allFinished ? winner : state.winner || (reachedEnd && newFinishOrder.length === 1 ? playerId : state.winner),
    phase: allFinished ? 'finished' : state.phase,
  };

  const moveDetails = {
    playerId,
    direction,
    from: { x, y },
    to: { x: newX, y: newY },
    reachedEnd,
    moves: newPlayer.moves,
    timeTaken: reachedEnd ? newPlayer.finishTime : null,
  };

  return { state: newState, valid: true, moveDetails };
}

// ============================================================
// RESULTS & SCORING
// ============================================================

/**
 * Calculate score for a player
 * @param {object} player - player state
 * @param {number} timeLimit - time limit in seconds
 * @param {number} mazeWidth - maze width
 * @param {number} mazeHeight - maze height
 * @returns {number} score
 */
function calculateScore(player, timeLimit, mazeWidth, mazeHeight) {
  if (!player.finished) return 0;

  const base = 1000;
  const timeTakenSec = player.finishTime / 1000;
  const timeBonus = Math.max(0, Math.floor((timeLimit - timeTakenSec) * 5));

  // Rough optimal = manhattan distance from start to end
  const optimalMoves = (mazeWidth - 1) + (mazeHeight - 1);
  const excessMoves = Math.max(0, player.moves - optimalMoves);
  const movePenalty = excessMoves * 2;

  return Math.max(100, base + timeBonus - movePenalty);
}

/**
 * Get final results sorted by performance
 * @param {object} state - game state
 * @returns {object[]} sorted results with scores
 */
export function getMazeResults(state) {
  const results = [];

  for (const [playerId, player] of Object.entries(state.players)) {
    const score = calculateScore(
      player,
      state.timeLimit,
      state.maze.width,
      state.maze.height,
    );

    results.push({
      playerId,
      finished: player.finished,
      finishTime: player.finishTime,
      moves: player.moves,
      score,
    });
  }

  // Sort: finished first, then by finishTime (fastest), then by fewest moves
  results.sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    if (a.finished && b.finished) {
      if (a.finishTime !== b.finishTime) return a.finishTime - b.finishTime;
      return a.moves - b.moves;
    }
    // Both unfinished — more moves = closer to end (roughly)
    return b.moves - a.moves;
  });

  return results;
}

// ============================================================
// STATE SANITIZATION
// ============================================================

/**
 * Sanitize maze state for client — maze has no hidden info between players
 * but we strip the visited arrays of OTHER players to save bandwidth
 * @param {object} state - full game state
 * @param {string} playerId - requesting player (or '__broadcast__')
 * @returns {object} sanitized state
 */
export function sanitizeMazeState(state, playerId) {
  const sanitizedPlayers = {};

  for (const [pid, player] of Object.entries(state.players)) {
    sanitizedPlayers[pid] = {
      x: player.x,
      y: player.y,
      moves: player.moves,
      finished: player.finished,
      finishTime: player.finishTime,
      // Only include full visited trail for the requesting player
      visited: pid === playerId ? player.visited : [],
    };
  }

  return {
    gameType: 'maze',
    maze: state.maze,
    players: sanitizedPlayers,
    playerOrder: state.playerOrder,
    size: state.size,
    timeLimit: state.timeLimit,
    startTime: state.startTime,
    phase: state.phase,
    winner: state.winner,
    finishOrder: state.finishOrder,
  };
}

/**
 * Apply a maze move — used by server move route
 * Wrapper matching the pattern of other games
 * @param {object} state - current game state
 * @param {string} playerId - who moved
 * @param {string} action - the direction ('up', 'down', 'left', 'right')
 * @returns {{ state: object, valid: boolean, error?: string, moveDetails?: object }}
 */
export function applyMazeMove(state, playerId, action) {
  // Auto-start if in ready phase
  let currentState = state;
  if (currentState.phase === 'ready') {
    currentState = startMaze(currentState);
  }

  return movePlayer(currentState, playerId, action);
}
