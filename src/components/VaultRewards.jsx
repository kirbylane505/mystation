/**
 * MYSTATION - Vault Rewards Component
 * Shows rewards for 90-day Vault Members
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Gift, Ticket, Crown, Users, ShoppingBag, Phone,
  Lock, CheckCircle, Sparkles, Star, Heart
} from 'lucide-react';
import { useLoyaltyStore, VAULT_REWARDS } from '@/store/loyaltyStore';

const iconMap = {
  'ticket': Ticket,
  'crown': Crown,
  'gift': Gift,
  'users': Users,
  'shopping-bag': ShoppingBag,
  'phone': Phone,
};

export default function VaultRewards() {
  // ═══ VAULT HARD LOCKDOWN — COMPONENT DISABLED ═══
  return null;

  const [mounted, setMounted] = useState(false);
  const { currentStreak, isTop100, canAccessVault } = useLoyaltyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasAccess = canAccessVault();
  const daysRemaining = Math.max(0, 90 - currentStreak);

  return (
    <div className="glass rounded-2xl overflow-hidden border border-yellow-500/20">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-b border-yellow-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30 relative">
            <Gift size={28} className="text-white" />
            {hasAccess && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle size={12} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">VAULT REWARDS</h2>
            <p className="text-white/50">Exclusive perks for loyal listeners</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {hasAccess ? (
        <div className="px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/20">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-green-400" />
            <span className="text-green-400 font-semibold">You've unlocked all rewards! Claim below.</span>
          </div>
        </div>
      ) : (
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-yellow-500/50" />
              <span className="text-white/60">
                {daysRemaining} more days to unlock rewards
              </span>
            </div>
            <div className="text-right">
              <span className="text-yellow-400 font-bold">{currentStreak}/90</span>
              <span className="text-white/40 text-sm ml-2">days</span>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (currentStreak / 90) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Rewards Grid */}
      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {VAULT_REWARDS.map((reward) => {
            const Icon = iconMap[reward.icon] || Gift;
            const isUnlocked = hasAccess;

            return (
              <div
                key={reward.id}
                className={`p-4 rounded-xl border transition ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                    : 'bg-white/[0.02] border-white/10 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                      : 'bg-white/10'
                  }`}>
                    {isUnlocked ? (
                      <Icon size={20} className="text-white" />
                    ) : (
                      <Lock size={16} className="text-white/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                      {reward.name}
                    </h4>
                    <p className="text-white/40 text-sm mt-1">{reward.description}</p>
                  </div>
                </div>

                {isUnlocked && (
                  <button className="w-full mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm rounded-lg transition">
                    Claim Reward
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart size={18} className="text-pink-400" />
            <span className="text-white/70">Supporting the Mike Page Foundation</span>
          </div>
          <p className="text-white/50 text-sm">
            Your streams help fund youth music programs
          </p>
        </div>
      </div>
    </div>
  );
}
