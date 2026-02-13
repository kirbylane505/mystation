/**
 * KICKBACK LOUNGE — Lobby Page
 * Game selector grid, open rooms, who's online, your stats
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import GameSelector from '@/components/lounge/GameSelector';
import RoomBrowser from '@/components/lounge/RoomBrowser';
import OnlineUsers from '@/components/lounge/OnlineUsers';
import { Gamepad2, Plus, Hash, Loader2, Trophy, Flame, Star, Users } from 'lucide-react';

export default function LoungePage() {
  const router = useRouter();
  const { createRoom, joinRoom, loading, error } = useGameStore();
  const [mode, setMode] = useState('select'); // select, joining
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Gamepad2 size={24} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              Kickback Lounge
            </h1>
          </div>
          <p className="text-white/50">
            Play classic games with friends. Music never stops.
          </p>
        </div>

        <OnlineUsers />
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Trophy, label: 'Wins', value: '0', color: 'yellow' },
          { icon: Flame, label: 'Win Streak', value: '0', color: 'orange' },
          { icon: Star, label: 'Points', value: '0', color: 'blue' },
          { icon: Users, label: 'Games Played', value: '0', color: 'purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={`text-${color}-400`} />
              <span className="text-white/40 text-xs">{label}</span>
            </div>
            <span className="text-white font-bold text-xl">{value}</span>
          </div>
        ))}
      </div>

      {/* Name Input (always visible) */}
      <div className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
        <label className="text-white/50 text-xs uppercase tracking-wider block mb-2">
          Your Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          className="w-full md:w-64 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Game Selector + Create */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-400" />
              Create a Game
            </h2>
            <GameSelector onSelect={(game) => setSelectedGame(game)} />

            {selectedGame && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-white/50 text-sm">
                  Selected: <span className="text-white font-medium">{selectedGame}</span>
                </span>
                <button
                  onClick={handleCreateRoom}
                  disabled={loading || !displayName.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-bold transition"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Room
                </button>
              </div>
            )}
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
        <div>
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
