/**
 * MYSTATION - Unlock Progress
 * Shows progress towards unlocking exclusive content
 */

'use client';

import { useEngagementStore, UNLOCKS } from '@/store/engagementStore';
import { Lock, Unlock, Gift, Play, Heart, Users, Flame } from 'lucide-react';

export default function UnlockProgress() {
  const { totalPlays, totalDonated, referralCount, currentStreak, unlockedContent } = useEngagementStore();

  const unlocks = Object.values(UNLOCKS).map(unlock => {
    const isUnlocked = unlockedContent.includes(unlock.id);
    let progress = 0;
    let current = 0;
    let target = 0;
    let icon = Gift;

    switch (unlock.requirement) {
      case 'plays:10':
        current = totalPlays;
        target = 10;
        progress = Math.min(100, (totalPlays / 10) * 100);
        icon = Play;
        break;
      case 'donated:5':
        current = totalDonated;
        target = 5;
        progress = Math.min(100, (totalDonated / 5) * 100);
        icon = Heart;
        break;
      case 'referrals:3':
        current = referralCount;
        target = 3;
        progress = Math.min(100, (referralCount / 3) * 100);
        icon = Users;
        break;
      case 'streak:5':
        current = currentStreak;
        target = 5;
        progress = Math.min(100, (currentStreak / 5) * 100);
        icon = Flame;
        break;
    }

    return { ...unlock, isUnlocked, progress, current, target, icon };
  });

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
          <Gift size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Unlock Rewards</h2>
          <p className="text-white/50 text-sm">{unlockedContent.length} of {unlocks.length} unlocked</p>
        </div>
      </div>

      <div className="space-y-4">
        {unlocks.map(unlock => (
          <div
            key={unlock.id}
            className={`p-4 rounded-xl border transition ${
              unlock.isUnlocked
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                unlock.isUnlocked
                  ? 'bg-green-500/20'
                  : 'bg-white/10'
              }`}>
                {unlock.isUnlocked ? (
                  <Unlock size={24} className="text-green-400" />
                ) : (
                  <unlock.icon size={24} className="text-white/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-bold ${unlock.isUnlocked ? 'text-green-400' : 'text-white'}`}>
                    {unlock.name}
                  </h4>
                  {!unlock.isUnlocked && (
                    <span className="text-sm text-white/40">
                      {unlock.current}/{unlock.target}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/50">{unlock.content}</p>

                {/* Progress Bar */}
                {!unlock.isUnlocked && (
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${unlock.progress}%` }}
                    />
                  </div>
                )}

                {unlock.isUnlocked && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                    UNLOCKED
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
        <p className="text-blue-400 text-sm font-medium mb-2">How to unlock:</p>
        <ul className="text-white/50 text-sm space-y-1">
          <li>• Stream songs to increase your play count</li>
          <li>• Support the Foundation with any donation</li>
          <li>• Share with friends to get referrals</li>
          <li>• Keep your listening streak going!</li>
        </ul>
      </div>
    </div>
  );
}
