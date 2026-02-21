/**
 * KICKBACK LOUNGE — Board Grid (10x10)
 * Slides & Ladders board with numbered squares, slides, ladders, and player tokens
 */

'use client';

import { LADDERS, SLIDES, PLAYER_COLORS } from '@/lib/games/constants';
import PlayerToken from './PlayerToken';

export default function BoardGrid({ positions = {}, playerOrder = [], lastMove }) {
  // Generate board squares (snake pattern, 91-100 at top, 1-10 at bottom)
  const board = [];
  for (let row = 0; row <= 9; row++) {
    const rowSquares = [];
    for (let col = 0; col < 10; col++) {
      const boardRow = 9 - row; // row 0 on screen = board row 9 (squares 91-100)
      const isEvenRow = boardRow % 2 === 0;
      const num = isEvenRow
        ? boardRow * 10 + col + 1
        : boardRow * 10 + (9 - col) + 1;
      rowSquares.push(num);
    }
    board.push(rowSquares);
  }

  // Map: square number → list of player indices on that square
  const playersOnSquare = {};
  playerOrder.forEach((pid, idx) => {
    const pos = positions[pid] || 0;
    if (pos > 0) {
      if (!playersOnSquare[pos]) playersOnSquare[pos] = [];
      playersOnSquare[pos].push(idx);
    }
  });

  const isLadderBottom = (num) => LADDERS[num] !== undefined;
  const isSlideTop = (num) => SLIDES[num] !== undefined;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="grid grid-cols-10 gap-0.5 bg-white/5 rounded-xl p-1 border border-white/10" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
        {board.flat().map((num) => {
          const hasLadder = isLadderBottom(num);
          const hasSlide = isSlideTop(num);
          const tokens = playersOnSquare[num] || [];
          const isHighlighted = lastMove?.to === num;

          return (
            <div
              key={num}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-all ${
                hasLadder
                  ? 'bg-green-500/20 border border-green-500/30'
                  : hasSlide
                  ? 'bg-red-500/20 border border-red-500/30'
                  : isHighlighted
                  ? 'bg-yellow-500/20 border border-yellow-500/30'
                  : 'bg-white/[0.03]'
              }`}
            >
              {/* Square number */}
              <span className={`text-[9px] ${
                hasLadder ? 'text-green-400' :
                hasSlide ? 'text-red-400' :
                'text-white/20'
              }`}>
                {num}
              </span>

              {/* Ladder/Slide indicator */}
              {hasLadder && (
                <span className="text-[8px] text-green-400">
                  &uarr;{LADDERS[num]}
                </span>
              )}
              {hasSlide && (
                <span className="text-[8px] text-red-400">
                  &darr;{SLIDES[num]}
                </span>
              )}

              {/* Player tokens */}
              {tokens.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                  {tokens.map((idx) => (
                    <PlayerToken
                      key={idx}
                      color={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                      size={tokens.length > 2 ? 'xs' : 'sm'}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500/50" />
          <span className="text-green-400/70">Ladder</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50" />
          <span className="text-red-400/70">Slide</span>
        </div>
      </div>
    </div>
  );
}
