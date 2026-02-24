/**
 * KICKBACK LOUNGE — Black History Quiz Game Logic
 * Server-authoritative: question selection, scoring, streak tracking
 *
 * Rules:
 * - 10 random questions per game (optionally filtered by category)
 * - 20 seconds per question
 * - Score: 100 base + speed bonus (up to 100 extra for instant answer)
 * - Streak multiplier: 2x at 3, 3x at 5, 4x at 7+
 * - Phase flow: question -> reveal -> question -> ... -> finished
 */

import { questions as allQuestions, categories } from '@/data/blackHistoryQuestions';

/**
 * Fisher-Yates shuffle (in-place)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get the streak multiplier for a given streak count
 */
function getStreakMultiplier(streak) {
  if (streak >= 7) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

/**
 * Initialize a new Quiz game
 * @param {string[]} playerIds - array of player IDs
 * @param {object} options - { category?: string, questionCount?: number }
 * @returns {object} initial game state
 */
export function initQuiz(playerIds, options = {}) {
  const { category = null, questionCount = 10 } = options;

  // Filter by category if specified
  let pool = category
    ? allQuestions.filter(q => q.category === category)
    : [...allQuestions];

  // Shuffle and pick questions
  const selected = shuffle(pool).slice(0, Math.min(questionCount, pool.length));

  // Initialize player state
  const players = {};
  for (const pid of playerIds) {
    players[pid] = {
      score: 0,
      streak: 0,
      longestStreak: 0,
      answers: [], // { questionId, answerIndex, correct, points, timeMs }
    };
  }

  return {
    gameType: 'quiz',
    players,
    playerOrder: [...playerIds],
    questions: selected,
    currentQuestion: 0,
    questionStartTime: Date.now(),
    phase: 'question', // 'question' | 'reveal' | 'finished'
    timePerQuestion: 20000,
    round: 1,
    category: category || 'All Categories',
    totalQuestions: selected.length,
  };
}

/**
 * Submit an answer for a player
 * @param {object} state - current game state
 * @param {string} playerId - the player answering
 * @param {number} answerIndex - index of the chosen answer (0-3)
 * @returns {object} updated game state
 */
export function submitAnswer(state, playerId, answerIndex) {
  // Don't allow answers during reveal or finished phase
  if (state.phase !== 'question') return state;

  const player = state.players[playerId];
  if (!player) return state;

  // Don't allow double-answering the same question
  const currentQ = state.questions[state.currentQuestion];
  if (player.answers.find(a => a.questionId === currentQ.id)) return state;

  const now = Date.now();
  const elapsed = now - state.questionStartTime;
  const correct = answerIndex === currentQ.answer;

  let points = 0;
  let newStreak = player.streak;

  if (correct) {
    // Base score
    points = 100;

    // Speed bonus: linearly decreases from 100 (instant) to 0 (at time limit)
    const speedRatio = Math.max(0, 1 - elapsed / state.timePerQuestion);
    const speedBonus = Math.round(speedRatio * 100);
    points += speedBonus;

    // Streak bonus
    newStreak = player.streak + 1;
    const multiplier = getStreakMultiplier(newStreak);
    points = points * multiplier;
  } else {
    newStreak = 0;
  }

  const updatedPlayer = {
    ...player,
    score: player.score + points,
    streak: newStreak,
    longestStreak: Math.max(player.longestStreak, newStreak),
    answers: [
      ...player.answers,
      {
        questionId: currentQ.id,
        answerIndex,
        correct,
        points,
        timeMs: elapsed,
      },
    ],
  };

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
  };
}

/**
 * Advance to next phase or question
 * question -> reveal -> question (or finished)
 * @param {object} state - current game state
 * @returns {object} updated game state
 */
export function nextQuestion(state) {
  if (state.phase === 'question') {
    // Move to reveal phase
    return {
      ...state,
      phase: 'reveal',
    };
  }

  if (state.phase === 'reveal') {
    const nextIdx = state.currentQuestion + 1;

    if (nextIdx >= state.questions.length) {
      // Game over
      return {
        ...state,
        phase: 'finished',
      };
    }

    // Move to next question
    return {
      ...state,
      currentQuestion: nextIdx,
      phase: 'question',
      questionStartTime: Date.now(),
      round: nextIdx + 1,
    };
  }

  return state;
}

