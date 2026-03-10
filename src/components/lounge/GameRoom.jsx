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
import PoolGame from './PoolGame';
import SpadesGame from './SpadesGame';
import DominoesGame from './DominoesGame';
import QuizGame from './QuizGame';
import GalagaGame from './GalagaGame';
import { GAME_TYPES, PLAYER_COLORS } from '@/lib/games/constants';
import { Users, Share2, Play, LogOut, Loader2, Bot, Eye, ChevronDown, Zap } from 'lucide-react';

const GAME_TIPS = {
  blackjack: ['Hit below 11 — you can\'t bust', 'Stand on 17+ for safety', 'Aces count as 1 or 11'],
  pool: ['Aim carefully — angles matter', 'Pocket your set (solids or stripes)', 'Sink the 8-ball last'],
  spades: ['Count tricks before you bid', 'Lead off-suit to control', 'Save spades for big plays'],
  dominoes: ['Match tile numbers to play', 'Block your opponent', 'Clear your hand first to win'],
  quiz: ['10 questions per round', 'Speed bonus for fast answers', '230 questions across 10 categories'],
  galaga: ['Arrow keys or WASD to move', 'Space to shoot', 'Collect power-ups for shields & spread shot'],
};

export default function GameRoom() {
  const [showInvite, setShowInvite] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const {
    room, players, gameState, myPlayerId, isSpectator,
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
    if (gameState && room?.status === 'playing' && gameState.myHand === undefined && (room.game_type === 'blackjack' || room.game_type === 'spades' || room.game_type === 'dominoes')) {
      fetchGameState();
    }
  }, [gameState, room, fetchGameState]);

  if (!room) return null;

  const isHost = !isSpectator && room.host_id === myPlayerId;
  const allReady = players.filter(p => p.user_id !== room.host_id && p.seat !== -1 && p.role !== 'spectator').every(p => p.ready);
  const gameConfig = GAME_TYPES[room.game_type];
  const minPlayers = gameConfig?.minPlayers || 1;
  const canStart = isHost && allReady && players.length >= minPlayers;
  const spectatorNoop = () => {}; // spectators can't make moves
  const handleMove = isSpectator ? spectatorNoop : submitMove;
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
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${gameConfig?.color || '#3b82f6'}15` }}
            >
              {gameConfig?.icon || '🎮'}
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-tight">
                {gameConfig?.name || room.game_type}
              </h2>
              <p className="text-white/30 text-xs font-mono tracking-wider">#{room.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && <TurnTimer />}

            <button
              data-testid="invite-btn"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-sm transition"
            >
              <Share2 size={14} />
              Invite
            </button>

            <button
              data-testid="leave-btn"
              onClick={leaveRoom}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-sm transition"
            >
              <LogOut size={14} />
              Leave
            </button>
          </div>
        </div>

        {/* Spectator Banner */}
        {isSpectator && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm mb-4">
            <Eye size={14} />
            You&apos;re watching this game as a spectator
          </div>
        )}

        {/* Game Content */}
        <div className={`flex-1 rounded-2xl border border-white/10 flex items-center justify-center min-h-[400px] relative overflow-hidden ${isPlaying || isFinished ? 'bg-white/[0.02] p-6' : 'bg-[#0d1117]'}`}>
          {!isPlaying && !isFinished ? (
            /* Premium Waiting Room */
            <>
              {/* Background radial gradient in game color */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 25%, ${gameConfig?.color || '#3b82f6'}18, transparent 65%)` }}
              />

              {/* Orbiting ambient particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: `${3 + (i % 3) * 2}px`,
                    height: `${3 + (i % 3) * 2}px`,
                    backgroundColor: gameConfig?.color || '#3b82f6',
                    opacity: 0.06 + (i % 4) * 0.03,
                    left: `${8 + i * 11}%`,
                    top: `${12 + (i % 4) * 22}%`,
                    animation: `loungeFloat ${3 + i * 0.6}s ease-in-out infinite`,
                    animationDelay: `${i * 0.4}s`,
                  }}
                />
              ))}

              {/* Main content */}
              <div className="relative z-10 text-center max-w-md mx-auto px-4 py-8">

                {/* Animated game icon with glow */}
                <div className="relative inline-block mb-6">
                  <div
                    className="absolute -inset-8 rounded-full blur-3xl"
                    style={{
                      backgroundColor: gameConfig?.color || '#3b82f6',
                      animation: 'loungeGlow 3s ease-in-out infinite',
                    }}
                  />
                  <div
                    className="relative text-8xl"
                    style={{
                      animation: 'loungeFloat 3s ease-in-out infinite',
                      filter: `drop-shadow(0 4px 24px ${gameConfig?.color || '#3b82f6'}60)`,
                    }}
                  >
                    {gameConfig?.icon || '🎮'}
                  </div>
                </div>

                {/* Game title */}
                <h3 className="text-white font-black text-3xl md:text-4xl mb-1 tracking-tight">
                  {gameConfig?.name || room.game_type}
                </h3>
                <p className="text-white/20 text-xs font-mono tracking-[0.3em] uppercase mb-8">
                  Room {room.code}
                </p>

                {/* Player avatars row */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  <div className="flex -space-x-2">
                    {players.map((p, i) => (
                      <div
                        key={p.user_id || i}
                        className="w-10 h-10 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform duration-300 hover:scale-125 hover:z-10 cursor-default"
                        style={{
                          backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
                          animation: `loungeFadeUp 0.5s ease-out ${i * 0.1}s both`,
                          boxShadow: `0 0 12px ${PLAYER_COLORS[i % PLAYER_COLORS.length]}40`,
                        }}
                        title={p.display_name}
                      >
                        {p.display_name?.charAt(0)?.toUpperCase() || 'P'}
                      </div>
                    ))}
                    {/* Empty slot invite button */}
                    {players.length < (gameConfig?.maxPlayers || 4) && (
                      <button
                        onClick={() => setShowInvite(true)}
                        className="w-10 h-10 rounded-full border-2 border-dashed border-white/15 flex items-center justify-center text-white/25 hover:text-white/60 hover:border-white/40 transition-all duration-300 hover:scale-110"
                        title="Invite a friend"
                      >
                        <span className="text-lg leading-none">+</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-white/35 text-sm font-medium">
                      {players.length}/{gameConfig?.maxPlayers || 4}
                    </span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 flex-wrap mb-5">
                  {!isHost && !isSpectator && (
                    <button
                      data-testid="ready-btn"
                      onClick={toggleReady}
                      className={`px-8 py-3.5 rounded-2xl font-bold text-base transition-all duration-300 ${
                        players.find(p => p.user_id === myPlayerId)?.ready
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-white/10 text-white hover:bg-white/15 border border-white/10 hover:border-white/20'
                      }`}
                      style={players.find(p => p.user_id === myPlayerId)?.ready ? { animation: 'loungeReady 1s ease-in-out' } : {}}
                    >
                      {players.find(p => p.user_id === myPlayerId)?.ready ? '✓ Ready!' : 'Ready Up'}
                    </button>
                  )}

                  {isHost && (
                    <button
                      data-testid="start-game-btn"
                      onClick={startGame}
                      disabled={!canStart}
                      className="group relative flex items-center gap-2.5 px-8 py-3.5 bg-green-500 hover:bg-green-400 disabled:bg-white/5 disabled:text-white/20 disabled:border disabled:border-white/10 text-white rounded-2xl font-bold text-base transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                      style={canStart ? { boxShadow: `0 0 30px ${gameConfig?.color || '#22c55e'}30` } : {}}
                    >
                      <Play size={20} className="group-hover:scale-110 transition-transform" />
                      Start Game
                    </button>
                  )}

                  {isHost && players.length === 1 && gameConfig?.turnBased && (
                    <button
                      data-testid="play-vs-bot-btn"
                      onClick={() => startGame({ withBots: true })}
                      className="group flex items-center gap-2.5 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold text-base transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25"
                    >
                      <Bot size={20} className="group-hover:scale-110 transition-transform" />
                      Play vs Bot
                    </button>
                  )}
                </div>

                {isHost && !canStart && players.length > 1 && (
                  <p className="text-yellow-400/50 text-sm mb-4 animate-pulse">
                    Waiting for all players to ready up...
                  </p>
                )}

                {/* Invite Friends CTA */}
                <button
                  onClick={() => setShowInvite(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 rounded-full text-white/40 hover:text-white/70 text-sm transition-all duration-300 mb-8"
                >
                  <Share2 size={14} />
                  Invite Friends
                </button>

                {/* How to Play — expandable tips */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden text-left">
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className="flex items-center justify-between w-full px-5 py-3.5 text-white/35 text-xs uppercase tracking-wider font-semibold hover:text-white/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={12} />
                      <span>How to Play</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${showTips ? 'rotate-180' : ''}`} />
                  </button>
                  {showTips && (
                    <div className="px-5 pb-4 space-y-2.5" style={{ animation: 'loungeFadeUp 0.3s ease-out' }}>
                      <p className="text-white/25 text-sm leading-relaxed">{gameConfig?.description}</p>
                      {GAME_TIPS[room.game_type]?.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <span
                            className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: gameConfig?.color || '#3b82f6' }}
                          />
                          <span className="text-white/30">{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : isPlaying && gameState ? (
            /* Active Game */
            room.game_type === 'blackjack' ? (
              <BlackjackGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={handleMove}
              />
            ) : room.game_type === 'pool' ? (
              <PoolGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={handleMove}
                players={players}
              />
            ) : room.game_type === 'spades' ? (
              <SpadesGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={handleMove}
              />
            ) : room.game_type === 'dominoes' ? (
              <DominoesGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={handleMove}
                players={players}
              />
            ) : room.game_type === 'quiz' ? (
              <QuizGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={handleMove}
              />
            ) : room.game_type === 'galaga' ? (
              <GalagaGame
                gameState={gameState}
                myPlayerId={myPlayerId}
                onMove={handleMove}
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
