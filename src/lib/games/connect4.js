/**
 * KICKBACK LOUNGE — Connect 4 Game Logic
 * Classic drop-disc strategy game
 *
 * Rules:
 * - 2 players, turn-based
 * - 6 rows x 7 columns grid
 * - Players take turns dropping discs into columns
 * - Disc falls to lowest empty row in that column
 * - First to get 4 in a row (horizontal, vertical, or diagonal) wins
 * - If board fills up with no winner, it's a draw
 */

const ROWS = 6;
const COLS = 7;
const WIN_LENGTH = 4;

// ============================================================
// GAME INITIALIZATION
// ============================================================

/**
 * Initialize a new Connect 4 game
 * @param {string[]} playerIds - exactly 2 player IDs
 * @returns {object} initial game state
 */
export function initConnect4(playerIds) {
  const ids = [...playerIds];
  if (ids.length < 2) ids.push('ai_opponent');
  if (ids.length > 2) {
    throw new Error('Connect 4 requires exactly 2 players');
  }

  // Board: 6 rows x 7 cols, null = empty, 0 = player1, 1 = player2
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board.push(new Array(COLS).fill(null));
  }

  return {
    gameType: 'connect4',
    board,
    playerOrder: ids,
    currentTurn: 0, // index into playerOrder
    phase: 'playing',
    winner: null,
    winLine: null, // [{r,c}, ...] four winning cells
    moveCount: 0,
    lastMove: null, // {row, col, player}
  };
}

// ============================================================
// WIN DETECTION
// ============================================================

/**
 * Check if placing at (row, col) creates 4 in a row
 * @returns {Array|null} winning line coords or null
 */
function checkWin(board, row, col) {
  const player = board[row][col];
  if (player === null) return null;

  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    const line = [{ r: row, c: col }];

    // Check forward
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      line.push({ r, c });
    }

    // Check backward
    for (let i = 1; i < WIN_LENGTH; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
      if (board[r][c] !== player) break;
      line.push({ r, c });
    }

    if (line.length >= WIN_LENGTH) {
      return line.slice(0, WIN_LENGTH);
    }
  }

  return null;
}

/**
 * Check if the board is completely full (draw)
 */
function isBoardFull(board) {
  return board[0].every(cell => cell !== null);
}

// ============================================================
// GAME ACTIONS
// ============================================================

/**
 * Drop a disc into a column
 * @param {object} state - current game state
 * @param {string} playerId - who is dropping
 * @param {number} col - column index (0-6)
 * @returns {{ state, valid, error?, moveDetails? }}
 */
function dropDisc(state, playerId, col) {
  if (state.phase !== 'playing') {
    return { state, valid: false, error: 'Game is not active' };
  }

  // Verify it's this player's turn
  const expectedPlayer = state.playerOrder[state.currentTurn];
  if (playerId !== expectedPlayer) {
    return { state, valid: false, error: 'Not your turn' };
  }

  if (typeof col !== 'number' || col < 0 || col >= COLS) {
    return { state, valid: false, error: 'Invalid column' };
  }

  // Find lowest empty row in this column
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (state.board[r][col] === null) {
      targetRow = r;
      break;
    }
  }

  if (targetRow === -1) {
    return { state, valid: false, error: 'Column is full' };
  }

  // Place the disc
  const newBoard = state.board.map(row => [...row]);
  newBoard[targetRow][col] = state.currentTurn;

  // Check for win
  const winLine = checkWin(newBoard, targetRow, col);
  const boardFull = !winLine && isBoardFull(newBoard);

  const newState = {
    ...state,
    board: newBoard,
    moveCount: state.moveCount + 1,
    lastMove: { row: targetRow, col, player: state.currentTurn },
    currentTurn: winLine || boardFull ? state.currentTurn : (state.currentTurn + 1) % 2,
    phase: winLine || boardFull ? 'finished' : 'playing',
    winner: winLine ? playerId : null,
    winLine: winLine || null,
  };

  // Build results on game end
  if (newState.phase === 'finished') {
    const results = {};
    for (const pid of state.playerOrder) {
      if (pid === playerId && winLine) {
        results[pid] = { outcome: 'win', reason: 'Connected 4!' };
      } else if (winLine) {
        results[pid] = { outcome: 'loss', reason: 'Opponent connected 4' };
      } else {
        results[pid] = { outcome: 'draw', reason: 'Board is full — draw!' };
      }
    }
    newState.results = results;
  }

  return {
    state: newState,
    valid: true,
    moveDetails: {
      playerId,
      col,
      row: targetRow,
      playerIndex: state.currentTurn,
      isWin: !!winLine,
      isDraw: boardFull && !winLine,
    },
  };
}

