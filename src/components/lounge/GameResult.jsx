/**
 * KICKBACK LOUNGE — Game Result Modal
 * Win/loss display with points earned + play again
 */

'use client';

import { useGameStore } from '@/store/gameStore';
import { GAME_POINTS } from '@/lib/games/constants';
import { Trophy, ThumbsDown, Minus, Star } from 'lucide-react';

export default function GameResult({ result, onPlayAgain, onLeave }) {
  if (!result) return null;

  const isWin = result.outcome === 'win' || result.outcome === 'blackjack';
  const isDraw = result.outcome === 'push';

  const pointsEarned = isWin ? GAME_POINTS.gameWin : GAME_POINTS.gameLoss;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-mystation-navy border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
        {/* Icon */}
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
          isWin ? 'bg-yellow-500/20' : isDraw ? 'bg-white/10' : 'bg-red-500/10'
        }`}>
          {isWin ? (
            <Trophy size={40} className="text-yellow-400" />
          ) : isDraw ? (
            <Minus size={40} className="text-white/50" />
          ) : (
            <ThumbsDown size={40} className="text-red-400" />
          )}
        </div>

        {/* Result Text */}
        <h2 className={`text-3xl font-black mb-2 ${
          isWin ? 'text-yellow-400' : isDraw ? 'text-white' : 'text-red-400'
        }`}>
          {isWin ? 'YOU WIN!' : isDraw ? 'PUSH' : 'YOU LOSE'}
        </h2>

        <p className="text-white/50 text-sm mb-6">{result.reason}</p>

        {/* Points */}
        <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 bg-white/5 rounded-xl">
          <Star size={18} className="text-yellow-400" />
          <span className="text-white font-bold text-lg">+{pointsEarned}</span>
          <span className="text-white/50 text-sm">points</span>
        </div>

        {result.outcome === 'blackjack' && (
          <div className="flex items-center justify-center gap-2 mb-6 py-2 px-3 bg-green-500/10 rounded-lg">
            <span className="text-green-400 text-sm font-medium">
              Natural 21 Bonus: +{GAME_POINTS.perfectBlackjack} pts
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-medium transition"
          >
            Leave
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
