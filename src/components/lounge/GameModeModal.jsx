/**
 * KICKBACK LOUNGE — Game Mode Selector Modal
 * Premium mode selection: Quick Play (solo vs AI), With Friends, Find a Game
 * Portal-based, game-themed, animated
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { GAME_TYPES } from '@/lib/games/constants';
import { X, Zap, Users, Globe, ChevronDown, Loader2, Sparkles } from 'lucide-react';

const GAME_TIPS = {
  blackjack: [
    'Hit below 11 — you can\'t bust',
    'Stand on 17+ for safety',
    'Aces count as 1 or 11',
    'Double down on 10 or 11',
  ],
  slidesLadders: [
    'Climb ladders to jump ahead',
    'Watch out for slides that send you back',
    'First to square 100 wins',
    'Roll a 6? Roll again!',
  ],
  pool: [
    'Aim carefully — angles matter',
    'Pocket your set first (solids or stripes)',
    'Sink the 8-ball last to win',
    'Use spin to control the cue ball',
  ],
  spades: [
    'Count tricks before you bid',
    'Lead off-suit to control the round',
    'Save spades for when you need to win',
    'Watch what\'s been played',
  ],
  dominoes: [
    'Match tile numbers to play',
    'Block your opponent\'s moves',
    'Clear your hand first to win',
    'Count tiles to predict opponent\'s hand',
  ],
  quiz: [
    '10 questions per round',
    'Answer faster for bonus points',
    '230 questions across 10 categories',
    'Build streaks for multiplier points',
  ],
};

const MODE_CARDS = [
  {
    key: 'quick',
    icon: Zap,
    title: 'Quick Play',
    subtitle: 'Jump in solo vs AI',
    description: 'Start instantly with a bot opponent. Perfect for practice.',
    iconColor: null, // uses game color
    quickPlay: true,
  },
  {
    key: 'friends',
    icon: Users,
    title: 'With Friends',
    subtitle: 'Create room & invite',
    description: 'Set up a private room and share the invite link.',
    iconColor: '#3b82f6',
    quickPlay: false,
  },
];

export default function GameModeModal({ gameKey, isOpen, onClose, displayName, onNameChange }) {
  const router = useRouter();
  const { createRoom } = useGameStore();
  const [showTips, setShowTips] = useState(false);
  const [loading, setLoading] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Reset tips state when modal opens with different game
  useEffect(() => {
    if (isOpen) setShowTips(false);
  }, [isOpen, gameKey]);

  // ESC to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen || !gameKey) return null;

  const game = GAME_TYPES[gameKey];
  if (!game) return null;

  const needsName = !displayName?.trim();

  const handleCreateRoom = async (quickPlay = false) => {
    if (needsName) return;
    setLoading(quickPlay ? 'quick' : 'friends');
    try {
      const room = await createRoom(gameKey, displayName.trim());
      if (room) {
        router.push(`/lounge/${room.id}`);
        onClose();
      }
    } catch (e) {
      console.error('Failed to create room:', e);
    }
    setLoading(null);
  };

  const handleFindGame = () => {
    onClose();
    setTimeout(() => {
      const el = document.querySelector('[data-section="open-rooms"]');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const playerRange = game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} players`
    : `${game.minPlayers}–${game.maxPlayers} players`;

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#0d1117] border border-white/[0.08] rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'loungeFadeUp 0.35s ease-out' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/70 transition-all duration-200 z-10"
        >
          <X size={16} />
        </button>

        {/* Game Header with icon + glow */}
        <div className="text-center pt-8 pb-5 px-6 relative overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${game.color}12, transparent 70%)` }}
          />

          {/* Animated icon */}
          <div className="relative inline-block mb-4">
            <div
              className="absolute -inset-6 rounded-full blur-2xl"
              style={{
                backgroundColor: game.color,
                opacity: 0.2,
                animation: 'loungeGlow 3s ease-in-out infinite',
              }}
            />
            <span
              className="relative text-6xl block"
              style={{
                animation: 'loungeFloat 3s ease-in-out infinite',
                filter: `drop-shadow(0 4px 16px ${game.color}50)`,
              }}
            >
              {game.icon}
            </span>
          </div>

          <h2 className="text-white font-black text-2xl tracking-tight mb-1.5">{game.name}</h2>
          <p className="text-white/35 text-sm leading-relaxed mb-2">{game.description}</p>
          <span className="inline-block text-white/15 text-xs font-mono bg-white/[0.03] px-3 py-1 rounded-full">
            {playerRange}
          </span>
        </div>

        {/* Name Input — only if not set */}
        {needsName && (
          <div className="px-6 mb-5" style={{ animation: 'loungeFadeUp 0.3s ease-out 0.1s both' }}>
            <label className="text-white/30 text-xs uppercase tracking-wider block mb-2 font-semibold">
              Enter your name to play
            </label>
            <input
              type="text"
              value={displayName || ''}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your display name..."
              maxLength={20}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center placeholder-white/20 focus:outline-none focus:border-white/25 transition"
              autoFocus
            />
          </div>
        )}

        {/* Mode Selection Cards */}
        <div className="px-6 space-y-3 mb-5">
          {/* Quick Play + With Friends — side by side */}
          <div className="grid grid-cols-2 gap-3">
            {MODE_CARDS.map((mode, idx) => {
              const ModeIcon = mode.icon;
              const isLoading = loading === mode.key;
              const iconClr = mode.iconColor || game.color;

              return (
                <button
                  key={mode.key}
                  onClick={() => handleCreateRoom(mode.quickPlay)}
                  disabled={needsName || !!loading}
                  className="group relative p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-1 text-left overflow-hidden"
                  style={{ animation: `loungeFadeUp 0.4s ease-out ${0.15 + idx * 0.08}s both` }}
                >
                  {/* Hover gradient */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${iconClr}08, transparent 70%)` }}
                  />
                  {/* Hover border glow */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 1px ${iconClr}20` }}
                  />

                  <div className="relative">
                    <ModeIcon
                      size={22}
                      className="mb-3 transition-transform duration-300 group-hover:scale-110"
                      style={{ color: iconClr }}
                    />
                    <h3 className="text-white font-bold text-sm mb-0.5">{mode.title}</h3>
                    <p className="text-white/20 text-xs leading-relaxed">{mode.subtitle}</p>

                    {isLoading && (
                      <Loader2 size={14} className="animate-spin text-white/40 mt-2" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Find a Game — full width */}
          <button
            onClick={handleFindGame}
            className="group w-full flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 text-left"
            style={{ animation: 'loungeFadeUp 0.4s ease-out 0.3s both' }}
          >
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
              <div>
                <h3 className="text-white font-bold text-sm">Find a Game</h3>
                <p className="text-white/20 text-xs">Browse & join open rooms</p>
              </div>
            </div>
            <ChevronDown size={14} className="text-white/15 -rotate-90 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* How to Play — Expandable */}
        <div className="px-6 pb-6" style={{ animation: 'loungeFadeUp 0.4s ease-out 0.35s both' }}>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center justify-between w-full px-4 py-3 text-white/25 text-xs uppercase tracking-wider font-semibold hover:text-white/40 transition"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={11} />
                <span>How to Play</span>
              </div>
              <ChevronDown
                size={13}
                className={`transition-transform duration-300 ${showTips ? 'rotate-180' : ''}`}
              />
            </button>
            {showTips && (
              <div className="px-4 pb-3.5 space-y-2" style={{ animation: 'loungeFadeUp 0.25s ease-out' }}>
                {GAME_TIPS[gameKey]?.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <span
                      className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: game.color }}
                    />
                    <span className="text-white/25">{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
