/**
 * MYSTATION - Top 100 Leaderboard
 * Shows top listeners competing for vault access
 */

'use client';

import { useState, useEffect } from 'react';
import { Trophy, Crown, Flame, Medal, TrendingUp } from 'lucide-react';
import { useLoyaltyStore } from '@/store/loyaltyStore';

// Mock leaderboard data - replace with Supabase query
const mockLeaderboard = [
  { rank: 1, username: 'BIGFAN847', streak: 127, totalPlays: 4521, avatar: '👑' },
  { rank: 2, username: 'PageNation', streak: 98, totalPlays: 3892, avatar: '🔥' },
  { rank: 3, username: 'IDMGLoyalist', streak: 94, totalPlays: 3654, avatar: '⭐' },
  { rank: 4, username: 'MikePageFan1', streak: 91, totalPlays: 3201, avatar: '🎵' },
  { rank: 5, username: 'ATLStreamer', streak: 90, totalPlays: 2987, avatar: '🎧' },
  { rank: 6, username: 'VaultHunter', streak: 88, totalPlays: 2845, avatar: '🏆' },
  { rank: 7, username: 'MusicLover404', streak: 85, totalPlays: 2654, avatar: '💎' },
  { rank: 8, username: 'DreamzSupporter', streak: 82, totalPlays: 2432, avatar: '✨' },
  { rank: 9, username: 'FoundationFan', streak: 78, totalPlays: 2198, avatar: '🎤' },
  { rank: 10, username: 'PageArmy', streak: 75, totalPlays: 2054, avatar: '💪' },
];

export default function Leaderboard({ limit = 10, showFull = false }) {
  const [mounted, setMounted] = useState(false);
  const { currentStreak, totalPlays, leaderboardRank } = useLoyaltyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const displayData = showFull ? mockLeaderboard : mockLeaderboard.slice(0, limit);

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white';
    return 'bg-white/10 text-white/60';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={16} />;
    if (rank === 2) return <Medal size={16} />;
    if (rank === 3) return <Medal size={16} />;
    return null;
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Top 100 Leaderboard</h3>
            <p className="text-white/50 text-sm">Top 100 + 90 day streak = Vault Access</p>
          </div>
        </div>
      </div>

      {/* Your Position */}
      {leaderboardRank && (
        <div className="px-6 py-4 bg-blue-500/10 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {leaderboardRank}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">You</p>
              <p className="text-white/50 text-sm">{currentStreak} day streak • {totalPlays} plays</p>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <TrendingUp size={16} />
              <span className="text-sm font-semibold">Your Rank</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="divide-y divide-white/5">
        {displayData.map((user) => {
          const rowClass = user.rank <= 3
            ? 'flex items-center gap-4 px-6 py-4 transition hover:bg-white/5 bg-white/[0.02]'
            : 'flex items-center gap-4 px-6 py-4 transition hover:bg-white/5';

          return (
            <div key={user.rank} className={rowClass}>
              {/* Rank */}
              <div className={'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ' + getRankStyle(user.rank)}>
                {getRankIcon(user.rank) || user.rank}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl">
                {user.avatar}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{user.username}</p>
                <div className="flex items-center gap-3 text-white/40 text-sm">
                  <span className="flex items-center gap-1">
                    <Flame size={12} className="text-orange-400" />
                    {user.streak} days
                  </span>
                  <span>{user.totalPlays.toLocaleString()} plays</span>
                </div>
              </div>

              {/* Vault Status */}
              {user.streak >= 90 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
                  <Crown size={14} className="text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-semibold">VAULT</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {!showFull && (
        <div className="p-4 border-t border-white/10 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition">
            View Full Leaderboard
          </button>
        </div>
      )}
    </div>
  );
}
