'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/playerStore';
import { Crown, Star, Home as HomeIcon, Gift, Check, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const TIERS = [
  {
    name: 'DREAMER',
    threshold: 50000, // $500 in cents
    icon: Star,
    color: 'from-blue-500 to-indigo-600',
    glow: 'shadow-blue-500/30',
    border: 'border-blue-500/40',
    textColor: 'text-blue-400',
    perks: [
      'Exclusive 15% merch discount for life',
      'LOTL VIP access (skip the line + VIP section)',
      'Name on the MyStation Wall of Dreamers',
      'Early access to new drops & releases',
      'Dreamer-only group chat access',
    ],
  },
  {
    name: 'IDMG COMPOUND WEEKEND',
    threshold: 250000, // $2500 in cents
    icon: Crown,
    color: 'from-amber-400 to-yellow-600',
    glow: 'shadow-amber-500/40',
    border: 'border-amber-500/50',
    textColor: 'text-amber-400',
    perks: [
      'Free weekend at the IDMG Compound',
      'Room & food completely taken care of',
      'Experience the everyday IDMG lifestyle',
      'Chance to be a part of the team',
      'Exclusive gifts & signed merch',
      'Lifetime friendships with the Dreamerz',
      'All Dreamer tier perks included',
    ],
  },
];

export default function RewardsPage() {
  const { user, isLoggedIn } = useUserStore();
  const [spending, setSpending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpending() {
      if (!isLoggedIn || !user?.email) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/rewards?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setSpending(data.totalSpentCents || 0);
        }
      } catch (e) {
        console.error('Failed to fetch rewards:', e);
      }
      setLoading(false);
    }
    fetchSpending();
  }, [isLoggedIn, user?.email]);

  const currentTier = TIERS.filter(t => spending >= t.threshold).pop();
  const nextTier = TIERS.find(t => spending < t.threshold);

  const formatDollars = (cents) => `$${(cents / 100).toLocaleString()}`;

  return (
    <div className="min-h-screen pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-indigo-900/20 to-black" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6">
            <Crown size={16} className="text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Dreamer Rewards</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white mb-4">
            SPEND. EARN. <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">EXPERIENCE.</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Every dollar you spend on MyStation brings you closer to exclusive rewards,
            VIP access, and the ultimate prize — a weekend at the IDMG Compound.
          </p>
        </div>
      </section>

      {/* Spending Progress */}
      <section className="max-w-4xl mx-auto px-6 -mt-4 mb-16">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {isLoggedIn ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/50 text-sm">Your Total Spending</p>
                  <p className="text-3xl font-black text-white">{formatDollars(spending)}</p>
                </div>
                {currentTier ? (
                  <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${currentTier.color} rounded-full`}>
                    <currentTier.icon size={16} className="text-white" />
                    <span className="text-white text-sm font-bold">{currentTier.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                    <Gift size={16} className="text-white/60" />
                    <span className="text-white/60 text-sm font-medium">No tier yet</span>
                  </div>
                )}
              </div>

              {nextTier && (
                <>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/40">Progress to {nextTier.name}</span>
                    <span className={nextTier.textColor}>
                      {formatDollars(nextTier.threshold - spending)} to go
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${nextTier.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${Math.min((spending / nextTier.threshold) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-white/30 text-xs mt-2">
                    {Math.round((spending / nextTier.threshold) * 100)}% complete
                  </p>
                </>
              )}

              {!nextTier && currentTier && (
                <p className="text-amber-400 font-medium mt-2">
                  You&apos;ve unlocked the highest tier. Welcome to the family.
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-white/50 mb-4">Sign in to track your rewards progress</p>
              <Link href="/account" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition">
                Sign In <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tier Cards */}
      <section className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Reward Tiers</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {TIERS.map((tier, i) => {
            const unlocked = spending >= tier.threshold;
            return (
              <div
                key={tier.name}
                className={`relative bg-white/5 backdrop-blur-xl rounded-2xl border ${
                  unlocked ? tier.border : 'border-white/10'
                } p-8 ${unlocked ? `shadow-lg ${tier.glow}` : ''} transition-all hover:border-white/20`}
              >
                {/* Tier badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                      <tier.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg">{tier.name}</h3>
                      <p className="text-white/40 text-sm">Spend {formatDollars(tier.threshold)}</p>
                    </div>
                  </div>
                  {unlocked ? (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 rounded-full">
                      <Check size={14} className="text-green-400" />
                      <span className="text-green-400 text-xs font-bold">UNLOCKED</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full">
                      <Lock size={14} className="text-white/30" />
                      <span className="text-white/30 text-xs font-medium">LOCKED</span>
                    </div>
                  )}
                </div>

                {/* Perks */}
                <ul className="space-y-3">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        unlocked ? `bg-gradient-to-br ${tier.color}` : 'bg-white/10'
                      }`}>
                        <Check size={12} className={unlocked ? 'text-white' : 'text-white/30'} />
                      </div>
                      <span className={unlocked ? 'text-white/80' : 'text-white/40'}>{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {!unlocked && (
                  <Link
                    href="/merch"
                    className={`mt-8 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r ${tier.color} rounded-xl text-white font-bold hover:shadow-lg transition`}
                  >
                    <ShoppingBag size={16} /> Shop Merch
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 mt-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Shop', desc: 'Buy merch, tickets, or subscriptions on MyStation' },
            { step: '2', title: 'Earn', desc: 'Every dollar counts toward your tier progress' },
            { step: '3', title: 'Unlock', desc: 'Hit the threshold and claim your rewards' },
          ].map((s) => (
            <div key={s.step} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-black text-lg">
                {s.step}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-white/40 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 mt-20 text-center">
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl border border-amber-500/20 p-10">
          <Crown size={40} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-3">The IDMG Compound Awaits</h2>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">
            A free weekend. Room and food on us. Experience the lifestyle.
            Build lifetime friendships with the Dreamerz. This isn&apos;t merch — it&apos;s a movement.
          </p>
          <Link
            href="/merch"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl text-black font-black hover:shadow-lg hover:shadow-amber-500/30 transition"
          >
            Start Your Journey <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ShoppingBag({ size, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
