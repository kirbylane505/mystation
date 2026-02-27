/**
 * KICKBACK LOUNGE — Premium Game Result Ceremony
 * Confetti, animated score counter, streak tracking, rematch CTA
 * Portal-based for clean z-index layering
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '@/store/gameStore';
import { GAME_POINTS } from '@/lib/games/constants';
import { Trophy, RotateCcw, LogOut, Star, Flame, Crown, Swords } from 'lucide-react';

// ── Confetti Canvas ──
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'];

    // Create confetti particles
    particlesRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      opacity: 0.8 + Math.random() * 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particlesRef.current.forEach(p => {
        if (p.y > canvas.height + 20) return;
        alive = true;

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;
        p.speedY += 0.05; // gravity
        p.opacity *= 0.998;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ── Animated Counter ──
function AnimatedCounter({ target, duration = 1200, prefix = '+' }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (current !== start) {
        start = current;
        setValue(current);
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span>{prefix}{value}</span>;
}

export default function GameResult({ result, onPlayAgain, onLeave }) {
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Stagger the details reveal
  useEffect(() => {
    if (mounted && result) {
      const timer = setTimeout(() => setShowDetails(true), 600);
      return () => clearTimeout(timer);
    }
  }, [mounted, result]);

  if (!result || !mounted) return null;

  const isWin = result.outcome === 'win' || result.outcome === 'blackjack';
  const isDraw = result.outcome === 'push';
  const isLoss = !isWin && !isDraw;
  const pointsEarned = isWin ? GAME_POINTS.gameWin : GAME_POINTS.gameLoss;
  const bonusPoints = result.outcome === 'blackjack' ? GAME_POINTS.perfectBlackjack : 0;

  // Get streak from localStorage
  const streakKey = 'ms-lounge-streak';
  let streak = 0;
  try {
    const stored = localStorage.getItem(streakKey);
    streak = stored ? parseInt(stored, 10) : 0;
    if (isWin) {
      streak += 1;
      localStorage.setItem(streakKey, String(streak));
    } else if (isLoss) {
      streak = 0;
      localStorage.setItem(streakKey, '0');
    }
  } catch { /* ignore */ }

  const streakBonus = streak >= 5 ? GAME_POINTS.winStreak5 : streak >= 3 ? GAME_POINTS.winStreak3 : 0;

  const ceremony = createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ animation: 'loungeFadeUp 0.4s ease-out' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Confetti for wins */}
      <ConfettiCanvas active={isWin} />

      {/* Modal */}
      <div
        className="relative z-20 bg-[#0d1117] border border-white/[0.08] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        style={{ animation: 'loungeFadeUp 0.5s ease-out 0.1s both' }}
      >
        {/* Top glow bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background: isWin
              ? 'linear-gradient(90deg, #fbbf24, #f59e0b, #eab308)'
              : isDraw
              ? 'linear-gradient(90deg, #6b7280, #9ca3af, #6b7280)'
              : 'linear-gradient(90deg, #ef4444, #dc2626, #ef4444)',
          }}
        />

        {/* Hero Section */}
        <div className="relative text-center pt-8 pb-6 px-6">
          {/* Background radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isWin
                ? 'radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.12), transparent 70%)'
                : isDraw
                ? 'radial-gradient(ellipse at 50% 30%, rgba(156,163,175,0.08), transparent 70%)'
                : 'radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.08), transparent 70%)',
            }}
          />

          {/* Animated icon */}
          <div className="relative inline-block mb-5">
            {isWin && (
              <div
                className="absolute -inset-6 rounded-full blur-2xl bg-yellow-500/30"
                style={{ animation: 'loungeGlow 2s ease-in-out infinite' }}
              />
            )}
            <div
              className="relative"
              style={{ animation: isWin ? 'loungeFloat 2s ease-in-out infinite' : undefined }}
            >
              {isWin ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Trophy size={48} className="text-white" strokeWidth={2.5} />
                </div>
              ) : isDraw ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                  <Swords size={48} className="text-white" strokeWidth={2} />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/80 to-red-600/80 flex items-center justify-center">
                  <span className="text-5xl">💪</span>
                </div>
              )}
            </div>
          </div>

          {/* Result headline */}
          <h2
            className={`font-black text-4xl mb-2 tracking-tight ${
              isWin ? 'text-yellow-400' : isDraw ? 'text-white/80' : 'text-white'
            }`}
            style={isWin ? { textShadow: '0 0 30px rgba(251,191,36,0.3)' } : {}}
          >
            {isWin ? 'VICTORY!' : isDraw ? 'DRAW' : 'GOOD GAME'}
          </h2>

          <p className="text-white/35 text-sm">{result.reason}</p>
        </div>

        {/* Stats Section — staggered reveal */}
        {showDetails && (
          <div className="px-6 space-y-3 mb-6" style={{ animation: 'loungeFadeUp 0.4s ease-out' }}>
            {/* Points earned */}
            <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <Star size={18} className="text-yellow-400" />
                <span className="text-white/50 text-sm">Points Earned</span>
              </div>
              <span className="text-white font-bold text-xl">
                <AnimatedCounter target={pointsEarned + bonusPoints + streakBonus} />
              </span>
            </div>

            {/* Bonus row — only if applicable */}
            {bonusPoints > 0 && (
              <div
                className="flex items-center justify-between p-3 bg-green-500/[0.05] rounded-xl border border-green-500/10"
                style={{ animation: 'loungeFadeUp 0.3s ease-out 0.1s both' }}
              >
                <div className="flex items-center gap-2.5">
                  <Crown size={16} className="text-green-400" />
                  <span className="text-green-400/70 text-sm">Natural 21 Bonus</span>
                </div>
                <span className="text-green-400 font-bold">+{bonusPoints}</span>
              </div>
            )}

            {/* Streak display */}
            {isWin && streak > 1 && (
              <div
                className="flex items-center justify-between p-3 bg-orange-500/[0.05] rounded-xl border border-orange-500/10"
                style={{ animation: 'loungeFadeUp 0.3s ease-out 0.15s both' }}
              >
                <div className="flex items-center gap-2.5">
                  <Flame size={16} className="text-orange-400" />
                  <span className="text-orange-400/70 text-sm">Win Streak</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold text-lg">{streak}</span>
                  {streakBonus > 0 && (
                    <span className="text-orange-400/60 text-xs bg-orange-500/10 px-2 py-0.5 rounded-full">
                      +{streakBonus} bonus
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Loss encouragement */}
            {isLoss && (
              <p className="text-center text-white/20 text-xs italic py-1">
                Every loss is a lesson. Run it back.
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 hover:text-white/80 rounded-2xl font-medium transition-all duration-300"
          >
            <LogOut size={16} />
            Leave
          </button>
          <button
            onClick={onPlayAgain}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] ${
              isWin
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/20'
                : 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            <RotateCcw size={16} />
            {isWin ? 'Run It Back' : 'Rematch'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  return ceremony;
}
