/**
 * KICKBACK LOUNGE — Invite Link Landing
 * Join room from shared invite link
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Gamepad2, Loader2, ArrowRight } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { joinRoom, loading, error } = useGameStore();
  const [displayName, setDisplayName] = useState('');

  const code = params.code?.toUpperCase();

  const handleJoin = async () => {
    if (!displayName.trim() || !code) return;
    const room = await joinRoom(code, displayName.trim());
    if (room) {
      router.push(`/lounge/${room.id}`);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
          <Gamepad2 size={40} className="text-white" />
        </div>

        <h1 className="text-white font-black text-3xl mb-2">
          You&apos;re Invited!
        </h1>
        <p className="text-white/50 mb-2">Join the Kickback Lounge</p>

        {/* Room Code Display */}
        <div className="text-3xl font-black text-blue-400 tracking-[0.3em] mb-8 bg-white/5 rounded-xl py-3 mx-8">
          {code}
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-lg placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={loading || !displayName.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-black text-lg transition"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              Join Game <ArrowRight size={20} />
            </>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}

        <p className="text-white/20 text-xs mt-6">
          Music keeps playing while you game
        </p>
      </div>
    </div>
  );
}
