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
    description: 'Classic billiards. Sink your balls then pocket the 8!',
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
  galaga: {
    id: 'galaga',
    name: 'Galaga Station',
    description: 'Blast alien waves in this premium arcade shooter!',
    minPlayers: 1,
    maxPlayers: 2,
    icon: '🚀',
    color: '#06b6d4',
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
