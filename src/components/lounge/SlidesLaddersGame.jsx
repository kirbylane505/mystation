/**
 * KICKBACK LOUNGE — Slides & Ladders Game UI
 * 10x10 board + dice roller + player tokens
 */

'use client';

import { useState, useEffect } from 'react';
import BoardGrid from './board/BoardGrid';
import DiceRoller from './board/DiceRoller';
import { PLAYER_COLORS } from '@/lib/games/constants';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

export default function SlidesLaddersGame({ gameState, myPlayerId, onRoll, players }) {
  const { showGuide, closeGuide } = useAutoShowGuide('slidesLadders');
  const [rolling, setRolling] = useState(false);

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const isBotTurn = gameState.currentPlayerId?.startsWith?.('ai_') && gameState.phase === 'playing';
  const currentPlayerName = players?.find(p => p.user_id === gameState.currentPlayerId)?.display_name
    || (gameState.currentPlayerId?.startsWith?.('ai_') ? 'CPU' : 'Player');

  // AI auto-roll with 1.5s delay
  useEffect(() => {
    if (!isBotTurn || rolling) return;
    const timer = setTimeout(async () => {
      setRolling(true);
      await onRoll();
      setTimeout(() => setRolling(false), 1000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isBotTurn, rolling, onRoll, gameState.turnCount]);

  const handleRoll = async () => {
    if (!isMyTurn || rolling) return;
    setRolling(true);
    await onRoll();
    setTimeout(() => setRolling(false), 1000);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 relative">
      {showGuide && <HowToPlayModal gameId="slidesLadders" isOpen={showGuide} onClose={closeGuide} />}
      <HelpButton gameId="slidesLadders" className="absolute top-2 right-2 z-10" />
      {/* Turn indicator + Dice + Roll Button (always visible at top) */}
      <div className="flex items-center gap-6">
        <DiceRoller
          value={gameState.lastRoll}
          rolling={rolling}
          lastMove={gameState.lastMove}
        />

        <div className="flex flex-col items-center gap-2">
          {isMyTurn ? (
            <p className="text-blue-400 font-bold text-lg">Your Turn!</p>
          ) : (
            <p className="text-white/50 text-sm">
              Waiting for <span className="text-white font-medium">{currentPlayerName}</span>...
            </p>
          )}

          <button
            onClick={handleRoll}
            disabled={!isMyTurn || rolling}
            className={`px-8 py-3 rounded-2xl font-black text-lg transition-all ${
              isMyTurn && !rolling
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:scale-105'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {rolling ? 'Rolling...' : 'Roll Dice'}
          </button>

          {/* Last move info */}
          {gameState.lastMove && (
            <div className="text-center text-xs">
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

      {/* Player positions legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {gameState.playerOrder.map((pid, idx) => {
          const player = players?.find(p => p.user_id === pid);
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const pos = gameState.positions[pid] || 0;
          const name = pid.startsWith('ai_') ? 'CPU' : (player?.display_name || 'Player');

          return (
            <div key={pid} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className={`text-sm ${pid === myPlayerId ? 'text-blue-400 font-medium' : 'text-white/60'}`}>
                {name}: {pos}
              </span>
            </div>
          );
        })}
      </div>

      {/* Board */}
      <BoardGrid
        positions={gameState.positions}
        playerOrder={gameState.playerOrder}
        lastMove={gameState.lastMove}
      />
    </div>
  );
}
