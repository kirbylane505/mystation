'use client';

import { useEngagementStore, calculatePoints, getFanRank, FAN_RANKS, POINTS } from '@/store/engagementStore';
import { Star, Flame, Trophy, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function RewardsCard() {
  const stats = useEngagementStore();
  const points = calculatePoints(stats);
  const rank = getFanRank(points);
  const nextRank = FAN_RANKS.find(r => r.minPoints > points);
  const progress = nextRank
    ? Math.min(((points - rank.minPoints) / (nextRank.minPoints - rank.minPoints)) * 100, 100)
    : 100;

  return (
    <div className="bg-gradient-to-r from-purple-600/15 to-amber-600/15 rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-amber-500/30 flex items-center justify-center text-xl">
            {rank.icon}
          </div>
          <div>
            <p className={`font-bold text-sm ${rank.color}`}>{rank.name}</p>
            <p className="text-white/40 text-xs">{points.toLocaleString()} points</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-orange-400">{stats.currentStreak}</p>
            <p className="text-[10px] text-white/30">Streak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">{stats.totalPlays}</p>
            <p className="text-[10px] text-white/30">Plays</p>
          </div>
          <div>
            <p className="text-lg font-bold text-yellow-400">{stats.earnedBadges.length}</p>
            <p className="text-[10px] text-white/30">Badges</p>
          </div>
        </div>
      </div>

      {nextRank && (
        <div>
          <div className="flex justify-between text-[10px] text-white/30 mb-1">
            <span>{rank.icon} {rank.name}</span>
            <span>{nextRank.icon} {nextRank.name}, {(nextRank.minPoints - points).toLocaleString()} pts to go</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!nextRank && (
        <p className="text-amber-400 text-xs font-medium">Max rank achieved</p>
      )}

      <Link
        href="/rewards"
        className="mt-3 flex items-center justify-center gap-1 text-xs text-white/40 hover:text-white/70 transition"
      >
        View full rewards <ChevronRight size={12} />
      </Link>
    </div>
  );
}
