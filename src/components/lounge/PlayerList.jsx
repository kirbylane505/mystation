/**
 * KICKBACK LOUNGE — Player List Sidebar
 * Shows players, readiness, scores, online indicators, spectators
 */

'use client';

import { PLAYER_COLORS } from '@/lib/games/constants';
import { Check, Crown, Eye } from 'lucide-react';

function PlayerRow({ player, idx, isMe, isHost, isCurrentTurn, isSpectator, gameState, showScores }) {
  const color = isSpectator ? '#6b7280' : PLAYER_COLORS[idx % PLAYER_COLORS.length];

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
        isCurrentTurn
          ? 'bg-white/10 ring-1 ring-white/20'
          : isSpectator
            ? 'bg-white/[0.02]'
            : 'bg-white/[0.03] hover:bg-white/[0.06]'
      } ${player.connected === false ? 'opacity-50' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: color }}
      >
        {isSpectator ? <Eye size={14} /> : (player.display_name?.charAt(0)?.toUpperCase() || 'P')}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium truncate ${isMe ? 'text-blue-400' : isSpectator ? 'text-white/50' : 'text-white'}`}>
            {player.display_name}
            {isMe && ' (You)'}
          </span>
          {isHost && <Crown size={12} className="text-yellow-400 shrink-0" />}
        </div>

        {showScores && gameState && !isSpectator && (
          <span className="text-xs text-white/40">
            {gameState.playerStatus?.[player.user_id]?.status || 'Waiting'}
          </span>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isSpectator && (
          player.ready ? (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              <Check size={10} /> Ready
            </span>
          ) : (
            <span className="text-xs text-white/30">Not ready</span>
          )
        )}
        {isSpectator && (
          <span className="text-xs text-white/30">Watching</span>
        )}

        {player.connected !== false ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        ) : (
          <span className="relative flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500/60" />
          </span>
        )}
      </div>
    </div>
  );
}

export default function PlayerList({ players, hostId, myPlayerId, gameState, showScores }) {
  const activePlayers = players.filter(p => p.seat !== -1 && p.role !== 'spectator');
  const spectators = players.filter(p => p.seat === -1 || p.role === 'spectator');

  return (
    <div className="space-y-2">
      <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
        Players ({activePlayers.length})
      </h3>

      {activePlayers.map((player, idx) => (
        <PlayerRow
          key={player.id || player.user_id}
          player={player}
          idx={idx}
          isMe={player.user_id === myPlayerId}
          isHost={player.user_id === hostId}
          isCurrentTurn={gameState?.currentPlayerId === player.user_id}
          isSpectator={false}
          gameState={gameState}
          showScores={showScores}
        />
      ))}

      {spectators.length > 0 && (
        <>
          <h3 className="text-white/30 text-xs font-semibold uppercase tracking-wider px-1 mt-4 flex items-center gap-1">
            <Eye size={10} /> Spectators ({spectators.length})
          </h3>
          {spectators.map((player, idx) => (
            <PlayerRow
              key={player.id || player.user_id}
              player={player}
              idx={idx}
              isMe={player.user_id === myPlayerId}
              isHost={false}
              isCurrentTurn={false}
              isSpectator={true}
              gameState={gameState}
              showScores={false}
            />
          ))}
        </>
      )}
    </div>
  );
}
