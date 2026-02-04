/**
 * MYSTATION - Fan Leaderboard & Points System
 * Gamification to drive engagement
 */

'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Crown, Medal, TrendingUp, Music, Heart, Share2, ShoppingBag, Users, Gift, Zap } from 'lucide-react';
import { useEngagementStore, LEADERBOARD_DATA, POINTS, FAN_RANKS, getFanRank, calculatePoints, BADGES } from '@/store/engagementStore';
import { useUserStore } from '@/store/playerStore';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const { totalPlays, currentStreak, earnedBadges, totalReactions, totalDonated, referralCount } = useEngagementStore();
  const { user, isLoggedIn } = useUserStore();

  // Calculate user's points
  const userStats = {
    totalPlays,
    currentStreak,
    earnedBadges,
    totalReactions,
    totalDonated,
    referralCount,
    dailyLogins: Math.floor(totalPlays / 3), // Estimate
    shares: 0,
    purchases: 0,
  };
  const userPoints = calculatePoints(userStats);
  const userRank = getFanRank(userPoints);

  // Find user's leaderboard position
  const userPosition = LEADERBOARD_DATA.findIndex(l => l.points < userPoints) + 1 || LEADERBOARD_DATA.length + 1;

  // Points breakdown
  const pointsBreakdown = [
    { label: 'Track Plays', value: totalPlays * POINTS.play, icon: Music, detail: `${totalPlays} plays x ${POINTS.play} pts` },
    { label: 'Reactions', value: totalReactions * POINTS.reaction, icon: Heart, detail: `${totalReactions} reactions x ${POINTS.reaction} pts` },
    { label: 'Badges Earned', value: earnedBadges.length * POINTS.badge, icon: Medal, detail: `${earnedBadges.length} badges x ${POINTS.badge} pts` },
    { label: 'Streak Bonus', value: currentStreak >= 30 ? POINTS.streak30 : currentStreak >= 7 ? POINTS.streak7 : currentStreak >= 3 ? POINTS.streak3 : 0, icon: Flame, detail: `${currentStreak} day streak` },
  ];

  return (
    <div className="min-h-screen pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-4">
            <Trophy size={16} />
            Fan Leaderboard
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Top Fans Get <span className="text-yellow-400">Rewarded</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Earn points by listening, engaging, and supporting. Top fans get exclusive perks, early access, and prizes.
          </p>
        </div>

        {/* User Stats Card */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Rank Badge */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center text-5xl`}>
                {userRank.icon}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 rounded-full text-xs font-bold text-white whitespace-nowrap">
                #{userPosition}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 text-center md:text-left">
              <p className={`text-sm font-medium ${userRank.color} mb-1`}>{userRank.name}</p>
              <h2 className="text-3xl font-black text-white mb-2">
                {userPoints.toLocaleString()} <span className="text-lg text-white/60">points</span>
              </h2>
              {isLoggedIn && user?.name && (
                <p className="text-white/60">{user.name}</p>
              )}

              {/* Progress to next rank */}
              {userRank.name !== 'Hall of Fame' && (
                <div className="mt-4">
                  {(() => {
                    const nextRank = FAN_RANKS.find(r => r.minPoints > userPoints);
                    if (!nextRank) return null;
                    const progress = ((userPoints - userRank.minPoints) / (nextRank.minPoints - userRank.minPoints)) * 100;
                    return (
                      <div>
                        <div className="flex justify-between text-xs text-white/40 mb-1">
                          <span>{userRank.name}</span>
                          <span>{nextRank.name} ({nextRank.minPoints - userPoints} pts needed)</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <Music size={20} className="text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{totalPlays}</p>
                <p className="text-xs text-white/40">Plays</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <Flame size={20} className="text-orange-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{currentStreak}</p>
                <p className="text-xs text-white/40">Streak</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <Medal size={20} className="text-yellow-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-white">{earnedBadges.length}</p>
                <p className="text-xs text-white/40">Badges</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'leaderboard', label: 'Top Fans', icon: Trophy },
            { id: 'earn', label: 'Earn Points', icon: Zap },
            { id: 'rewards', label: 'Rewards', icon: Gift },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            {/* Top 3 Spotlight */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {LEADERBOARD_DATA.slice(0, 3).map((fan, i) => (
                <div
                  key={fan.rank}
                  className={`glass rounded-2xl p-6 text-center ${
                    i === 0 ? 'md:order-2 bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30' :
                    i === 1 ? 'md:order-1 bg-gradient-to-b from-gray-400/20 to-transparent' :
                    'md:order-3 bg-gradient-to-b from-orange-700/20 to-transparent'
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{fan.name}</h3>
                  <p className="text-sm text-white/40 mb-3">{fan.city}</p>
                  <p className="text-2xl font-black text-yellow-400">{fan.points.toLocaleString()}</p>
                  <p className="text-xs text-white/40">points</p>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-white/60">
                    <span>{fan.plays} plays</span>
                    <span>{fan.streak} streak</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rest of leaderboard */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-white/40">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Fan</div>
                <div className="col-span-2 text-right">Points</div>
                <div className="col-span-2 text-right hidden md:block">Plays</div>
                <div className="col-span-2 text-right hidden md:block">Streak</div>
                <div className="col-span-1 text-right">Badges</div>
              </div>

              {LEADERBOARD_DATA.slice(3).map((fan) => (
                <div
                  key={fan.rank}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition"
                >
                  <div className="col-span-1 text-white/40 font-bold">{fan.rank}</div>
                  <div className="col-span-4">
                    <p className="text-white font-medium">{fan.name}</p>
                    <p className="text-xs text-white/40">{fan.city}</p>
                  </div>
                  <div className="col-span-2 text-right text-yellow-400 font-bold">{fan.points.toLocaleString()}</div>
                  <div className="col-span-2 text-right text-white/60 hidden md:block">{fan.plays}</div>
                  <div className="col-span-2 text-right hidden md:block">
                    <span className="text-orange-400">{fan.streak} 🔥</span>
                  </div>
                  <div className="col-span-1 text-right text-white/60">{fan.badges}</div>
                </div>
              ))}

              {/* User's position if not in top 10 */}
              {userPosition > 10 && (
                <>
                  <div className="text-center py-2 text-white/20">• • •</div>
                  <div className="grid grid-cols-12 gap-4 p-4 bg-blue-500/10 border-t border-blue-500/30">
                    <div className="col-span-1 text-blue-400 font-bold">{userPosition}</div>
                    <div className="col-span-4">
                      <p className="text-white font-medium">You</p>
                      <p className="text-xs text-blue-400">Keep going!</p>
                    </div>
                    <div className="col-span-2 text-right text-yellow-400 font-bold">{userPoints.toLocaleString()}</div>
                    <div className="col-span-2 text-right text-white/60 hidden md:block">{totalPlays}</div>
                    <div className="col-span-2 text-right hidden md:block">
                      <span className="text-orange-400">{currentStreak} 🔥</span>
                    </div>
                    <div className="col-span-1 text-right text-white/60">{earnedBadges.length}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Earn Points Tab */}
        {activeTab === 'earn' && (
          <div className="space-y-6">
            {/* Your Points Breakdown */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Your Points Breakdown</h3>
              <div className="space-y-3">
                {pointsBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <item.icon size={20} className="text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-xs text-white/40">{item.detail}</p>
                      </div>
                    </div>
                    <p className="text-yellow-400 font-bold">+{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Earn */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">How to Earn Points</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Music, label: 'Listen to Tracks', points: POINTS.play, desc: 'Per track played' },
                  { icon: Flame, label: 'Daily Check-in', points: POINTS.dailyLogin, desc: 'Visit daily' },
                  { icon: Star, label: '3-Day Streak', points: POINTS.streak3, desc: 'Bonus reward' },
                  { icon: Crown, label: '7-Day Streak', points: POINTS.streak7, desc: 'Bonus reward' },
                  { icon: Trophy, label: '30-Day Streak', points: POINTS.streak30, desc: 'Mega bonus' },
                  { icon: Heart, label: 'React to Songs', points: POINTS.reaction, desc: 'Per reaction' },
                  { icon: Share2, label: 'Share Tracks', points: POINTS.share, desc: 'Per share' },
                  { icon: ShoppingBag, label: 'Buy Merch', points: POINTS.purchase, desc: 'Per purchase' },
                  { icon: Gift, label: 'Donate', points: POINTS.donation, desc: 'Any amount' },
                  { icon: Users, label: 'Refer Friends', points: POINTS.referral, desc: 'Per signup' },
                  { icon: Medal, label: 'Earn Badges', points: POINTS.badge, desc: 'Per badge' },
                  { icon: Zap, label: 'Complete Album', points: POINTS.albumComplete, desc: 'Full listen' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                      <item.icon size={24} className="text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-xs text-white/40">{item.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">+{item.points}</p>
                      <p className="text-xs text-white/40">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            {/* Fan Ranks */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Fan Ranks</h3>
              <div className="space-y-3">
                {FAN_RANKS.map((rank, i) => {
                  const isCurrentRank = rank.name === userRank.name;
                  const isUnlocked = userPoints >= rank.minPoints;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-4 p-4 rounded-xl transition ${
                        isCurrentRank ? 'bg-yellow-500/20 border border-yellow-500/30' :
                        isUnlocked ? 'bg-white/10' : 'bg-white/5 opacity-50'
                      }`}
                    >
                      <div className="text-3xl">{rank.icon}</div>
                      <div className="flex-1">
                        <p className={`font-bold ${rank.color}`}>{rank.name}</p>
                        <p className="text-sm text-white/40">{rank.minPoints.toLocaleString()}+ points</p>
                      </div>
                      {isCurrentRank && (
                        <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                          CURRENT
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-white/40 text-sm">
                          {(rank.minPoints - userPoints).toLocaleString()} pts away
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Perks by Rank */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Rank Perks</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { rank: 'Rising Star', perk: 'Exclusive Discord access', icon: '💬' },
                  { rank: 'Dedicated', perk: 'Early music previews', icon: '🎵' },
                  { rank: 'Dedicated', perk: '10% merch discount', icon: '🏷️' },
                  { rank: 'Superfan', perk: 'Monthly shoutouts', icon: '📣' },
                  { rank: 'Superfan', perk: 'Exclusive unreleased tracks', icon: '💿' },
                  { rank: 'Legend', perk: 'Video call with Mike', icon: '📱' },
                  { rank: 'Legend', perk: 'Free signed merch', icon: '✍️' },
                  { rank: 'Hall of Fame', perk: 'VIP event access', icon: '🎫' },
                  { rank: 'Hall of Fame', perk: 'Credit on next album', icon: '👑' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-white font-medium">{item.perk}</p>
                      <p className="text-xs text-white/40">Unlocks at {item.rank}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
