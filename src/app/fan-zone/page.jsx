/**
 * MYSTATION - Fan Zone
 * All-in-one engagement hub: points, streaks, badges, vault, DJ, rewards, activity
 */

'use client';

import { useEffect, useState } from 'react';
import { useEngagementStore, calculatePoints, getFanRank, FAN_RANKS, POINTS, VAULT_TIERS } from '@/store/engagementStore';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import StreakBadges from '@/components/StreakBadges';
import ActivityFeed from '@/components/ActivityFeed';
import UnlockProgress from '@/components/UnlockProgress';
import DailySpin from '@/components/DailySpin';
import LoyaltyProgress from '@/components/LoyaltyProgress';
import VaultPreview from '@/components/VaultPreview';
import VaultRewards from '@/components/VaultRewards';
import FanWall from '@/components/FanWall';
import { Trophy, Flame, Gift, Zap, Crown, Lock, Disc3, Star, Headphones, Music, Heart, Share2, Users } from 'lucide-react';
import Link from 'next/link';

export default function FanZonePage() {
  const [mounted, setMounted] = useState(false);
  const engagementStats = useEngagementStore();
  const { visitPage, currentStreak: engStreak, earnedBadges, totalPlays: engPlays } = engagementStats;
  const { currentStreak, totalPlays, currentTier, isTop100 } = useLoyaltyStore();

  useEffect(() => {
    setMounted(true);
    visitPage('/fan-zone');
  }, [visitPage]);

  // Use loyalty store values when mounted, fallback to engagement store
  const displayStreak = mounted ? currentStreak : engStreak;
  const displayPlays = mounted ? totalPlays : engPlays;

  // Points system
  const userPoints = mounted ? calculatePoints(engagementStats) : 0;
  const fanRank = getFanRank(userPoints);
  const nextRank = FAN_RANKS.find(r => r.minPoints > userPoints) || FAN_RANKS[FAN_RANKS.length - 1];
  const progressToNext = nextRank.minPoints > fanRank.minPoints
    ? ((userPoints - fanRank.minPoints) / (nextRank.minPoints - fanRank.minPoints)) * 100
    : 100;

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
                  <p className="text-white/50">Your rewards, points & achievements</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <Star size={24} className="text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{mounted ? userPoints.toLocaleString() : '0'}</p>
                    <p className="text-xs text-white/40">Points</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Flame size={24} className="text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{displayStreak}</p>
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
                    <p className="text-2xl font-bold text-white">{displayPlays}</p>
                    <p className="text-xs text-white/40">Plays</p>
                  </div>
                </div>
                {mounted && fanRank.name !== 'New Fan' && (
                  <>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-full border border-yellow-500/30">
                      <span className="text-lg">{fanRank.icon}</span>
                      <span className={`font-semibold text-sm ${fanRank.color}`}>{fanRank.name}</span>
                    </div>
                  </>
                )}
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

      {/* POINTS SYSTEM - Rank & Progress */}
      <section className="max-w-screen-xl mx-auto px-6 pt-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Rank Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star size={20} className="text-yellow-400" />
              Your Fan Rank
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center text-3xl">
                {fanRank.icon}
              </div>
              <div>
                <p className={`text-2xl font-bold ${fanRank.color}`}>{fanRank.name}</p>
                <p className="text-white/50 text-sm">{mounted ? userPoints.toLocaleString() : '0'} points</p>
              </div>
            </div>

            {/* Progress to next rank */}
            {nextRank.minPoints > fanRank.minPoints && (
              <div>
                <div className="flex justify-between text-xs text-white/40 mb-1">
                  <span>{fanRank.name}</span>
                  <span>{nextRank.icon} {nextRank.name} — {nextRank.minPoints.toLocaleString()} pts</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1">
                  {(nextRank.minPoints - userPoints).toLocaleString()} points to next rank
                </p>
              </div>
            )}

            {/* All Ranks */}
            <div className="mt-4 space-y-2">
              {FAN_RANKS.map((rank) => (
                <div key={rank.name} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${userPoints >= rank.minPoints ? 'bg-white/5' : 'opacity-40'}`}>
                  <span className="text-lg">{rank.icon}</span>
                  <span className={`text-sm font-medium ${userPoints >= rank.minPoints ? rank.color : 'text-white/40'}`}>{rank.name}</span>
                  <span className="ml-auto text-xs text-white/30">{rank.minPoints.toLocaleString()} pts</span>
                  {userPoints >= rank.minPoints && <Zap size={12} className="text-green-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* How to Earn Points */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={20} className="text-blue-400" />
              How to Earn Points
            </h3>
            <div className="space-y-3">
              <PointRow icon={<Headphones size={16} className="text-blue-400" />} label="Play a song" points={POINTS.play} />
              <PointRow icon={<Flame size={16} className="text-orange-400" />} label="Daily login" points={POINTS.dailyLogin} />
              <PointRow icon={<Flame size={16} className="text-orange-400" />} label="3-day streak bonus" points={POINTS.streak3} />
              <PointRow icon={<Flame size={16} className="text-red-400" />} label="7-day streak bonus" points={POINTS.streak7} />
              <PointRow icon={<Crown size={16} className="text-yellow-400" />} label="30-day streak bonus" points={POINTS.streak30} />
              <PointRow icon={<Share2 size={16} className="text-green-400" />} label="Share a song" points={POINTS.share} />
              <PointRow icon={<Heart size={16} className="text-pink-400" />} label="React to a song" points={POINTS.reaction} />
              <PointRow icon={<Trophy size={16} className="text-yellow-400" />} label="Earn a badge" points={POINTS.badge} />
              <PointRow icon={<Gift size={16} className="text-purple-400" />} label="Make a donation" points={POINTS.donation} />
              <PointRow icon={<Users size={16} className="text-cyan-400" />} label="Refer a friend" points={POINTS.referral} />
              <PointRow icon={<Music size={16} className="text-indigo-400" />} label="Complete an album" points={POINTS.albumComplete} />
            </div>

            {/* Vault Access — LOCKED */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                <Lock size={14} className="text-red-400" />
                Vault Sealed
              </h4>
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 text-center">
                <p className="text-white/30 text-sm">The Vault is currently locked. No access available.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DJ TURNTABLES - Interactive Feature */}
      <section className="max-w-screen-xl mx-auto px-6 pt-12">
        <Link href="/fan-zone/dj" className="block group">
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-red-600/20 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Disc3 size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition">DJ Turntables</h3>
                  <p className="text-white/50 text-sm">Load songs on two decks, blend them, control the EQ — be the DJ</p>
                </div>
              </div>
              <span className="text-3xl">🎧</span>
            </div>
          </div>
        </Link>
      </section>

      {/* FAN WALL - Community Posts */}
      <section className="max-w-screen-xl mx-auto px-6 py-12">
        <FanWall />
      </section>

      {/* THE VAULT */}
      <section className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <VaultPreview />
          <VaultRewards />
        </div>
      </section>

      {/* Loyalty Progress */}
      <section className="max-w-screen-xl mx-auto px-6 pb-12">
        <LoyaltyProgress />
      </section>

      {/* Streaks, Badges & Activity */}
      <section className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <StreakBadges />
            <UnlockProgress />
          </div>
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
            Every play earns points towards your rank, badges, vault access, and rewards.
            The more you listen, the more you unlock!
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/music" className="btn-primary">Start Listening</Link>
            <Link href="/" className="btn-secondary">Explore Music</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PointRow({ icon, label, points }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg">
      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-white/80 text-sm flex-1">{label}</span>
      <span className="text-yellow-400 font-bold text-sm">+{points}</span>
    </div>
  );
}
