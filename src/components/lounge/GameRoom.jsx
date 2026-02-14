/**
 * KICKBACK LOUNGE — Game Room Wrapper
 * Universal room container: game area + sidebar (players + chat)
 */

'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import PlayerList from './PlayerList';
import ChatPanel from './ChatPanel';
import Scoreboard from './Scoreboard';
import InviteModal from './InviteModal';
import TurnTimer from './TurnTimer';
import GameResult from './GameResult';
import BlackjackGame from './BlackjackGame';
import SlidesLaddersGame from './SlidesLaddersGame';
import PoolGame from './PoolGame';
import SpadesGame from './SpadesGame';
import { Users, Share2, Play, LogOut, Loader2 } from 'lucide-react';

export default function GameRoom() {
  const [showInvite, setShowInvite] = useState(false);
  const {
    room, players, gameState, myPlayerId,
    toggleReady, startGame, leaveRoom, fetchGameState, submitMove,
  } = useGameStore();

  // Fetch personalized game state on mount + when broadcast triggers
  useEffect(() => {
    if (room?.status === 'playing') {
      fetchGameState();
    }
  }, [room?.status, fetchGameState]);

  // Also re-fetch when gameState changes via broadcast (to get personal view)
  useEffect(() => {
    if (gameState && room?.status === 'playing' && gameState.myHand === undefined && (room.game_type === 'blackjack' || room.game_type === 'spades')) {
      fetchGameState();
    }
  }, [gameState, room, fetchGameState]);

  if (!room) return null;

  const isHost = room.host_id === myPlayerId;
  const allReady = players.filter(p => p.user_id !== room.host_id).every(p => p.ready);
  const canStart = isHost && allReady && players.length >= 1;
  const isPlaying = room.status === 'playing';
  const isFinished = room.status === 'finished' || gameState?.phase === 'finished';

  // Get my result for the result modal
  const myResult = isFinished && gameState?.results?.[myPlayerId]
    ? gameState.results[myPlayerId]
    : isFinished && gameState?.winner
    ? { outcome: gameState.winner === myPlayerId ? 'win' : 'loss', reason: gameState.winner === myPlayerId ? 'You reached 100!' : 'Another player won' }
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[70vh]">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-xl">
              {room.game_type === 'blackjack' ? '21 (Blackjack)' : room.game_type === 'pool' ? '8-Ball Pool' : room.game_type === 'spades' ? 'Spades' : 'Slides & Ladders'}
            </h2>
            <p className="text-white/40 text-sm">Room #{room.code}</p>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && <TurnTimer />}

            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm transition"
            >
              <Share2 size={14} />
              Invite
            </button>

            <button
              onClick={leaveRoom}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-sm transition"
            >
              <LogOut size={14} />
              Leave
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 bg-white/[0.02] rounded-2xl border border-white/10 p-6 flex items-center justify-center min-h-[400px]">
          {!isPlaying && !isFinished ? (
            /* Waiting Room */
            <div className="text-center">
              <div className="text-6xl mb-4">
                {room.game_type === 'blackjack' ? '🃏' : room.game_type === 'pool' ? '🎱' : room.game_type === 'spades' ? '♠️' : '🎲'}
              </div>
              <h3 className="text-white font-bold text-2xl mb-2">Waiting for players...</h3>
              <p className="text-white/40 mb-6">
                {players.length} player{players.length !== 1 ? 's' : ''} in room
              </p>

              <div className="flex items-center justify-center gap-3">
                {!isHost && (
                  <button
                    onClick={toggleReady}
                    className={`px-6 py-3 rounded-xl font-bold transition ${
                      players.find(p => p.user_id === myPlayerId)?.ready
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {players.find(p => p.user_id === myPlayerId)?.ready ? 'Ready!' : 'Ready Up'}
                  </button>
                )}

                {isHost && (
                  <button
                    onClick={startGame}
                    disabled={!canStart}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-bold transition"
                  >
                    <Play size={18} />
                    Start Game
                  </button>
                )}
              </div>

              {isHost && !canStart && players.length > 1 && (
                <p className="text-yellow-400/60 text-xs mt-3">Waiting for all players to ready up</p>
              )}
            </div>
          ) : isPlaying && gameState ? (
            /* Active Game */
            room.game_type === 'blackjack' ? (
              <BlackjackGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={submitMove}
              />
            ) : room.game_type === 'slidesLadders' ? (
              <SlidesLaddersGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onRoll={() => submitMove('roll')}
                players={players}
              />
            ) : room.game_type === 'pool' ? (
              <PoolGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={submitMove}
                players={players}
              />
            ) : room.game_type === 'spades' ? (
              <SpadesGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={submitMove}
              />
            ) : (
              <div className="text-white/50">Loading game...</div>
            )
          ) : (
            <div className="flex items-center gap-2 text-white/40">
              <Loader2 size={20} className="animate-spin" />
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-72 space-y-4">
        <PlayerList
          players={players}
          hostId={room.host_id}
          myPlayerId={myPlayerId}
          gameState={gameState}
          showScores={isPlaying}
        />

        {isPlaying && (
          <Scoreboard
            players={players}
            gameState={gameState}
            gameType={room.game_type}
          />
        )}

        <ChatPanel />
      </div>

      {/* Modals */}
      <InviteModal
        roomCode={room.code}
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
      />

      {myResult && (
        <GameResult
          result={myResult}
          onPlayAgain={() => {
            // Reset and go back to lobby
            leaveRoom();
          }}
          onLeave={leaveRoom}
        />
      )}
    </div>
  );
}
