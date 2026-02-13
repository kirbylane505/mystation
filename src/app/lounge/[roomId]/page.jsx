/**
 * KICKBACK LOUNGE — Game Room Page
 * Loads correct game + players + chat based on room ID
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import GameRoom from '@/components/lounge/GameRoom';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { room, joinRoom, loading, error } = useGameStore();
  const [displayName, setDisplayName] = useState('');
  const [needsName, setNeedsName] = useState(false);

  // If we navigated here directly (not from lobby), check if we're already in the room
  useEffect(() => {
    if (!room && params.roomId && !needsName) {
      // Need to join — show name prompt
      setNeedsName(true);
    }
  }, [room, params.roomId, needsName]);

  const handleJoin = async () => {
    if (!displayName.trim()) return;
    // Try to find room code from ID — for direct navigation we'd need the code
    // For now, redirect to lobby
    router.push('/lounge');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  // If not in a room, show join prompt or redirect
  if (!room) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-white font-bold text-2xl mb-4">Join a Game Room</h2>
        <p className="text-white/50 mb-6">Enter your name to join this room.</p>

        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name..."
          maxLength={20}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center placeholder-white/30 focus:outline-none focus:border-blue-500/50 mb-4"
        />

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/lounge')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition"
          >
            <ArrowLeft size={16} />
            Back to Lobby
          </button>
          <button
            onClick={handleJoin}
            disabled={!displayName.trim()}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-bold transition"
          >
            Join
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <GameRoom />
    </div>
  );
}
