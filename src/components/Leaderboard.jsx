/**
 * MYSTATION - Fan Leaderboard
 * Shows top fans by streams, donations, and streaks
 */

'use client';

import { useState } from 'react';
import { useEngagementStore, LEADERBOARD_DATA } from '@/store/engagementStore';
import { Trophy, Flame, Heart, Music, Medal, Crown, Award } from 'lucide-react';

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState('plays');
  const { totalPlays, currentStreak, totalDonated, earnedBadges } = useEngagementStore();

  // Sort leaderboard
  const sortedLeaderboard = [...LEADERBOARD_DATA].sort((a, b) => {
    switch (sortBy) {
      case 'donated': return b.donated - a.donated;
      case 'streak': return b.streak - a.streak;
      case 'badges': return b.badges - a.badges;
      default: return b.plays - a.plays;
    }
  });

  // Calculate user's position
  const userStats = { plays: totalPlays, donated: totalDonated, streak: currentStreak, badges: earnedBadges.length };
  const userPosition = sortedLeaderboard.filter(l => l[sortBy] > userStats[sortBy]).length + 1;

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={20} className="text-yellow-400" />;
    if (rank === 2) return <Medal size={20} className="text-gray-300" />;
    if (rank === 3) return <Award size={20} className="text-amber-600" />;
    return <span className="text-white/40 font-bold">#{rank}</span>;
  };

  const tabs = [
    { id: 'plays', label: 'Most Plays', icon: Music },
    { id: 'donated', label: 'Top Donors', icon: Heart },
    { id: 'streak', label: 'Longest Streak', icon: Flame },
    { id: 'badges', label: 'Most Badges', icon: Trophy },
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Trophy size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Fan Leaderboard</h2>
            <p className="text-white/50">Top supporters of the Foundation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                sortBy === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Position Card */}
      <div className="p-4 mx-4 mt-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center">
              <span className="text-blue-400 font-bold">#{userPosition}</span>
            </div>
            <div>
              <p className="font-bold text-white">Your Position</p>
              <p className="text-sm text-white/50">
                {sortBy === 'plays' && `${totalPlays} plays`}
                {sortBy === 'donated' && `$${totalDonated} donated`}
                {sortBy === 'streak' && `${currentStreak} day streak`}
                {sortBy === 'badges' && `${earnedBadges.length} badges`}
              </p>
            </div>
          </div>
          {userPosition <= 10 && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
              Top 10!
            </span>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="p-4 space-y-2">
        {sortedLeaderboard.map((user, index) => (
          <div
            key={user.rank}
            className={`flex items-center gap-4 p-4 rounded-xl transition ${
              index < 3
                ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {/* Rank */}
            <div className="w-10 flex justify-center">
              {getRankIcon(index + 1)}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <p className="font-bold text-white">{user.name}</p>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Music size={12} /> {user.plays}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={12} /> ${user.donated}
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={12} /> {user.streak}d
                </span>
              </div>
            </div>

            {/* Primary Stat */}
            <div className="text-right">
              <p className="text-xl font-bold text-blue-400">
                {sortBy === 'plays' && user.plays}
                {sortBy === 'donated' && `$${user.donated}`}
                {sortBy === 'streak' && `${user.streak}d`}
                {sortBy === 'badges' && user.badges}
              </p>
              <p className="text-xs text-white/40">
                {sortBy === 'plays' && 'plays'}
                {sortBy === 'donated' && 'donated'}
                {sortBy === 'streak' && 'streak'}
                {sortBy === 'badges' && 'badges'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 text-center">
        <p className="text-white/40 text-sm">
          Keep streaming to climb the leaderboard!
        </p>
      </div>
    </div>
  );
}
