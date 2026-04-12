/**
 * KICKBACK LOUNGE — Spades Game Logic
 * Server-authoritative: 2v2 trick-taking card game
 *
 * Rules:
 * - 4 players, 2 teams (seats 0+2 vs 1+3)
 * - 13 cards each, 13 tricks per round
 * - Bidding phase: each player bids 0-13 (nil = 0 with bonus/penalty)
 * - Play phase: follow suit, spades trump
 * - Spades can't lead until broken (or only spades left)
 * - Scoring: make bid = 10*bid + overtricks as bags
 * - 10 bags = -100 penalty
 * - Nil bid: +100 if made, -100 if not
 * - First team to 500 wins; if both hit 500, higher score wins
 */

import { shuffleDeck, dealCards } from './deck';

const SPADE_RANK_ORDER = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function cardValue(card) {
  return SPADE_RANK_ORDER.indexOf(card.rank);
}

/**
 * Initialize a new Spades game
 * @param {string[]} playerIds - exactly 4 player IDs in seat order
 * @returns {object} initial game state
 */
export function initSpades(playerIds) {
  if (playerIds.length !== 4) {
    throw new Error('Spades requires exactly 4 players');
  }

  const deck = shuffleDeck();

  // Deal 13 cards to each player
  const hands = {};
  for (const pid of playerIds) {
    const cards = dealCards(deck, 13);
    // Sort hand: clubs, diamonds, hearts, spades — then by rank
    cards.sort((a, b) => {
      const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
      const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      if (si !== 0) return si;
      return cardValue(a) - cardValue(b);
    });
    hands[pid] = cards;
  }

  // Determine AI players (marked with prefix)
  const aiPlayers = playerIds.filter(id => id.startsWith('ai_'));

  return {
    gameType: 'spades',
    playerOrder: [...playerIds], // seat 0,1,2,3
    teams: {
      team1: [playerIds[0], playerIds[2]], // seats 0+2
      team2: [playerIds[1], playerIds[3]], // seats 1+3
    },
    hands,
    bids: {}, // { playerId: number }
    tricks: [], // array of completed tricks
    currentTrick: [], // [{playerId, card}]
    trickLeader: null, // who leads the current trick
    currentPlayerIndex: 0, // whose turn to bid/play
    phase: 'bidding', // bidding, playing, scoring, finished
    spadesBroken: false,
    roundScores: { team1: 0, team2: 0 }, // tricks won this round
    totalScores: { team1: 0, team2: 0 }, // cumulative
    totalBags: { team1: 0, team2: 0 },
    tricksWon: {}, // { playerId: count }
    round: 1,
    aiPlayers,
    winner: null,
  };
}

/**
 * Get the team a player belongs to
 */
function getTeam(state, playerId) {
  if (state.teams.team1.includes(playerId)) return 'team1';
  return 'team2';
}

/**
 * Determine which card wins a trick
 */
function trickWinner(trick) {
  const leadSuit = trick[0].card.suit;
  let best = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const c = trick[i];
    if (c.card.suit === 'spades' && best.card.suit !== 'spades') {
      best = c;
    } else if (c.card.suit === best.card.suit && cardValue(c.card) > cardValue(best.card)) {
      best = c;
    }
  }

  return best.playerId;
}

/**
 * Check if player has any cards of a given suit
 */
function hasSuit(hand, suit) {
  return hand.some(c => c.suit === suit);
}

/**
 * Get valid cards a player can play
 */
function getValidPlays(state, playerId) {
  const hand = state.hands[playerId];
  if (!hand || hand.length === 0) return [];

  // If leading
  if (state.currentTrick.length === 0) {
    if (!state.spadesBroken) {
      // Can't lead spades unless only spades left or spades broken
      const nonSpades = hand.filter(c => c.suit !== 'spades');
      if (nonSpades.length > 0) return nonSpades;
    }
    return [...hand]; // all cards valid
  }

  // Must follow suit
  const leadSuit = state.currentTrick[0].card.suit;
  const suitCards = hand.filter(c => c.suit === leadSuit);
  if (suitCards.length > 0) return suitCards;

  // Can't follow suit — play anything
  return [...hand];
}

