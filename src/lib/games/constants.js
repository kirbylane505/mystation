/**
 * KICKBACK LOUNGE — Game Constants
 * Card suits, ranks, domino set, board layouts, game configs
 */

// Playing cards
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS = {
  hearts: '\u2665',
  diamonds: '\u2666',
  clubs: '\u2663',
  spades: '\u2660',
};

export const SUIT_COLORS = {
  hearts: '#ef4444',
  diamonds: '#ef4444',
  clubs: '#1e293b',
  spades: '#1e293b',
};

// Card values for Blackjack
export const CARD_VALUES = {
  'A': [1, 11],
  '2': [2], '3': [3], '4': [4], '5': [5], '6': [6],
  '7': [7], '8': [8], '9': [9], '10': [10],
  'J': [10], 'Q': [10], 'K': [10],
};

// Standard 52-card deck
export const STANDARD_DECK = [];
for (const suit of SUITS) {
  for (const rank of RANKS) {
    STANDARD_DECK.push({ suit, rank, id: `${rank}_${suit}` });
  }
}

// Slides & Ladders board (10x10 = 100 squares)
// Ladders go UP (bottom → top), Slides go DOWN (top → bottom)
export const LADDERS = {
  2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
  28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94,
};

export const SLIDES = {
  16: 6, 46: 25, 49: 11, 62: 19, 64: 60,
  74: 53, 89: 68, 92: 88, 95: 75, 99: 80,
};

// Board position → [row, col] mapping (snake pattern)
export function positionToCoords(pos) {
  if (pos < 1 || pos > 100) return null;
  const idx = pos - 1;
  const row = 9 - Math.floor(idx / 10);
  const col = row % 2 === 1 ? idx % 10 : 9 - (idx % 10);
  // Fix: row 0 is top, row 9 is bottom
  const actualRow = Math.floor(idx / 10);
  const isEvenRow = actualRow % 2 === 0;
  return {
    row: 9 - actualRow,
    col: isEvenRow ? idx % 10 : 9 - (idx % 10),
  };
}

// Game type definitions
export const GAME_TYPES = {
  blackjack: {
    id: 'blackjack',
    name: '21',
    description: 'Beat the dealer without going over 21',
    minPlayers: 1,
    maxPlayers: 8,
    icon: '🃏',
    color: '#10b981',
    turnBased: false, // all play simultaneously vs dealer
  },
  slidesLadders: {
    id: 'slidesLadders',
    name: 'Slides & Ladders',
    description: 'Roll dice, climb ladders, dodge slides. First to 100 wins!',
    minPlayers: 1,
    maxPlayers: 4,
    icon: '🎲',
    color: '#8b5cf6',
    turnBased: true,
  },
  spades: {
    id: 'spades',
    name: 'Spades',
    description: '2v2 trick-taking card game with AI partners',
    minPlayers: 1,
    maxPlayers: 4,
    icon: '♠️',
    color: '#3b82f6',
    turnBased: true,
  },
  pool: {
    id: 'pool',
    name: '8-Ball Pool',
    description: 'Classic billiards — sink your balls then pocket the 8!',
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🎱',
    color: '#6366f1',
    turnBased: true,
  },
  dominoes: {
    id: 'dominoes',
    name: 'Dominoes',
    description: 'Match tiles, clear your hand. Classic bone-slamming action!',
    minPlayers: 1,
    maxPlayers: 4,
    icon: '🁡',
    color: '#d97706',
    turnBased: true,
  },
  quiz: {
    id: 'quiz',
    name: 'Black History Quiz',
    description: 'Test your knowledge of Black history, culture & achievement!',
    minPlayers: 1,
    maxPlayers: 8,
    icon: '🧠',
    color: '#eab308',
    turnBased: false,
  },
};

// Player token colors for board games
export const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

// Room status types
export const ROOM_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

// Quick emotes
export const EMOTES = [
  { id: 'gg', emoji: '🤝', label: 'GG' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'laugh', emoji: '😂', label: 'LOL' },
  { id: 'think', emoji: '🤔', label: 'Hmm' },
  { id: 'clap', emoji: '👏', label: 'Nice' },
  { id: 'cry', emoji: '😭', label: 'Pain' },
  { id: 'crown', emoji: '👑', label: 'King' },
  { id: 'skull', emoji: '💀', label: 'Dead' },
];

// Points awarded for game actions
export const GAME_POINTS = {
  gameWin: 50,
  gameLoss: 10,
  dailyGame: 25,
  winStreak3: 100,
  winStreak5: 250,
  perfectBlackjack: 100, // natural 21
  spadesNilMade: 50,
  quizPerfect: 200, // all 10 correct
  quizStreak7: 150, // 7+ streak
};
