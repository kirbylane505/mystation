/**
 * KICKBACK LOUNGE — Blackjack (21) Game Logic
 * Server-authoritative: all randomness + validation on server
 *
 * Rules:
 * - 2-8 players, each plays independently vs dealer
 * - Dealer hits on soft 16, stands on 17+
 * - Natural blackjack pays 1.5x (cosmetic chips only)
 * - Actions: hit, stand, double (double bet, get exactly 1 more card)
 * - All players act before dealer reveals + plays
 */

import { shuffleDeck, dealCards, handValue, isBlackjack, isBusted } from './deck';

/**
 * Initialize a new Blackjack game
 * @param {string[]} playerIds - array of player IDs in seat order
 * @returns {object} initial game state
 */
export function initBlackjack(playerIds) {
  const deck = shuffleDeck();

  // Deal 2 cards to each player + dealer
  const hands = {};
  for (const pid of playerIds) {
    hands[pid] = dealCards(deck, 2);
  }
  const dealerHand = dealCards(deck, 2);

  // Track which players still need to act
  const playerStatus = {};
  for (const pid of playerIds) {
    const bj = isBlackjack(hands[pid]);
    playerStatus[pid] = {
      status: bj ? 'blackjack' : 'playing', // playing, stood, busted, blackjack
      bet: 100, // default bet (cosmetic chips)
      doubled: false,
    };
  }

  return {
    gameType: 'blackjack',
    deck,
    hands, // { playerId: [card, card, ...] }
    dealerHand,
    dealerRevealed: false, // only first card visible until all players done
    playerStatus, // { playerId: { status, bet, doubled } }
    playerOrder: [...playerIds],
    currentPlayerIndex: findNextActivePlayer(playerIds, playerStatus, 0),
    phase: 'playing', // playing, dealer, finished
    results: null,
  };
}

/**
 * Find next player who still needs to act
 */
function findNextActivePlayer(playerOrder, playerStatus, startIdx) {
  for (let i = startIdx; i < playerOrder.length; i++) {
    if (playerStatus[playerOrder[i]].status === 'playing') {
      return i;
    }
  }
  return -1; // all players done
}

/**
 * Validate and apply a player's move
 * @param {object} state - current game state
 * @param {string} playerId - who's making the move
 * @param {string} action - 'hit', 'stand', or 'double'
 * @returns {{ state: object, valid: boolean, error?: string }}
 */
export function applyBlackjackMove(state, playerId, action) {
  // Validate it's this player's turn
  if (state.phase !== 'playing') {
    return { state, valid: false, error: 'Game is not in playing phase' };
  }

  const currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  if (currentPlayerId !== playerId) {
    return { state, valid: false, error: 'Not your turn' };
  }

  if (state.playerStatus[playerId].status !== 'playing') {
    return { state, valid: false, error: 'You already finished your turn' };
  }

  const newState = {
    ...state,
    hands: { ...state.hands },
    playerStatus: { ...state.playerStatus },
  };
  newState.hands[playerId] = [...state.hands[playerId]];
  newState.playerStatus[playerId] = { ...state.playerStatus[playerId] };

  switch (action) {
    case 'hit': {
      const [card] = dealCards(newState.deck, 1);
      newState.hands[playerId].push(card);

      if (isBusted(newState.hands[playerId])) {
        newState.playerStatus[playerId].status = 'busted';
      }
      break;
    }

    case 'stand': {
      newState.playerStatus[playerId].status = 'stood';
      break;
    }

    case 'double': {
      // Can only double on first action (2 cards)
      if (newState.hands[playerId].length !== 2) {
        return { state, valid: false, error: 'Can only double on initial hand' };
      }

      newState.playerStatus[playerId].doubled = true;
      newState.playerStatus[playerId].bet *= 2;

      const [card] = dealCards(newState.deck, 1);
      newState.hands[playerId].push(card);

      if (isBusted(newState.hands[playerId])) {
        newState.playerStatus[playerId].status = 'busted';
      } else {
        newState.playerStatus[playerId].status = 'stood';
      }
      break;
    }

    default:
      return { state, valid: false, error: `Invalid action: ${action}` };
  }

  // Move to next active player
  newState.currentPlayerIndex = findNextActivePlayer(
    newState.playerOrder,
    newState.playerStatus,
    newState.playerStatus[playerId].status !== 'playing'
      ? newState.currentPlayerIndex + 1
      : newState.currentPlayerIndex
  );

  // If no more active players, move to dealer phase
  if (newState.currentPlayerIndex === -1) {
    return dealerPlay(newState);
  }

  return { state: newState, valid: true };
}

