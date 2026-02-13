/**
 * KICKBACK LOUNGE — Online Users
 * Shows who's browsing the lounge (Supabase Presence)
 */

'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Wifi } from 'lucide-react';

export default function OnlineUsers() {
  const { onlineUsers, subscribeLobby } = useGameStore();

  useEffect(() => {
    subscribeLobby();
  }, [subscribeLobby]);

  const count = onlineUsers.length || 1; // at least yourself

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-full border border-white/10">
      <div className="relative">
        <Wifi size={14} className="text-green-400" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>
      <span className="text-white/60 text-sm">
        <span className="text-white font-semibold">{count}</span> in the lounge
      </span>
    </div>
  );
}
