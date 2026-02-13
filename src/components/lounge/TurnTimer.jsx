/**
 * KICKBACK LOUNGE — Turn Timer
 * Countdown for current turn
 */

'use client';

import { useGameStore } from '@/store/gameStore';

export default function TurnTimer() {
  const { turnTimeRemaining } = useGameStore();

  if (turnTimeRemaining === null) return null;

  const isLow = turnTimeRemaining <= 10;
  const percentage = (turnTimeRemaining / 30) * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Circular timer */}
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke={isLow ? '#ef4444' : '#3b82f6'}
            strokeWidth="3"
            strokeDasharray={`${percentage} 100`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
          isLow ? 'text-red-400' : 'text-white'
        }`}>
          {turnTimeRemaining}
        </span>
      </div>

      {isLow && (
        <span className="text-red-400 text-xs font-medium animate-pulse">
          Hurry up!
        </span>
      )}
    </div>
  );
}
