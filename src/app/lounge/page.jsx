/**
 * KICKBACK LOUNGE — Lobby Page
 * Game selector grid, open rooms, who's online, your stats
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import GameSelector from '@/components/lounge/GameSelector';
import GameModeModal from '@/components/lounge/GameModeModal';
import RoomBrowser from '@/components/lounge/RoomBrowser';
import OnlineUsers from '@/components/lounge/OnlineUsers';
import {
  getPlayerName, isSubscriberPlayer, getAnonymousPlayerId,
  initSubscriberIdentity, getPlayerId, clearAnonymousBackup
} from '@/lib/playerId';
import { Gamepad2, Plus, Hash, Loader2, Trophy, Flame, Star, Users } from 'lucide-react';

export default function LoungePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createRoom, joinRoom, loading, error } = useGameStore();
  const [mode, setMode] = useState('select'); // select, joining
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [stats, setStats] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);

  // Initialize subscriber identity + auto-populate name + fetch stats
  useEffect(() => {
    async function init() {
      // Init subscriber identity (computes stable ID)
      await initSubscriberIdentity();

      const sub = isSubscriberPlayer();
      setIsSubscriber(sub);

      // Auto-populate display name from subscriber data
      if (sub) {
        const name = getPlayerName();
        if (name && name !== 'Player') {
          setDisplayName(name);
        }
      }

      // Migrate anonymous stats if needed
      if (sub) {
        const anonId = getAnonymousPlayerId();
        if (anonId) {
          try {
            const subId = getPlayerId();
            const res = await fetch('/api/lounge/migrate-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscriberPlayerId: subId, anonymousPlayerId: anonId }),
            });
            if (res.ok) {
              clearAnonymousBackup();
            }
          } catch {
            // Migration failed silently — will retry next visit
          }
        }
      }

      // Fetch real stats for subscribers
      if (sub) {
        try {
          const res = await fetch('/api/lounge/my-stats');
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        } catch {
          // Stats fetch failed — show zeros
        }
      }
    }
    init();
  }, []);

  const handleCreateRoom = async () => {
    if (!selectedGame || !displayName.trim()) return;
    const room = await createRoom(selectedGame, displayName.trim());
    if (room) {
      router.push(`/lounge/${room.id}`);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim() || !displayName.trim()) return;
    const room = await joinRoom(joinCode.trim(), displayName.trim());
    if (room) {
      router.push(`/lounge/${room.id}`);
    }
  };

  const handleJoinFromBrowser = async (code) => {
    if (!displayName.trim()) {
      setMode('joining');
      setJoinCode(code);
      return;
    }
    const room = await joinRoom(code, displayName.trim());
    if (room) {
      router.push(`/lounge/${room.id}`);
    }
  };

  const statItems = [
    { icon: Trophy, label: 'Wins', value: stats?.wins ?? '0', color: 'yellow', gradient: 'from-yellow-500/10 to-transparent' },
    { icon: Flame, label: 'Win Streak', value: stats?.bestStreak ?? '0', color: 'orange', gradient: 'from-orange-500/10 to-transparent' },
    { icon: Star, label: 'Points', value: stats?.points ?? '0', color: 'blue', gradient: 'from-blue-500/10 to-transparent' },
    { icon: Users, label: 'Games Played', value: stats?.gamesPlayed ?? '0', color: 'purple', gradient: 'from-purple-500/10 to-transparent' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Gamepad2 size={24} className="text-white" />
              <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-30" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Kickback Lounge
            </h1>
          </div>
          <p className="text-white/40 text-sm md:text-base">
            Play classic games with friends. Music never stops.
          </p>
        </div>

        <OnlineUsers />
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statItems.map(({ icon: Icon, label, value, color, gradient }, idx) => (
          <div
            key={label}
            className={`p-4 bg-gradient-to-br ${gradient} rounded-xl border border-white/[0.06] hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5`}
            style={{ animation: `loungeFadeUp 0.4s ease-out ${idx * 0.1}s both` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={`text-${color}-400`} />
              <span className="text-white/35 text-xs font-medium">{label}</span>
            </div>
            <span className="text-white font-bold text-xl">{value}</span>
          </div>
        ))}
      </div>

      {/* Name Input */}
      <div className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
        <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">
          {isSubscriber ? 'Playing as' : 'Your Display Name'}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={20}
            className="w-full md:w-64 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
          />
          {isSubscriber && displayName && (
            <span className="text-green-400/60 text-xs whitespace-nowrap">Subscriber</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Game Selector + Create */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-400" />
              Create a Game
            </h2>
            <GameSelector onSelect={(game) => setSelectedGame(game)} onJoinRoom={handleJoinFromBrowser} />

            {/* Game Mode Modal — replaces old "Selected: X / Create Room" flow */}
            <GameModeModal
              gameKey={selectedGame}
              isOpen={!!selectedGame}
              onClose={() => setSelectedGame(null)}
              displayName={displayName}
              onNameChange={setDisplayName}
            />
          </div>

          {/* Join by Code */}
          <div>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Hash size={18} className="text-green-400" />
              Join by Room Code
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter room code..."
                maxLength={6}
                className="w-40 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-center font-mono text-lg tracking-widest placeholder-white/20 focus:outline-none focus:border-green-500/50 uppercase"
              />
              <button
                onClick={handleJoinByCode}
                disabled={loading || !joinCode.trim() || !displayName.trim()}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-bold transition"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Join'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Open Rooms */}
        <div data-section="open-rooms">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-400" />
            Open Rooms
          </h2>
          <RoomBrowser onJoin={handleJoinFromBrowser} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-xl shadow-lg z-50 text-sm font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
