/**
 * KICKBACK LOUNGE — Player List Sidebar
 * Shows players, readiness, scores, online indicators
 */

'use client';

import { PLAYER_COLORS } from '@/lib/games/constants';
import { Check, Crown, Wifi, WifiOff } from 'lucide-react';

export default function PlayerList({ players, hostId, myPlayerId, gameState, showScores }) {
  return (
    <div className="space-y-2">
      <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider px-1">
        Players ({players.length})
      </h3>

      {players.map((player, idx) => {
        const isMe = player.user_id === myPlayerId;
        const isHost = player.user_id === hostId;
        const isCurrentTurn = gameState?.currentPlayerId === player.user_id;
        const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

        return (
          <div
            key={player.id || player.user_id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isCurrentTurn
                ? 'bg-white/10 ring-1 ring-white/20'
                : 'bg-white/[0.03] hover:bg-white/[0.06]'
            }`}
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              {player.display_name?.charAt(0)?.toUpperCase() || 'P'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-medium truncate ${isMe ? 'text-blue-400' : 'text-white'}`}>
                  {player.display_name}
                  {isMe && ' (You)'}
                </span>
                {isHost && <Crown size={12} className="text-yellow-400 shrink-0" />}
              </div>

              {showScores && gameState && (
                <span className="text-xs text-white/40">
                  {gameState.playerStatus?.[player.user_id]?.status || 'Waiting'}
                </span>
              )}
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-1.5 shrink-0">
              {player.ready ? (
                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <Check size={10} /> Ready
                </span>
              ) : (
                <span className="text-xs text-white/30">Not ready</span>
              )}

              {player.connected !== false ? (
                <Wifi size={12} className="text-green-400" />
              ) : (
                <WifiOff size={12} className="text-red-400" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