// ============================================================
// AI OPPONENT
// ============================================================

/**
 * Simple AI: checks for winning move, then blocking move, then center preference
 */
function getAiMove(state) {
  const aiTurn = state.currentTurn;
  const opponentTurn = (aiTurn + 1) % 2;

  // Get valid columns
  const validCols = [];
  for (let c = 0; c < COLS; c++) {
    if (state.board[0][c] === null) validCols.push(c);
  }
  if (validCols.length === 0) return null;

  // Helper: simulate a drop and check result
  function simulateDrop(board, col, playerIdx) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) {
        const testBoard = board.map(row => [...row]);
        testBoard[r][col] = playerIdx;
        return { row: r, board: testBoard };
      }
    }
    return null;
  }

  // 1. Can AI win?
  for (const col of validCols) {
    const sim = simulateDrop(state.board, col, aiTurn);
    if (sim && checkWin(sim.board, sim.row, col)) return col;
  }

  // 2. Must AI block opponent?
  for (const col of validCols) {
    const sim = simulateDrop(state.board, col, opponentTurn);
    if (sim && checkWin(sim.board, sim.row, col)) return col;
  }

  // 3. Prefer center columns
  const centerPreference = [3, 2, 4, 1, 5, 0, 6];
  for (const col of centerPreference) {
    if (validCols.includes(col)) return col;
  }

  return validCols[0];
}

// ============================================================
// SERVER MOVE HANDLER
// ============================================================

/**
 * Apply a Connect 4 move — used by server move route
 * @param {object} state - current game state
 * @param {string} playerId - who moved
 * @param {string} action - 'drop'
 * @param {object} data - { col: number }
 * @returns {{ state, valid, error?, moveDetails? }}
 */
export function applyConnect4Move(state, playerId, action, data = {}) {
  if (state.phase === 'finished') {
    return { state, valid: false, error: 'Game is finished' };
  }

  if (action !== 'drop') {
    return { state, valid: false, error: `Unknown action: ${action}` };
  }

  const result = dropDisc(state, playerId, data.col);
  if (!result.valid) return result;

  let finalState = result.state;

  // Auto-play AI turn if next player is AI
  if (finalState.phase === 'playing' && finalState.playerOrder[finalState.currentTurn] === 'ai_opponent') {
    const aiCol = getAiMove(finalState);
    if (aiCol !== null) {
      const aiResult = dropDisc(finalState, 'ai_opponent', aiCol);
      if (aiResult.valid) {
        finalState = aiResult.state;
      }
    }
  }

  return { state: finalState, valid: true, moveDetails: result.moveDetails };
}

// ============================================================
// STATE SANITIZATION
// ============================================================

/**
 * Sanitize Connect 4 state for client
 * Connect 4 has no hidden info — full board is always visible
 */
export function sanitizeConnect4State(state, playerId) {
  return {
    gameType: 'connect4',
    board: state.board,
    playerOrder: state.playerOrder,
    currentTurn: state.currentTurn,
    phase: state.phase,
    winner: state.winner,
    winLine: state.winLine,
    moveCount: state.moveCount,
    lastMove: state.lastMove,
    results: state.results || null,
  };
}
