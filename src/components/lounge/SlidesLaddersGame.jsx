/**
 * KICKBACK LOUNGE — Slides & Ladders Game UI
 * 10x10 board + dice roller + player tokens
 */

'use client';

import { useState } from 'react';
import BoardGrid from './board/BoardGrid';
import DiceRoller from './board/DiceRoller';
import { PLAYER_COLORS } from '@/lib/games/constants';

export default function SlidesLaddersGame({ gameState, myPlayerId, onRoll, players }) {
  const [rolling, setRolling] = useState(false);

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const currentPlayerName = players?.find(p => p.user_id === gameState.currentPlayerId)?.display_name || 'Player';

  const handleRoll = async () => {
    if (!isMyTurn || rolling) return;
    setRolling(true);
    await onRoll();
    setTimeout(() => setRolling(false), 1000);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Turn indicator */}
      <div className="text-center">
        {isMyTurn ? (
          <p className="text-blue-400 font-bold text-lg">Your Turn!</p>
        ) : (
          <p className="text-white/50 text-sm">
            Waiting for <span className="text-white font-medium">{currentPlayerName}</span>...
          </p>
        )}
      </div>

      {/* Board */}
      <BoardGrid
        positions={gameState.positions}
        playerOrder={gameState.playerOrder}
        lastMove={gameState.lastMove}
      />

      {/* Player positions legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {gameState.playerOrder.map((pid, idx) => {
          const player = players?.find(p => p.user_id === pid);
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const pos = gameState.positions[pid] || 0;

          return (
            <div key={pid} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className={`text-sm ${pid === myPlayerId ? 'text-blue-400 font-medium' : 'text-white/60'}`}>
                {player?.display_name || 'Player'}: {pos}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dice + Roll Button */}
      <div className="flex flex-col items-center gap-4">
        <DiceRoller
          value={gameState.lastRoll}
          rolling={rolling}
          lastMove={gameState.lastMove}
        />

        <button
          onClick={handleRoll}
          disabled={!isMyTurn || rolling}
          className={`px-10 py-4 rounded-2xl font-black text-xl transition-all ${
            isMyTurn && !rolling
              ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:scale-105'
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          {rolling ? 'Rolling...' : 'Roll Dice'}
        </button>

        {/* Last move info */}
        {gameState.lastMove && (
          <div className="text-center text-sm">
            {gameState.lastMove.ladder && (
              <p className="text-green-400">
                Ladder! {gameState.lastMove.ladder.from} &rarr; {gameState.lastMove.ladder.to}
              </p>
            )}
            {gameState.lastMove.slide && (
              <p className="text-red-400">
                Slide! {gameState.lastMove.slide.from} &rarr; {gameState.lastMove.slide.to}
              </p>
            )}
            {gameState.lastMove.bonusRoll && (
              <p className="text-yellow-400">Rolled a 6 — bonus turn!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