/**
 * Simple AI bid logic
 */
function aiBid(hand) {
  let bid = 0;

  for (const card of hand) {
    if (card.suit === 'spades') {
      // High spades are reliable tricks
      if (cardValue(card) >= SPADE_RANK_ORDER.indexOf('J')) bid++;
      else if (cardValue(card) >= SPADE_RANK_ORDER.indexOf('9')) bid += 0.5;
    } else {
      // Aces and Kings of other suits
      if (card.rank === 'A') bid++;
      else if (card.rank === 'K') bid += 0.7;
      else if (card.rank === 'Q') bid += 0.3;
    }
  }

  return Math.max(1, Math.round(bid)); // minimum bid of 1 (no nil for AI)
}

/**
 * Simple AI play logic
 */
function aiPlay(state, playerId) {
  const valid = getValidPlays(state, playerId);
  if (valid.length === 0) return null;
  if (valid.length === 1) return valid[0];

  const trick = state.currentTrick;

  if (trick.length === 0) {
    // Leading — play lowest non-spade, or lowest spade if only spades
    const nonSpades = valid.filter(c => c.suit !== 'spades');
    if (nonSpades.length > 0) return nonSpades[0]; // lowest by sort order
    return valid[0];
  }

  const leadSuit = trick[0].card.suit;
  const following = valid[0].suit === leadSuit;

  if (following) {
    // Check if partner is winning
    const partnerIdx = (state.playerOrder.indexOf(playerId) + 2) % 4;
    const partnerId = state.playerOrder[partnerIdx];
    const currentWinner = trickWinner([...trick, { playerId, card: valid[0] }]);

    // Find current winner of played cards
    if (trick.length >= 2) {
      const trickSoFar = [...trick];
      const winnerSoFar = trickWinner(trickSoFar);
      if (winnerSoFar === partnerId) {
        // Partner winning — play lowest
        return valid[0];
      }
    }

    // Try to win with lowest winning card
    const currentBest = trick.reduce((best, t) => {
      if (t.card.suit === 'spades' && best.suit !== 'spades') return t.card;
      if (t.card.suit === best.suit && cardValue(t.card) > cardValue(best)) return t.card;
      return best;
    }, trick[0].card);

    const winners = valid.filter(c => {
      if (c.suit === 'spades' && currentBest.suit !== 'spades') return true;
      if (c.suit === currentBest.suit && cardValue(c) > cardValue(currentBest)) return true;
      return false;
    });

    if (winners.length > 0) return winners[0]; // lowest winner
    return valid[0]; // can't win, play lowest
  }

  // Can't follow suit — consider trumping
  const spades = valid.filter(c => c.suit === 'spades');
  const nonSpades = valid.filter(c => c.suit !== 'spades');

  // Check if partner is winning
  if (trick.length >= 2) {
    const partnerIdx = (state.playerOrder.indexOf(playerId) + 2) % 4;
    const partnerId = state.playerOrder[partnerIdx];
    const winnerSoFar = trickWinner(trick);
    if (winnerSoFar === partnerId) {
      // Partner winning — dump lowest non-spade
      if (nonSpades.length > 0) return nonSpades[0];
      return valid[0];
    }
  }

  // Trump with lowest spade
  if (spades.length > 0) return spades[0];

  // Dump lowest card
  return valid[0];
}

/**
 * Apply a player's move (bid or play)
 */
export function applySpadesMove(state, playerId, action) {
  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  if (currentPlayerId !== playerId) {
    return { state, valid: false, error: 'Not your turn' };
  }

  if (state.phase === 'bidding') {
    return applyBid(state, playerId, action);
  } else if (state.phase === 'playing') {
    return applyPlay(state, playerId, action);
  }

  return { state, valid: false, error: 'Invalid game phase' };
}