/**
 * Dealer plays their hand after all players are done
 */
function dealerPlay(state) {
  const newState = { ...state, phase: 'dealer', dealerRevealed: true };

  // Check if all players busted — dealer doesn't need to play
  const allBusted = newState.playerOrder.every(
    pid => newState.playerStatus[pid].status === 'busted'
  );

  if (!allBusted) {
    // Dealer hits on 16 or less, stands on 17+
    while (handValue(newState.dealerHand) < 17) {
      const [card] = dealCards(newState.deck, 1);
      newState.dealerHand = [...newState.dealerHand, card];
    }
  }

  // Resolve results
  return resolveBlackjack(newState);
}

/**
 * Resolve the game — determine winners, losers, pushes
 */
function resolveBlackjack(state) {
  const dealerVal = handValue(state.dealerHand);
  const dealerBJ = isBlackjack(state.dealerHand);
  const dealerBust = isBusted(state.dealerHand);

  const results = {};

  for (const pid of state.playerOrder) {
    const playerVal = handValue(state.hands[pid]);
    const playerBJ = isBlackjack(state.hands[pid]);
    const status = state.playerStatus[pid];

    if (status.status === 'busted') {
      results[pid] = { outcome: 'loss', payout: 0, reason: 'Busted' };
    } else if (playerBJ && dealerBJ) {
      results[pid] = { outcome: 'push', payout: status.bet, reason: 'Both Blackjack' };
    } else if (playerBJ) {
      results[pid] = { outcome: 'blackjack', payout: Math.floor(status.bet * 2.5), reason: 'Blackjack!' };
    } else if (dealerBJ) {
      results[pid] = { outcome: 'loss', payout: 0, reason: 'Dealer Blackjack' };
    } else if (dealerBust) {
      results[pid] = { outcome: 'win', payout: status.bet * 2, reason: 'Dealer Bust' };
    } else if (playerVal > dealerVal) {
      results[pid] = { outcome: 'win', payout: status.bet * 2, reason: `${playerVal} beats ${dealerVal}` };
    } else if (playerVal < dealerVal) {
      results[pid] = { outcome: 'loss', payout: 0, reason: `${dealerVal} beats ${playerVal}` };
    } else {
      results[pid] = { outcome: 'push', payout: status.bet, reason: 'Push' };
    }
  }

  return {
    state: { ...state, phase: 'finished', results },
    valid: true,
  };
}

/**
 * Sanitize game state for a specific player
 * Hides other players' cards and deck contents
 */
export function sanitizeBlackjackState(state, playerId) {
  const sanitized = {
    gameType: 'blackjack',
    phase: state.phase,
    playerOrder: state.playerOrder,
    currentPlayerIndex: state.currentPlayerIndex,
    currentPlayerId: state.currentPlayerIndex >= 0 ? state.playerOrder[state.currentPlayerIndex] : null,
    playerStatus: state.playerStatus,
    results: state.results,
    deckRemaining: state.deck.length,
    dealerHand: state.dealerRevealed
      ? state.dealerHand
      : [state.dealerHand[0], { suit: 'hidden', rank: 'hidden', id: 'hidden' }],
    dealerValue: state.dealerRevealed ? handValue(state.dealerHand) : null,
    myHand: state.hands[playerId] || [],
    myValue: state.hands[playerId] ? handValue(state.hands[playerId]) : 0,
    // Other players: show card count only
    otherHands: {},
  };

  for (const pid of state.playerOrder) {
    if (pid !== playerId) {
      // In finished phase, reveal all hands
      if (state.phase === 'finished') {
        sanitized.otherHands[pid] = {
          cards: state.hands[pid],
          value: handValue(state.hands[pid]),
        };
      } else {
        sanitized.otherHands[pid] = {
          cardCount: state.hands[pid].length,
        };
      }
    }
  }

  return sanitized;
}
