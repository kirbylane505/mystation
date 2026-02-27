/**
 * KICKBACK LOUNGE — Room Browser (Premium)
 * Game-colored cards, player count badges, host info, animated entries
 */

'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GAME_TYPES, PLAYER_COLORS } from '@/lib/games/constants';
import { Users, ChevronRight, Gamepad2 } from 'lucide-react';

export default function RoomBrowser({ onJoin }) {
  const { openRooms, fetchOpenRooms } = useGameStore();

  useEffect(() => {
    fetchOpenRooms();
    const interval = setInterval(fetchOpenRooms, 5000);
    return () => clearInterval(interval);
  }, [fetchOpenRooms]);

  if (openRooms.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/[0.03] flex items-center justify-center">
          <Gamepad2 size={24} className="text-white/15" />
        </div>
        <p className="text-white/30 text-sm font-medium">No open rooms</p>
        <p className="text-white/15 text-xs mt-1">Create one and invite friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {openRooms.map((room, idx) => {
        const game = GAME_TYPES[room.game_type];
        const gameColor = game?.color || '#3b82f6';

        return (
          <button
            key={room.id}
            onClick={() => onJoin(room.code)}
            className="group w-full flex items-center gap-3.5 p-3.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ animation: `loungeFadeUp 0.4s ease-out ${idx * 0.08}s both` }}
          >
            {/* Game icon with color bg */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${gameColor}15` }}
            >
              {game?.icon || '🎮'}
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-semibold text-sm truncate">{game?.name || room.game_type}</span>
                <span className="text-white/15 text-xs font-mono">#{room.code}</span>
              </div>
              <span className="text-white/30 text-xs">
                {room.host_name || 'Someone'}
              </span>
            </div>

            {/* Player count + arrow */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${gameColor}10`,
                  color: gameColor,
                }}
              >
                <Users size={12} />
                {room.playerCount}/{room.max_players}
              </div>
              <ChevronRight size={14} className="text-white/15 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all duration-300" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
