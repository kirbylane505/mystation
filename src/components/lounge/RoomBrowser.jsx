/**
 * KICKBACK LOUNGE — Room Browser
 * List of open rooms to join
 */

'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Users, ArrowRight } from 'lucide-react';

export default function RoomBrowser({ onJoin }) {
  const { openRooms, fetchOpenRooms } = useGameStore();

  useEffect(() => {
    fetchOpenRooms();
    const interval = setInterval(fetchOpenRooms, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [fetchOpenRooms]);

  if (openRooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/30 text-sm">No open rooms right now</p>
        <p className="text-white/20 text-xs mt-1">Create one and invite your friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {openRooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onJoin(room.code)}
          className="w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl transition group"
        >
          <span className="text-3xl">{room.gameIcon}</span>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">{room.gameName}</span>
              <span className="text-white/30 text-xs">#{room.code}</span>
            </div>
            <div className="flex items-center gap-2 text-white/40 text-xs mt-0.5">
              <span>Hosted by {room.host_name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <Users size={14} />
              <span>{room.playerCount}/{room.max_players}</span>
            </div>
            <ArrowRight size={16} className="text-white/30 group-hover:text-white/60 transition" />
          </div>
        </button>
      ))}
    </div>
  );
}
