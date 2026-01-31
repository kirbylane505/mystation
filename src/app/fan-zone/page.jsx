/**
 * MYSTATION - Fan Zone
 * Engagement hub: streaks, badges, leaderboard, rewards, activity
 */

'use client';

import { useEffect } from 'react';
import { useEngagementStore } from '@/store/engagementStore';
import StreakBadges from '@/components/StreakBadges';
import ActivityFeed from '@/components/ActivityFeed';
import Leaderboard from '@/components/Leaderboard';
import UnlockProgress from '@/components/UnlockProgress';
import DailySpin from '@/components/DailySpin';
import { Trophy, Flame, Gift, Zap, Crown } from 'lucide-react';

export default function FanZonePage() {
  const { visitPage, currentStreak, earnedBadges, totalPlays } = useEngagementStore();

  useEffect(() => {
    visitPage('/fan-zone');
  }, [visitPage]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-mystation-navy to-mystation-black" />
        <div className="bg-orb w-[400px] h-[400px] bg-purple-600 top-[-100px] right-[-100px]" />
        <div className="bg-orb w-[300px] h-[300px] bg-pink-500 bottom-[-50px] left-[-50px]" style={{ animationDelay: '-5s' }} />

        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Crown size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Fan Zone</h1>
                  <p className="text-white/50">Your rewards & achievements</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <Flame size={24} className="text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{currentStreak}</p>
                    <p className="text-xs text-white/40">Day Streak</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Trophy size={24} className="text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{earnedBadges.length}</p>
                    <p className="text-xs text-white/40">Badges</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Zap size={24} className="text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{totalPlays}</p>
                    <p className="text-xs text-white/40">Plays</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Spin CTA */}
            <div className="flex flex-col items-center gap-4">
              <DailySpin />
              <p className="text-white/40 text-sm">Spin daily for rewards!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Streaks & Unlocks */}
          <div className="space-y-8">
            <StreakBadges />
            <UnlockProgress />
          </div>

          {/* Center Column - Leaderboard */}
          <div>
            <Leaderboard />
          </div>

          {/* Right Column - Activity Feed */}
          <div>
            <ActivityFeed limit={15} showTrending={true} />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-y border-white/5">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Keep Streaming to Level Up!</h2>
          <p className="text-white/50 mb-8 max-w-2xl mx-auto">
            Every play counts towards your streak, badges, and position on the leaderboard.
            The more you listen, the more you unlock!
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/music"
              className="btn-primary"
            >
              Start Listening
            </a>
            <a
              href="/"
              className="btn-secondary"
            >
              Explore Music
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