/**
 * Apply a bid
 */
function applyBid(state, playerId, action) {
  const bid = typeof action === 'object' ? action.bid : parseInt(action);

  if (isNaN(bid) || bid < 0 || bid > 13) {
    return { state, valid: false, error: 'Bid must be 0-13' };
  }

  const newState = {
    ...state,
    bids: { ...state.bids, [playerId]: bid },
    currentPlayerIndex: state.currentPlayerIndex + 1,
  };

  // Process any AI bids that follow
  while (
    newState.currentPlayerIndex < 4 &&
    newState.aiPlayers.includes(newState.playerOrder[newState.currentPlayerIndex])
  ) {
    const aiId = newState.playerOrder[newState.currentPlayerIndex];
    const aiBidVal = aiBid(newState.hands[aiId]);
    newState.bids[aiId] = aiBidVal;
    newState.currentPlayerIndex++;
  }

  // If all bids in, start playing
  if (Object.keys(newState.bids).length === 4) {
    newState.phase = 'playing';
    newState.currentPlayerIndex = 0; // player 0 leads first trick
    newState.trickLeader = newState.playerOrder[0];
    for (const pid of newState.playerOrder) {
      newState.tricksWon[pid] = 0;
    }

    // If first player is AI, let them play
    return processAiTurns(newState);
  }

  return { state: newState, valid: true };
}

/**
 * Apply a card play
 */
function applyPlay(state, playerId, action) {
  // action is { cardId: 'K_spades' } or the card id string
  const cardId = typeof action === 'object' ? action.cardId : action;

  const hand = state.hands[playerId];
  const cardIdx = hand.findIndex(c => c.id === cardId);

  if (cardIdx === -1) {
    return { state, valid: false, error: 'Card not in your hand' };
  }

  const card = hand[cardIdx];
  const valid = getValidPlays(state, playerId);

  if (!valid.some(c => c.id === cardId)) {
    return { state, valid: false, error: 'Invalid play. Must follow suit.' };
  }

  // Apply the play
  const newState = {
    ...state,
    hands: { ...state.hands },
    currentTrick: [...state.currentTrick, { playerId, card }],
    tricks: [...state.tricks],
    tricksWon: { ...state.tricksWon },
  };

  // Remove card from hand
  newState.hands[playerId] = hand.filter((_, i) => i !== cardIdx);

  // Track spades broken
  if (card.suit === 'spades' && !newState.spadesBroken) {
    newState.spadesBroken = true;
  }

  // If trick complete (4 cards played)
  if (newState.currentTrick.length === 4) {
    const winnerId = trickWinner(newState.currentTrick);
    const winnerTeam = getTeam(newState, winnerId);

    newState.tricks.push({
      cards: newState.currentTrick,
      winner: winnerId,
    });

    newState.tricksWon[winnerId] = (newState.tricksWon[winnerId] || 0) + 1;
    newState.roundScores[winnerTeam]++;
    newState.currentTrick = [];
    newState.trickLeader = winnerId;

    // Set next leader
    newState.currentPlayerIndex = newState.playerOrder.indexOf(winnerId);

    // Check if round over (13 tricks)
    if (newState.tricks.length === 13) {
      return scoreRound(newState);
    }

    // Process AI turns for the new trick
    return processAiTurns(newState);
  }

  // Move to next player
  const leaderIdx = state.playerOrder.indexOf(state.trickLeader);
  const played = newState.currentTrick.length;
  newState.currentPlayerIndex = (leaderIdx + played) % 4;

  // Process AI turns
  return processAiTurns(newState);
}

/**
 * Let AI players take their turns
 */
