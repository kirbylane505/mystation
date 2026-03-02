/**
 * KICKBACK LOUNGE — Arcade Blackjack (Solo Trainer)
 * 3 modes: Free Play, Strategy Trainer, Challenge Mode
 * Standalone — no server, no Supabase, no multiplayer
 * Kid-friendly, Blackjackist-style
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SUITS, RANKS, CARD_VALUES } from '@/lib/games/constants';
import Card from './cards/Card';
import CardFan from './cards/CardFan';
import { ArrowLeft, Zap, Brain, Trophy, Plus, Hand, RotateCcw } from 'lucide-react';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

/* ─── Card / Deck Logic (internal) ─── */

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}_${suit}` });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 11; }
    else if (['J', 'Q', 'K'].includes(c.rank)) total += 10;
    else total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isSoftHand(cards) {
  let total = 0, aces = 0;
  for (const c of cards) {
    if (c.rank === 'A') { aces++; total += 11; }
    else if (['J', 'Q', 'K'].includes(c.rank)) total += 10;
    else total += parseInt(c.rank);
  }
  let softAces = aces;
  while (total > 21 && softAces > 0) { total -= 10; softAces--; }
  return softAces > 0;
}

function dealerCardValue(card) {
  if (!card) return 0;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

/* ─── Basic Strategy Engine ─── */

function getOptimalMove(playerTotal, dealerUpCard, isSoft, canDouble) {
  const d = dealerCardValue(dealerUpCard);
  if (canDouble && playerTotal === 11) return 'DOUBLE';
  if (canDouble && playerTotal === 10 && d < 10) return 'DOUBLE';
  if (isSoft) {
    if (playerTotal >= 19) return 'STAND';
    if (playerTotal === 18 && d >= 9) return 'HIT';
    if (playerTotal === 18) return 'STAND';
    return 'HIT';
  }
  if (playerTotal >= 17) return 'STAND';
  if (playerTotal >= 13 && d <= 6) return 'STAND';
  if (playerTotal === 12 && d >= 4 && d <= 6) return 'STAND';
  return 'HIT';
}

/* ─── Sound Effects (Web Audio API) ─── */

const audioCtxRef = { current: null };

function getAudioCtx() {
  if (!audioCtxRef.current) {
    try {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  return audioCtxRef.current;
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playCardDeal() {
  playTone(800, 0.06, 'square', 0.08);
}

function playWin() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [523, 659, 784].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sine', 0.12), i * 100);
  });
}

function playLose() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [400, 350, 300].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.25, 'triangle', 0.1), i * 120);
  });
}

function playBlackjack() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'sine', 0.15), i * 80);
  });
}

/* ─── Challenge Mode Rating ─── */

function getRating(score) {
  if (score >= 901) return { label: 'Casino Legend', color: 'text-yellow-300', bg: 'from-yellow-500/30 to-amber-500/30' };
  if (score >= 601) return { label: 'High Roller', color: 'text-emerald-300', bg: 'from-emerald-500/30 to-green-500/30' };
  if (score >= 301) return { label: 'Card Counter', color: 'text-cyan-300', bg: 'from-cyan-500/30 to-blue-500/30' };
  return { label: 'Rookie', color: 'text-white/60', bg: 'from-white/10 to-white/5' };
}

/* ─── localStorage key ─── */
const BEST_SCORE_KEY = 'ms-arcade-blackjack-best';

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function ArcadeBlackjackGame({ onBack }) {
  const { showGuide, closeGuide } = useAutoShowGuide('arcadeBlackjack');

  // Screens: 'select' | 'freePlay' | 'trainer' | 'challenge'
  const [mode, setMode] = useState('select');

  // Game state
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'playing' | 'dealerTurn' | 'result'
  const [result, setResult] = useState(null); // { type: 'WIN'|'LOSE'|'PUSH'|'BLACKJACK', message: '' }
  const [dealAnimating, setDealAnimating] = useState(false);
  const [dealerRevealed, setDealerRevealed] = useState(false);

  // Free Play / Trainer stats (session only)
  const [stats, setStats] = useState({ wins: 0, losses: 0, pushes: 0, blackjacks: 0 });

  // Trainer-specific
  const [optimalHint, setOptimalHint] = useState(null);
  const [correctDecisions, setCorrectDecisions] = useState(0);
  const [totalDecisions, setTotalDecisions] = useState(0);
  const [moveFlash, setMoveFlash] = useState(null); // 'correct' | 'wrong' | null
  const [lastOptimalWas, setLastOptimalWas] = useState(null);

  // Challenge-specific
  const [challengeHand, setChallengeHand] = useState(0); // 0-9
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeDoubled, setChallengeDoubled] = useState(false);
  const [challengeFinished, setChallengeFinished] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  // Refs
  const moveFlashTimeout = useRef(null);
  const resultTimeout = useRef(null);

  // Load best score on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BEST_SCORE_KEY);
      if (stored) setBestScore(parseInt(stored, 10) || 0);
    } catch { /* ignore */ }
  }, []);

  // Save best score
  const saveBestScore = useCallback((score) => {
    if (score > bestScore) {
      setBestScore(score);
      try { localStorage.setItem(BEST_SCORE_KEY, String(score)); } catch { /* ignore */ }
    }
  }, [bestScore]);

  /* ─── Deal a new hand ─── */
  const dealNewHand = useCallback(() => {
    const newDeck = createDeck();
    const pCards = [newDeck.pop(), newDeck.pop()];
    const dCards = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setPlayerHand(pCards);
    setDealerHand(dCards);
    setDealerRevealed(false);
    setResult(null);
    setMoveFlash(null);
    setLastOptimalWas(null);
    setChallengeDoubled(false);
    setDealAnimating(true);

    playCardDeal();

    const pVal = handValue(pCards);
    const isPlayerBJ = pCards.length === 2 && pVal === 21;

    if (isPlayerBJ) {
      setTimeout(() => {
        setDealAnimating(false);
        resolveHand(pCards, dCards, newDeck, true);
      }, 800);
    } else {
      setTimeout(() => {
        setDealAnimating(false);
        setPhase('playing');
        // Set optimal hint for trainer mode
        if (mode === 'trainer') {
          const soft = isSoftHand(pCards);
          const opt = getOptimalMove(pVal, dCards[0], soft, true);
          setOptimalHint(opt);
        }
      }, 600);
    }

    setPhase('playing');
  }, [mode]);

  /* ─── Player actions ─── */
  const handleHit = useCallback(() => {
    if (phase !== 'playing') return;

    // Trainer: check if HIT was optimal
    if (mode === 'trainer') {
      checkTrainerMove('HIT');
    }

    playCardDeal();
    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, newCard];
    setDeck(newDeck);
    setPlayerHand(newHand);

    const val = handValue(newHand);
    if (val > 21) {
      // Busted
      resolveHand(newHand, dealerHand, newDeck, false);
    } else if (val === 21) {
      // Auto-stand on 21
      resolveHand(newHand, dealerHand, newDeck, false);
    } else {
      // Update optimal hint
      if (mode === 'trainer') {
        const soft = isSoftHand(newHand);
        const opt = getOptimalMove(val, dealerHand[0], soft, false);
        setOptimalHint(opt);
      }
    }
  }, [phase, deck, playerHand, dealerHand, mode]);

  const handleStand = useCallback(() => {
    if (phase !== 'playing') return;

    if (mode === 'trainer') {
      checkTrainerMove('STAND');
    }

    resolveHand(playerHand, dealerHand, deck, false);
  }, [phase, playerHand, dealerHand, deck, mode]);

  const handleDouble = useCallback(() => {
    if (phase !== 'playing' || playerHand.length !== 2) return;

    if (mode === 'trainer') {
      checkTrainerMove('DOUBLE');
    }

    setChallengeDoubled(true);
    playCardDeal();
    const newDeck = [...deck];
    const newCard = newDeck.pop();
    const newHand = [...playerHand, newCard];
    setDeck(newDeck);
    setPlayerHand(newHand);

    resolveHand(newHand, dealerHand, newDeck, false);
  }, [phase, playerHand, dealerHand, deck, mode]);

  /* ─── Trainer move checking ─── */
  const checkTrainerMove = useCallback((playerMove) => {
    const pVal = handValue(playerHand);
    const soft = isSoftHand(playerHand);
    const canDbl = playerHand.length === 2;
    const optimal = getOptimalMove(pVal, dealerHand[0], soft, canDbl);
    const isCorrect = playerMove === optimal;

    setTotalDecisions(prev => prev + 1);
    if (isCorrect) {
      setCorrectDecisions(prev => prev + 1);
      setMoveFlash('correct');
    } else {
      setMoveFlash('wrong');
      setLastOptimalWas(optimal);
    }

    if (moveFlashTimeout.current) clearTimeout(moveFlashTimeout.current);
    moveFlashTimeout.current = setTimeout(() => setMoveFlash(null), 1500);
  }, [playerHand, dealerHand]);

  /* ─── Dealer plays and resolve ─── */
  const resolveHand = useCallback((pHand, dHand, currentDeck, isPlayerBJ) => {
    setPhase('dealerTurn');
    setDealerRevealed(true);

    const pVal = handValue(pHand);
    const playerBusted = pVal > 21;
    const playerBJ = isPlayerBJ || (pHand.length === 2 && pVal === 21);

    let finalDealerHand = [...dHand];

    // Dealer plays only if player hasn't busted
    if (!playerBusted) {
      while (handValue(finalDealerHand) < 17) {
        const card = currentDeck.pop();
        if (!card) break;
        finalDealerHand.push(card);
      }
    }

    setDealerHand(finalDealerHand);
    setDeck(currentDeck);

    const dVal = handValue(finalDealerHand);
    const dealerBJ = dHand.length === 2 && handValue(dHand) === 21;
    const dealerBusted = dVal > 21;

    let resultType, message;

    if (playerBusted) {
      resultType = 'LOSE';
      message = 'Busted! Better luck next time.';
    } else if (playerBJ && dealerBJ) {
      resultType = 'PUSH';
      message = 'Both got Blackjack! Push.';
    } else if (playerBJ) {
      resultType = 'BLACKJACK';
      message = 'BLACKJACK! Amazing!';
    } else if (dealerBJ) {
      resultType = 'LOSE';
      message = 'Dealer got Blackjack!';
    } else if (dealerBusted) {
      resultType = 'WIN';
      message = 'Dealer busted! You win!';
    } else if (pVal > dVal) {
      resultType = 'WIN';
      message = `${pVal} beats ${dVal}! Nice!`;
    } else if (pVal < dVal) {
      resultType = 'LOSE';
      message = `Dealer wins ${dVal} to ${pVal}.`;
    } else {
      resultType = 'PUSH';
      message = 'Push! It\'s a tie.';
    }

    setTimeout(() => {
      setResult({ type: resultType, message });
      setPhase('result');

      // Play sound
      if (resultType === 'BLACKJACK') playBlackjack();
      else if (resultType === 'WIN') playWin();
      else if (resultType === 'LOSE') playLose();

      // Update session stats
      setStats(prev => ({
        wins: prev.wins + (resultType === 'WIN' ? 1 : 0),
        losses: prev.losses + (resultType === 'LOSE' ? 1 : 0),
        pushes: prev.pushes + (resultType === 'PUSH' ? 1 : 0),
        blackjacks: prev.blackjacks + (resultType === 'BLACKJACK' ? 1 : 0),
      }));

      // Challenge scoring
      if (mode === 'challenge' && !challengeFinished) {
        let points = 0;
        if (resultType === 'WIN') points = 100;
        else if (resultType === 'BLACKJACK') points = 250;
        else if (resultType === 'PUSH') points = 25;
        // Double multiplier
        if (challengeDoubled) points *= 2;

        setChallengeScore(prev => prev + points);

        // Check if last hand
        const handNum = challengeHand + 1;
        setChallengeHand(handNum);
        if (handNum >= 10) {
          setChallengeFinished(true);
          const finalScore = challengeScore + points;
          saveBestScore(finalScore);
        }
      }
    }, 500);
  }, [mode, challengeHand, challengeScore, challengeDoubled, challengeFinished, saveBestScore]);

  /* ─── Reset for new hand ─── */
  const handleDealAgain = useCallback(() => {
    setResult(null);
    setPhase('idle');
    setMoveFlash(null);
    setLastOptimalWas(null);
    setOptimalHint(null);
    dealNewHand();
  }, [dealNewHand]);

  /* ─── Enter a mode ─── */
  const enterMode = useCallback((m) => {
    setMode(m);
    setPhase('idle');
    setResult(null);
    setPlayerHand([]);
    setDealerHand([]);
    setStats({ wins: 0, losses: 0, pushes: 0, blackjacks: 0 });
    setCorrectDecisions(0);
    setTotalDecisions(0);
    setOptimalHint(null);
    setMoveFlash(null);
    setLastOptimalWas(null);
    setChallengeHand(0);
    setChallengeScore(0);
    setChallengeDoubled(false);
    setChallengeFinished(false);
  }, []);

  /* ─── Derived values ─── */
  const playerValue = playerHand.length > 0 ? handValue(playerHand) : 0;
  const dealerValue = dealerRevealed && dealerHand.length > 0 ? handValue(dealerHand) : (dealerHand[0] ? dealerCardValue(dealerHand[0]) : 0);
  const canDouble = phase === 'playing' && playerHand.length === 2;
  const accuracyPct = totalDecisions > 0 ? Math.round((correctDecisions / totalDecisions) * 100) : 0;

  /* ═══════════════════════ RENDER ═══════════════════════ */

  /* ─── MODE SELECT SCREEN ─── */
  if (mode === 'select') {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center px-4">
        {/* Back button */}
        <div className="w-full flex items-start mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">Blackjack Trainer</h2>
        <p className="text-white/40 text-sm mb-8">Pick your mode and hit the table</p>

        <div className="w-full flex flex-col gap-4">
          {/* Free Play */}
          <button
            onClick={() => enterMode('freePlay')}
            className="w-full text-left p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/20 hover:border-emerald-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Zap size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">Free Play</h3>
                <p className="text-white/40 text-sm">Practice with no pressure</p>
              </div>
            </div>
          </button>

          {/* Strategy Trainer */}
          <button
            onClick={() => enterMode('trainer')}
            className="w-full text-left p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-500/20 hover:border-blue-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Brain size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition">Strategy Trainer</h3>
                <p className="text-white/40 text-sm">Learn the optimal move</p>
              </div>
            </div>
          </button>

          {/* Challenge Mode */}
          <button
            onClick={() => enterMode('challenge')}
            className="w-full text-left p-5 rounded-2xl bg-gradient-to-r from-amber-900/40 to-amber-800/20 border border-amber-500/20 hover:border-amber-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition">Challenge Mode</h3>
                <p className="text-white/40 text-sm">10 hands, maximize your score</p>
              </div>
            </div>
          </button>
        </div>

        {bestScore > 0 && (
          <p className="text-white/30 text-xs mt-6">
            Best challenge score: <span className="text-yellow-400 font-bold">{bestScore}</span>
          </p>
        )}
      </div>
    );
  }

  /* ─── CHALLENGE FINISHED SCREEN ─── */
  if (mode === 'challenge' && challengeFinished) {
    const rating = getRating(challengeScore);
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center px-4">
        <div className="w-full text-center py-8">
          <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">Challenge Complete!</h2>

          <div className={`inline-block px-6 py-3 rounded-2xl bg-gradient-to-r ${rating.bg} mt-4 mb-2`}>
            <p className={`text-2xl font-black ${rating.color}`}>{challengeScore} pts</p>
            <p className={`text-sm font-bold ${rating.color} opacity-80`}>{rating.label}</p>
          </div>

          {challengeScore >= bestScore && challengeScore > 0 && (
            <p className="text-yellow-400 text-sm font-bold mt-2 animate-pulse">New Best Score!</p>
          )}

          <div className="grid grid-cols-4 gap-3 mt-6 text-center">
            <div>
              <p className="text-white/40 text-xs">Wins</p>
              <p className="text-emerald-400 font-bold text-lg">{stats.wins}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Losses</p>
              <p className="text-red-400 font-bold text-lg">{stats.losses}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Pushes</p>
              <p className="text-yellow-400 font-bold text-lg">{stats.pushes}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">BJ!</p>
              <p className="text-yellow-300 font-bold text-lg">{stats.blackjacks}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-8">
            <button
              onClick={() => enterMode('challenge')}
              className="px-10 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30"
            >
              Play Again
            </button>
            <button
              onClick={() => setMode('select')}
              className="text-white/40 hover:text-white text-sm transition"
            >
              Back to Modes
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── GAME SCREEN (shared by all 3 modes) ─── */
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center relative">
      {showGuide && <HowToPlayModal gameId="arcadeBlackjack" isOpen={showGuide} onClose={closeGuide} />}
      <HelpButton gameId="arcadeBlackjack" className="absolute top-2 right-2 z-10" />
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <button
          onClick={() => setMode('select')}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition text-sm"
        >
          <ArrowLeft size={16} />
          Modes
        </button>
        <h2 className="text-lg font-black text-white">
          {mode === 'freePlay' && 'Free Play'}
          {mode === 'trainer' && 'Strategy Trainer'}
          {mode === 'challenge' && 'Challenge Mode'}
        </h2>
        <div className="w-12" /> {/* spacer */}
      </div>

      {/* Stats Bar */}
      <div className="w-full flex items-center justify-center gap-4 mb-4 px-2">
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 font-bold text-sm">W</span>
          <span className="text-white font-black text-sm">{stats.wins}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-400 font-bold text-sm">L</span>
          <span className="text-white font-black text-sm">{stats.losses}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 font-bold text-sm">P</span>
          <span className="text-white font-black text-sm">{stats.pushes}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-300 font-bold text-sm">BJ</span>
          <span className="text-white font-black text-sm">{stats.blackjacks}</span>
        </div>

        {/* Trainer accuracy */}
        {mode === 'trainer' && totalDecisions > 0 && (
          <div className="flex items-center gap-1 ml-2 bg-cyan-500/10 px-2 py-0.5 rounded-lg">
            <Brain size={12} className="text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xs">{accuracyPct}%</span>
          </div>
        )}
      </div>

      {/* Challenge Progress Bar */}
      {mode === 'challenge' && !challengeFinished && (
        <div className="w-full mb-4 px-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/50 text-xs font-bold">Hand {Math.min(challengeHand + 1, 10)} of 10</span>
            <span className="text-amber-400 text-xs font-black">{challengeScore} pts</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${(challengeHand / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ═══ CASINO TABLE ═══ */}
      <div
        className="w-full rounded-2xl"
        style={{
          background: 'radial-gradient(ellipse at center, #1a5c2e 0%, #14532d 40%, #0c3b1e 80%, #052e16 100%)',
          border: '3px solid #1a3a28',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="p-4 sm:p-6 flex flex-col items-center gap-5">
          {/* Dealer Area */}
          <div className="text-center w-full">
            <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-lg mb-3">
              <span className="text-emerald-300/70 text-xs font-bold uppercase tracking-widest">Dealer</span>
              {dealerHand.length > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-black ${
                  dealerRevealed && handValue(dealerHand) > 21 ? 'bg-red-500/30 text-red-300' :
                  dealerRevealed && handValue(dealerHand) === 21 ? 'bg-emerald-500/30 text-emerald-300' :
                  'bg-white/10 text-white/70'
                }`}>
                  {dealerRevealed ? handValue(dealerHand) : dealerCardValue(dealerHand[0])}
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              {dealerHand.map((card, i) => (
                <div
                  key={card.id || i}
                  className="transition-all duration-500"
                  style={{
                    opacity: dealAnimating ? 0 : 1,
                    transform: dealAnimating ? 'translateX(60px) translateY(-30px) rotate(10deg)' : 'translateX(0) translateY(0) rotate(0deg)',
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  <Card
                    suit={!dealerRevealed && i === 1 ? 'hidden' : card.suit}
                    rank={!dealerRevealed && i === 1 ? 'hidden' : card.rank}
                    faceDown={!dealerRevealed && i === 1}
                    size="md"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-white/5" />

          {/* Player Area */}
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2 mb-3">
              {playerHand.map((card, i) => (
                <div
                  key={card.id || i}
                  className="transition-all duration-500"
                  style={{
                    opacity: dealAnimating ? 0 : 1,
                    transform: dealAnimating ? 'translateX(-60px) translateY(30px) rotate(-10deg)' : 'translateX(0) translateY(0) rotate(0deg)',
                    transitionDelay: `${i * 150 + 300}ms`,
                  }}
                >
                  <Card suit={card.suit} rank={card.rank} size="md" />
                </div>
              ))}
            </div>
            {playerHand.length > 0 && (
              <div className="mt-2">
                <span className={`inline-block px-4 py-1 rounded-full text-lg font-black ${
                  playerValue > 21 ? 'bg-red-500/30 text-red-300' :
                  playerValue === 21 ? 'bg-emerald-500/30 text-emerald-300' :
                  'bg-white/10 text-white'
                }`}>
                  {playerValue}
                </span>
              </div>
            )}
          </div>

          {/* Strategy Hint */}
          {mode === 'trainer' && phase === 'playing' && optimalHint && !dealAnimating && (
            <div className={`w-full text-center px-4 py-2 rounded-xl ${
              moveFlash === 'correct' ? 'bg-emerald-500/20 border border-emerald-500/30' :
              moveFlash === 'wrong' ? 'bg-red-500/20 border border-red-500/30' :
              'bg-cyan-500/10 border border-cyan-500/20'
            } transition-all duration-300`}>
              {moveFlash === 'correct' && (
                <p className="text-emerald-400 text-sm font-bold">You played optimally!</p>
              )}
              {moveFlash === 'wrong' && (
                <p className="text-red-400 text-sm font-bold">Optimal was: {lastOptimalWas}</p>
              )}
              {!moveFlash && (
                <p className="text-cyan-400/80 text-sm">
                  Optimal: <span className="font-black text-cyan-300">{optimalHint}</span>
                </p>
              )}
            </div>
          )}

          {/* Result Flash */}
          {result && phase === 'result' && (
            <div className={`w-full text-center py-4 rounded-xl font-black text-2xl ${
              result.type === 'BLACKJACK' ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300' :
              result.type === 'WIN' ? 'bg-emerald-500/20 text-emerald-300' :
              result.type === 'LOSE' ? 'bg-red-500/20 text-red-300' :
              'bg-white/10 text-yellow-200'
            }`} style={{ animation: 'abjScaleIn 0.35s ease-out' }}>
              {result.type === 'BLACKJACK' && 'BLACKJACK!'}
              {result.type === 'WIN' && 'YOU WIN!'}
              {result.type === 'LOSE' && 'YOU LOSE'}
              {result.type === 'PUSH' && 'PUSH'}
              <p className="text-sm font-bold mt-1 opacity-70">{result.message}</p>

              {/* Trainer post-hand feedback */}
              {mode === 'trainer' && lastOptimalWas && (
                <p className="text-red-400/70 text-xs mt-2">Tip: The optimal move was {lastOptimalWas}</p>
              )}
              {mode === 'trainer' && !lastOptimalWas && totalDecisions > 0 && (
                <p className="text-emerald-400/70 text-xs mt-2">Great decision-making this hand!</p>
              )}

              {/* Challenge scoring */}
              {mode === 'challenge' && (
                <p className="text-amber-400/70 text-xs mt-2">
                  +{result.type === 'WIN' ? (challengeDoubled ? 200 : 100) :
                    result.type === 'BLACKJACK' ? (challengeDoubled ? 500 : 250) :
                    result.type === 'PUSH' ? (challengeDoubled ? 50 : 25) : 0} pts
                </p>
              )}
            </div>
          )}

          {/* ═══ CONTROLS ═══ */}
          {phase === 'idle' && (
            <button
              onClick={dealNewHand}
              className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95"
            >
              Deal
            </button>
          )}

          {phase === 'playing' && !dealAnimating && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleHit}
                className={`px-6 sm:px-8 py-3 rounded-xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 ${
                  mode === 'trainer' && optimalHint === 'HIT'
                    ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/40 ring-2 ring-cyan-400'
                    : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/30'
                }`}
              >
                <Plus size={18} />
                Hit
              </button>
              <button
                onClick={handleStand}
                className={`px-6 sm:px-8 py-3 rounded-xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 ${
                  mode === 'trainer' && optimalHint === 'STAND'
                    ? 'bg-white/15 hover:bg-white/25 text-white ring-2 ring-cyan-400'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Hand size={18} />
                Stand
              </button>
              {canDouble && (
                <button
                  onClick={handleDouble}
                  className={`px-6 sm:px-8 py-3 rounded-xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 border ${
                    mode === 'trainer' && optimalHint === 'DOUBLE'
                      ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/40 ring-2 ring-cyan-400'
                      : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30'
                  }`}
                >
                  <Zap size={18} />
                  Double
                </button>
              )}
            </div>
          )}

          {phase === 'result' && (
            <button
              onClick={handleDealAgain}
              className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95"
            >
              {mode === 'challenge' && challengeHand >= 10 ? 'See Results' : 'Deal Again'}
            </button>
          )}
        </div>
      </div>

      {/* Encouraging messages area */}
      {phase === 'idle' && (
        <div className="mt-4 text-center">
          {mode === 'freePlay' && (
            <p className="text-white/30 text-sm">Hit Deal to start a hand. Have fun!</p>
          )}
          {mode === 'trainer' && (
            <p className="text-white/30 text-sm">The optimal play will be shown after each deal.</p>
          )}
          {mode === 'challenge' && (
            <p className="text-white/30 text-sm">Win = 100pts, Blackjack = 250pts, Push = 25pts. Doubles count 2x!</p>
          )}
        </div>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes abjScaleIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
