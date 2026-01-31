/**
 * MYSTATION - Streak & Badges Display
 * Shows user's listening streak and earned badges
 */

'use client';

import { useState } from 'react';
import { useEngagementStore, BADGES } from '@/store/engagementStore';
import { Flame, Trophy, Star, Lock, X } from 'lucide-react';

export default function StreakBadges({ compact = false }) {
  const [showModal, setShowModal] = useState(false);
  const { currentStreak, longestStreak, earnedBadges, totalPlays } = useEngagementStore();

  const allBadges = Object.values(BADGES);
  const unlockedCount = earnedBadges.length;

  if (compact) {
    return (
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-3 px-4 py-2 glass rounded-full hover:border-blue-500/30 transition"
      >
        <div className="flex items-center gap-1 text-orange-400">
          <Flame size={18} className="animate-pulse" />
          <span className="font-bold">{currentStreak}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1 text-yellow-400">
          <Trophy size={16} />
          <span className="font-medium text-sm">{unlockedCount}/{allBadges.length}</span>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Streak Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Your Progress</h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-blue-400 text-sm hover:text-blue-300 transition"
          >
            View All Badges
          </button>
        </div>

        {/* Streak Display */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex-1 text-center p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame size={28} className="text-orange-400" />
              <span className="text-4xl font-bold text-white">{currentStreak}</span>
            </div>
            <p className="text-white/50 text-sm">Day Streak</p>
          </div>

          <div className="flex-1 text-center p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={24} className="text-yellow-400" />
              <span className="text-3xl font-bold text-white">{longestStreak}</span>
            </div>
            <p className="text-white/50 text-sm">Best Streak</p>
          </div>

          <div className="flex-1 text-center p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{totalPlays}</span>
            </div>
            <p className="text-white/50 text-sm">Total Plays</p>
          </div>
        </div>

        {/* Recent Badges */}
        <div>
          <p className="text-white/50 text-sm mb-3">Recent Badges</p>
          <div className="flex flex-wrap gap-2">
            {earnedBadges.slice(0, 5).map(badgeId => {
              const badge = BADGES[badgeId];
              return (
                <div
                  key={badgeId}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-full border border-blue-500/30"
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-sm text-white font-medium">{badge.name}</span>
                </div>
              );
            })}
            {earnedBadges.length === 0 && (
              <p className="text-white/30 text-sm">Play more to earn badges!</p>
            )}
          </div>
        </div>
      </div>

      {/* Badges Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Badges</h2>
                <p className="text-white/50">{unlockedCount} of {allBadges.length} unlocked</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allBadges.map(badge => {
                  const isUnlocked = earnedBadges.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl border transition ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30'
                          : 'bg-white/5 border-white/10 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{isUnlocked ? badge.icon : '🔒'}</span>
                        <div>
                          <h4 className="font-bold text-white text-sm">{badge.name}</h4>
                        </div>
                      </div>
                      <p className="text-white/50 text-xs">{badge.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