function processAiTurns(state) {
  const newState = { ...state };

  while (true) {
    const currentId = newState.playerOrder[newState.currentPlayerIndex];
    if (!newState.aiPlayers.includes(currentId)) break;

    const card = aiPlay(newState, currentId);
    if (!card) break;

    // Remove from hand
    newState.hands = { ...newState.hands };
    newState.hands[currentId] = newState.hands[currentId].filter(c => c.id !== card.id);
    newState.currentTrick = [...newState.currentTrick, { playerId: currentId, card }];

    if (card.suit === 'spades' && !newState.spadesBroken) {
      newState.spadesBroken = true;
    }

    // If trick complete
    if (newState.currentTrick.length === 4) {
      const winnerId = trickWinner(newState.currentTrick);
      const winnerTeam = getTeam(newState, winnerId);

      newState.tricks = [...newState.tricks, {
        cards: newState.currentTrick,
        winner: winnerId,
      }];

      newState.tricksWon = { ...newState.tricksWon };
      newState.tricksWon[winnerId] = (newState.tricksWon[winnerId] || 0) + 1;
      newState.roundScores = { ...newState.roundScores };
      newState.roundScores[winnerTeam]++;
      newState.currentTrick = [];
      newState.trickLeader = winnerId;
      newState.currentPlayerIndex = newState.playerOrder.indexOf(winnerId);

      if (newState.tricks.length === 13) {
        return scoreRound(newState);
      }

      continue; // AI might lead next trick too
    }

    // Next player in trick
    const leaderIdx = newState.playerOrder.indexOf(newState.trickLeader);
    const played = newState.currentTrick.length;
    newState.currentPlayerIndex = (leaderIdx + played) % 4;
  }

  return { state: newState, valid: true };
}

/**
 * Score a completed round
 */
function scoreRound(state) {
  const newState = { ...state };
  newState.totalScores = { ...state.totalScores };
  newState.totalBags = { ...state.totalBags };

  for (const team of ['team1', 'team2']) {
    const [p1, p2] = newState.teams[team];
    const teamBid = (newState.bids[p1] || 0) + (newState.bids[p2] || 0);
    const teamTricks = newState.roundScores[team];
    let roundPoints = 0;

    // Handle nil bids
    for (const pid of [p1, p2]) {
      if (newState.bids[pid] === 0) {
        const playerTricks = newState.tricksWon[pid] || 0;
        if (playerTricks === 0) {
          roundPoints += 100; // nil made
        } else {
          roundPoints -= 100; // nil failed
        }
      }
    }

    // Team bid (excluding nil bidders)
    const nonNilBid = [p1, p2]
      .filter(pid => newState.bids[pid] > 0)
      .reduce((sum, pid) => sum + newState.bids[pid], 0);

    const nonNilTricks = teamTricks - [p1, p2]
      .filter(pid => newState.bids[pid] === 0)
      .reduce((sum, pid) => sum + (newState.tricksWon[pid] || 0), 0);

    if (nonNilBid > 0) {
      if (nonNilTricks >= nonNilBid) {
        roundPoints += nonNilBid * 10;
        const bags = nonNilTricks - nonNilBid;
        roundPoints += bags;
        newState.totalBags[team] += bags;

        // Bag penalty
        if (newState.totalBags[team] >= 10) {
          roundPoints -= 100;
          newState.totalBags[team] -= 10;
        }
      } else {
        // Failed to make bid
        roundPoints -= nonNilBid * 10;
      }
    }

    newState.totalScores[team] += roundPoints;
  }

  // Check for winner (500 points)
  const t1 = newState.totalScores.team1;
  const t2 = newState.totalScores.team2;

  if (t1 >= 500 || t2 >= 500) {
    if (t1 >= 500 && t2 >= 500) {
      // Both hit 500 — higher wins
      newState.winner = t1 >= t2 ? 'team1' : 'team2';
    } else {
      newState.winner = t1 >= 500 ? 'team1' : 'team2';
    }
    newState.phase = 'finished';
    newState.results = {
      winner: newState.winner,
      winnerPlayers: newState.teams[newState.winner],
      loserPlayers: newState.teams[newState.winner === 'team1' ? 'team2' : 'team1'],
      finalScores: newState.totalScores,
    };

    // Set individual results for points
    for (const pid of newState.playerOrder) {
      const pTeam = getTeam(newState, pid);
      if (!newState.results[pid]) {
        newState.results[pid] = {
          outcome: pTeam === newState.winner ? 'win' : 'loss',
          reason: pTeam === newState.winner ? 'Your team won!' : 'Your team lost',
        };
      }
    }

    return { state: newState, valid: true };
  }

  // Start next round
  return startNewRound(newState);
}

