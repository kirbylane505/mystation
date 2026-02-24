/**
 * KICKBACK LOUNGE — Connect 4 Game UI
 * Classic 6x7 drop-disc game with animations
 */

'use client';

import { useState, useCallback } from 'react';

const ROWS = 6;
const COLS = 7;

// Disc colors: player 0 = red, player 1 = yellow
const DISC_COLORS = ['#ef4444', '#facc15'];
const DISC_GLOW = ['rgba(239,68,68,0.4)', 'rgba(250,204,21,0.4)'];

export default function Connect4Game({ gameState, myPlayerId, onMove, players }) {
  const [hoverCol, setHoverCol] = useState(null);
  const [dropping, setDropping] = useState(false);

  const { board, playerOrder, currentTurn, phase, winner, winLine, lastMove } = gameState;

  const myIndex = playerOrder.indexOf(myPlayerId);
  const isMyTurn = phase === 'playing' && playerOrder[currentTurn] === myPlayerId;
  const currentPlayerName = players?.find(p => p.user_id === playerOrder[currentTurn])?.display_name
    || (playerOrder[currentTurn] === 'ai_opponent' ? 'Bot' : `Player ${currentTurn + 1}`);
  const myColor = myIndex >= 0 ? DISC_COLORS[myIndex] : DISC_COLORS[0];

  const handleDrop = useCallback((col) => {
    if (!isMyTurn || dropping || phase !== 'playing') return;
    // Check column isn't full
    if (board[0][col] !== null) return;

    setDropping(true);
    onMove('drop', { col });
    // Reset dropping after animation
    setTimeout(() => setDropping(false), 400);
  }, [isMyTurn, dropping, phase, board, onMove]);

  // Check if a cell is part of the winning line
  const isWinCell = (r, c) => {
    if (!winLine) return false;
    return winLine.some(cell => cell.r === r && cell.c === c);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Turn indicator */}
      <div className="mb-4 text-center">
        {phase === 'playing' ? (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: DISC_COLORS[currentTurn] }}
            />
            <span className="text-white font-bold text-lg">
              {isMyTurn ? 'Your turn!' : `${currentPlayerName}'s turn`}
            </span>
          </div>
        ) : phase === 'finished' && winner ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-yellow-400 font-bold text-xl">
              {winner === myPlayerId ? 'You win!' : `${currentPlayerName} wins!`}
            </span>
          </div>
        ) : phase === 'finished' ? (
          <span className="text-white/60 font-bold text-xl">Draw!</span>
        ) : null}
      </div>

      {/* Column hover indicators */}
      <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS }, (_, c) => {
          const colFull = board[0][c] !== null;
          const showPreview = isMyTurn && hoverCol === c && !colFull;
          return (
            <div key={`preview-${c}`} className="flex justify-center h-8">
              {showPreview && (
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full animate-bounce opacity-60"
                  style={{ backgroundColor: myColor }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Game board */}
      <div
        className="rounded-2xl p-2 sm:p-3"
        style={{
          background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="grid gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWin = isWinCell(r, c);
              const isLast = lastMove && lastMove.row === r && lastMove.col === c;
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleDrop(c)}
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(null)}
                  disabled={!isMyTurn || board[0][c] !== null}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full
                    transition-all duration-200
                    ${isMyTurn && board[0][c] === null ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  `}
                  style={{
                    backgroundColor: cell !== null ? DISC_COLORS[cell] : 'rgba(0,0,0,0.35)',
                    boxShadow: cell !== null
                      ? isWin
                        ? `0 0 16px 4px ${DISC_GLOW[cell]}, inset 0 2px 4px rgba(255,255,255,0.3)`
                        : `inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.3)`
                      : 'inset 0 2px 8px rgba(0,0,0,0.4)',
                    animation: isLast ? 'dropIn 0.3s ease-out' : isWin ? 'winPulse 1s ease-in-out infinite' : 'none',
                  }}
                  aria-label={`Column ${c + 1}, Row ${r + 1}${cell !== null ? `, Player ${cell + 1}` : ', empty'}`}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Column numbers */}
      <div className="grid gap-1 sm:gap-1.5 mt-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS }, (_, c) => (
          <div key={`num-${c}`} className="text-center text-white/30 text-xs">
            {c + 1}
          </div>
        ))}
      </div>

      {/* Player legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        {playerOrder.map((pid, idx) => {
          const name = players?.find(p => p.user_id === pid)?.display_name
            || (pid === 'ai_opponent' ? 'Bot' : pid === myPlayerId ? 'You' : `Player ${idx + 1}`);
          return (
            <div key={pid} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  backgroundColor: DISC_COLORS[idx],
                  boxShadow: `0 0 8px ${DISC_GLOW[idx]}`,
                }}
              />
              <span className={`text-sm ${pid === myPlayerId ? 'text-white font-bold' : 'text-white/60'}`}>
                {pid === myPlayerId ? 'You' : name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes dropIn {
          0% { transform: translateY(-200%); opacity: 0.5; }
          60% { transform: translateY(5%); }
          80% { transform: translateY(-2%); }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes winPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
