/**
 * KICKBACK LOUNGE — Online Users (Avatar Stack)
 * Shows who's in the lounge with stacked avatars, online count, pulse
 */

'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { PLAYER_COLORS } from '@/lib/games/constants';

export default function OnlineUsers() {
  const { onlineUsers, subscribeLobby } = useGameStore();

  useEffect(() => {
    subscribeLobby();
  }, [subscribeLobby]);

  const count = onlineUsers.length || 1;
  const displayUsers = onlineUsers.slice(0, 5); // Show max 5 avatars
  const overflow = count - 5;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {displayUsers.length > 0 ? (
          displayUsers.map((user, i) => (
            <div
              key={user.user_id || i}
              className="w-8 h-8 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{
                backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length],
                zIndex: 5 - i,
              }}
              title={user.display_name || 'Player'}
            >
              {(user.display_name || 'P').charAt(0).toUpperCase()}
            </div>
          ))
        ) : (
          <div
            className="w-8 h-8 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-white text-xs font-bold bg-blue-500"
          >
            Y
          </div>
        )}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full border-2 border-[#0d1117] flex items-center justify-center text-white/60 text-xs font-semibold bg-white/10 shrink-0">
            +{overflow}
          </div>
        )}
      </div>

      {/* Count + pulse */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-white/50 text-sm">
          <span className="text-white font-semibold">{count}</span> online
        </span>
      </div>
    </div>
  );
}