/**
 * Start a new round (re-deal, re-bid)
 */
function startNewRound(state) {
  const deck = shuffleDeck();
  const newState = {
    ...state,
    hands: {},
    bids: {},
    tricks: [],
    currentTrick: [],
    trickLeader: null,
    currentPlayerIndex: 0,
    phase: 'bidding',
    spadesBroken: false,
    roundScores: { team1: 0, team2: 0 },
    tricksWon: {},
    round: state.round + 1,
  };

  for (const pid of newState.playerOrder) {
    const cards = dealCards(deck, 13);
    cards.sort((a, b) => {
      const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
      const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      if (si !== 0) return si;
      return cardValue(a) - cardValue(b);
    });
    newState.hands[pid] = cards;
  }

  // Process AI bids
  while (
    newState.currentPlayerIndex < 4 &&
    newState.aiPlayers.includes(newState.playerOrder[newState.currentPlayerIndex])
  ) {
    const aiId = newState.playerOrder[newState.currentPlayerIndex];
    newState.bids[aiId] = aiBid(newState.hands[aiId]);
    newState.currentPlayerIndex++;
  }

  if (Object.keys(newState.bids).length === 4) {
    newState.phase = 'playing';
    newState.currentPlayerIndex = 0;
    newState.trickLeader = newState.playerOrder[0];
    for (const pid of newState.playerOrder) {
      newState.tricksWon[pid] = 0;
    }
    return processAiTurns(newState);
  }

  return { state: newState, valid: true };
}

/**
 * Sanitize state for a specific player — hide other hands
 */
export function sanitizeSpadesState(state, playerId) {
  const sanitized = {
    gameType: 'spades',
    phase: state.phase,
    round: state.round,
    playerOrder: state.playerOrder,
    teams: state.teams,
    bids: state.phase !== 'bidding' ? state.bids : {
      // Only show bids already placed
      ...Object.fromEntries(
        Object.entries(state.bids).filter(([pid]) => {
          const pidIdx = state.playerOrder.indexOf(pid);
          const currentIdx = state.currentPlayerIndex;
          return pidIdx < currentIdx;
        })
      ),
      // Always show own bid
      ...(state.bids[playerId] !== undefined ? { [playerId]: state.bids[playerId] } : {}),
    },
    currentPlayerIndex: state.currentPlayerIndex,
    currentPlayerId: state.playerOrder[state.currentPlayerIndex],
    currentTrick: state.currentTrick,
    trickLeader: state.trickLeader,
    spadesBroken: state.spadesBroken,
    roundScores: state.roundScores,
    totalScores: state.totalScores,
    totalBags: state.totalBags,
    tricksWon: state.tricksWon,
    tricksPlayed: state.tricks.length,
    lastTrick: state.tricks.length > 0 ? state.tricks[state.tricks.length - 1] : null,
    myHand: state.hands[playerId] || [],
    myTeam: getTeam(state, playerId),
    results: state.results,
    winner: state.winner,
    aiPlayers: state.aiPlayers,
    validPlays: state.phase === 'playing' && state.playerOrder[state.currentPlayerIndex] === playerId
      ? getValidPlays(state, playerId).map(c => c.id)
      : [],
    otherHandCounts: {},
  };

  for (const pid of state.playerOrder) {
    if (pid !== playerId) {
      sanitized.otherHandCounts[pid] = state.hands[pid]?.length || 0;
    }
  }

  return sanitized;
}
