/**
 * KICKBACK LOUNGE — Deck Utilities
 * Shuffle, deal, hand evaluation (server-side safe with crypto)
 */

import { STANDARD_DECK, CARD_VALUES } from './constants';

/**
 * Cryptographically secure shuffle (Fisher-Yates with crypto.getRandomValues)
 * Server-side only — ensures fairness
 */
export function shuffleDeck(deck = null) {
  const cards = deck ? [...deck] : STANDARD_DECK.map(c => ({ ...c }));

  // Use crypto for secure randomness (works in Node.js and Edge)
  const randomValues = new Uint32Array(cards.length);
  crypto.getRandomValues(randomValues);

  for (let i = cards.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

/**
 * Deal cards from the deck
 * @param {Array} deck - shuffled deck (mutated — cards removed)
 * @param {number} count - number of cards to deal
 * @returns {Array} dealt cards
 */
export function dealCards(deck, count) {
  if (deck.length < count) {
    throw new Error(`Not enough cards: need ${count}, have ${deck.length}`);
  }
  return deck.splice(0, count);
}

/**
 * Calculate the best hand value for Blackjack
 * Handles multiple aces correctly
 * @param {Array} hand - array of card objects {suit, rank}
 * @returns {number} best value (<=21 if possible)
 */
export function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    const values = CARD_VALUES[card.rank];
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else {
      total += values[0];
    }
  }

  // Downgrade aces from 11 to 1 as needed
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

/**
 * Check if hand is a natural blackjack (exactly 2 cards totaling 21)
 */
export function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

/**
 * Check if hand is busted (over 21)
 */
export function isBusted(hand) {
  return handValue(hand) > 21;
}

/**
 * Secure dice roll (1-6)
 * @param {number} count - number of dice
 * @returns {number[]} array of dice values
 */
export function rollDice(count = 1) {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  return Array.from(values).map(v => (v % 6) + 1);
}

/**
 * Generate a short room code (6 chars, alphanumeric uppercase)
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  const values = new Uint32Array(6);
  crypto.getRandomValues(values);
  return Array.from(values).map(v => chars[v % chars.length]).join('');
}

/**
 * Strip hidden info from hand (for sending to other players)
 * Shows card count but not actual cards
 */
export function sanitizeHand(hand) {
  return { cardCount: hand.length };
}
