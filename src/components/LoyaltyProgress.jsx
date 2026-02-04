/**
 * MYSTATION - Loyalty Progress Component
 * Shows streak progress and tier status
 */

'use client';

import { useEffect, useState } from 'react';
import { Flame, Lock, Unlock, Trophy, Star, Zap, Crown } from 'lucide-react';
import { useLoyaltyStore, LOYALTY_TIERS } from '@/store/loyaltyStore';

export default function LoyaltyProgress({ compact = false }) {
  const [mounted, setMounted] = useState(false);
  const {
    currentStreak,
    longestStreak,
    currentTier,
    totalPlays,
    isTop100,
    leaderboardRank,
    checkStreak,
    getProgress,
  } = useLoyaltyStore();

  useEffect(() => {
    setMounted(true);
    checkStreak(); // Check if streak is still valid
  }, [checkStreak]);

  if (!mounted) return null;

  const progress = getProgress();
  const tierColors = {
    gray: 'from-gray-500 to-gray-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-indigo-600',
    gold: 'from-yellow-500 to-amber-600',
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full">
        <Flame size={18} className={currentStreak > 0 ? 'text-orange-400' : 'text-white/30'} />
        <span className="text-white font-semibold">{currentStreak}</span>
        <span className="text-white/40 text-sm">day streak</span>
        {currentTier.name !== 'Newcomer' && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${tierColors[currentTier.color]} text-white`}>
            {currentTier.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierColors[currentTier.color]} flex items-center justify-center`}>
            {currentTier.name === 'Vault Member' ? (
              <Crown size={24} className="text-white" />
            ) : currentTier.name === 'Dedicated' ? (
              <Star size={24} className="text-white" />
            ) : currentTier.name === 'Supporter' ? (
              <Zap size={24} className="text-white" />
            ) : (
              <Trophy size={24} className="text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{currentTier.name}</h3>
            <p className="text-white/50 text-sm">Loyalty Status</p>
          </div>
        </div>
        {leaderboardRank && (
          <div className="text-right">
            <p className="text-2xl font-bold text-white">#{leaderboardRank}</p>
            <p className="text-white/50 text-sm">Leaderboard</p>
          </div>
        )}
      </div>

      {/* Streak Display */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={20} className={currentStreak > 0 ? 'text-orange-400' : 'text-white/30'} />
            <span className="text-3xl font-black text-white">{currentStreak}</span>
            <span className="text-white/50">day streak</span>
          </div>
          <p className="text-white/40 text-sm">Best: {longestStreak} days • {totalPlays} total plays</p>
        </div>
      </div>

      {/* Progress Bar */}
      {progress.nextTier && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Progress to {progress.nextTier.name}</span>
            <span className="text-white font-semibold">{progress.current}/{progress.target} days</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${tierColors[progress.nextTier.color]} transition-all duration-500`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tier Unlocks */}
      <div className="space-y-3">
        <h4 className="text-white/60 text-sm font-medium">UNLOCKS</h4>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          {currentStreak >= 30 ? <Unlock size={18} className="text-green-400" /> : <Lock size={18} className="text-white/30" />}
          <div className="flex-1">
            <p className={currentStreak >= 30 ? 'text-white font-medium' : 'text-white/40'}>Behind the Scenes</p>
            <p className="text-white/30 text-xs">30 day streak</p>
          </div>
          {currentStreak >= 30 && <span className="text-green-400 text-xs font-semibold">UNLOCKED</span>}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          {currentStreak >= 60 ? <Unlock size={18} className="text-green-400" /> : <Lock size={18} className="text-white/30" />}
          <div className="flex-1">
            <p className={currentStreak >= 60 ? 'text-white font-medium' : 'text-white/40'}>Unreleased Snippets</p>
            <p className="text-white/30 text-xs">60 day streak</p>
          </div>
          {currentStreak >= 60 && <span className="text-green-400 text-xs font-semibold">UNLOCKED</span>}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-yellow-500/20">
          {currentStreak >= 90 && isTop100 ? <Unlock size={18} className="text-yellow-400" /> : <Lock size={18} className="text-yellow-500/50" />}
          <div className="flex-1">
            <p className={currentStreak >= 90 && isTop100 ? 'text-yellow-400 font-bold' : 'text-white/40'}>
              The Vault
            </p>
            <p className="text-white/30 text-xs">90 day streak + Top 100 Listener</p>
          </div>
          {currentStreak >= 90 && isTop100 ? (
            <span className="text-yellow-400 text-xs font-semibold">UNLOCKED</span>
          ) : (
            <Crown size={18} className="text-yellow-500/30" />
          )}
        </div>
      </div>
    </div>
  );
}