/**
 * Get the final results sorted by score
 * @param {object} state - current game state
 * @returns {Array} sorted leaderboard
 */
export function getQuizResults(state) {
  return Object.entries(state.players)
    .map(([playerId, data]) => {
      const totalAnswered = data.answers.length;
      const correctCount = data.answers.filter(a => a.correct).length;
      const accuracy = totalAnswered > 0
        ? Math.round((correctCount / totalAnswered) * 100)
        : 0;
      const avgTimeMs = totalAnswered > 0
        ? Math.round(data.answers.reduce((sum, a) => sum + a.timeMs, 0) / totalAnswered)
        : 0;

      return {
        playerId,
        score: data.score,
        correctCount,
        totalAnswered,
        accuracy,
        longestStreak: data.longestStreak,
        avgTimeMs,
        answers: data.answers,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Unified move handler for quiz (matches API pattern)
 * @param {object} state - current game state
 * @param {string} playerId - the player
 * @param {string} action - 'answer' | 'next'
 * @param {object} data - { answerIndex } for answer action
 * @returns {{ state, valid, error?, moveDetails? }}
 */
export function applyQuizMove(state, playerId, action, data = {}) {
  if (state.phase === 'finished') {
    return { state, valid: false, error: 'Game is finished' };
  }

  switch (action) {
    case 'answer': {
      if (state.phase !== 'question') {
        return { state, valid: false, error: 'Not in question phase' };
      }
      if (typeof data.answerIndex !== 'number' || data.answerIndex < 0 || data.answerIndex > 3) {
        return { state, valid: false, error: 'Invalid answer index' };
      }
      const newState = submitAnswer(state, playerId, data.answerIndex);
      // Check if all players answered — auto-advance to reveal
      const allAnswered = state.playerOrder.every(pid => {
        const p = newState.players[pid];
        return p.answers.find(a => a.questionId === newState.questions[newState.currentQuestion].id);
      });
      const finalState = allAnswered ? nextQuestion(newState) : newState;
      return { state: finalState, valid: true, moveDetails: { action: 'answer', playerId, answerIndex: data.answerIndex } };
    }
    case 'next': {
      const newState = nextQuestion(state);
      return { state: newState, valid: true, moveDetails: { action: 'next' } };
    }
    default:
      return { state, valid: false, error: `Unknown quiz action: ${action}` };
  }
}

/**
 * Sanitize quiz state for broadcast or per-player view
 * Hide future question answers during question phase to prevent cheating
 */
export function sanitizeQuizState(state, playerId) {
  // Strip correct answer from current question during question phase
  const sanitizedQuestions = state.questions.map((q, idx) => {
    if (idx > state.currentQuestion) {
      // Future questions — hide answer
      return { ...q, answer: undefined };
    }
    if (idx === state.currentQuestion && state.phase === 'question') {
      // Current question in question phase — hide answer
      return { ...q, answer: undefined };
    }
    return q; // Past/revealed questions — show answer
  });

  // For broadcast, show scores but not individual answer details
  if (playerId === '__broadcast__') {
    const players = {};
    for (const [pid, data] of Object.entries(state.players)) {
      players[pid] = {
        score: data.score,
        streak: data.streak,
        longestStreak: data.longestStreak,
        answeredCount: data.answers.length,
      };
    }
    return { ...state, questions: sanitizedQuestions, players };
  }

  // For specific player, show their full answers but others' scores only
  const players = {};
  for (const [pid, data] of Object.entries(state.players)) {
    if (pid === playerId) {
      players[pid] = data; // full data for requesting player
    } else {
      players[pid] = {
        score: data.score,
        streak: data.streak,
        longestStreak: data.longestStreak,
        answeredCount: data.answers.length,
      };
    }
  }
  return { ...state, questions: sanitizedQuestions, players };
}

export { categories, getStreakMultiplier };
