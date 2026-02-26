/**
 * MYSTATION - Account Page
 * Subscription status, tier display, upgrade/downgrade, manage via Stripe Portal
 */

'use client';

import { useState } from 'react';
import { useUserStore, usePlayerStore } from '@/store/playerStore';
import { CreditCard, Crown, Music, ExternalLink, Loader2, Star, Gem, Headphones, ArrowUp, Zap } from 'lucide-react';
import Link from 'next/link';

const TIER_CONFIG = {
  diamond: { name: 'Diamond', price: '$14.99', icon: Gem, gradient: 'from-amber-500 to-yellow-500', textColor: 'text-amber-400', level: 3 },
  premium: { name: 'Premium', price: '$9.99', icon: Star, gradient: 'from-purple-500 to-indigo-500', textColor: 'text-purple-400', level: 2 },
  supporter: { name: 'Supporter', price: '$4.99', icon: Headphones, gradient: 'from-blue-500 to-blue-600', textColor: 'text-blue-400', level: 1 },
  regular: { name: 'Supporter', price: '$4.99', icon: Headphones, gradient: 'from-blue-500 to-blue-600', textColor: 'text-blue-400', level: 1 },
  free: { name: 'Free', price: '$0', icon: Music, gradient: 'from-gray-500 to-gray-600', textColor: 'text-white/40', level: 0 },
};

export default function AccountPage() {
  const { isSubscribed, supporterTier, email } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [upgrading, setUpgrading] = useState(null);

  const currentTier = isSubscribed ? (supporterTier || 'supporter') : 'free';
  const config = TIER_CONFIG[currentTier] || TIER_CONFIG.free;
  const TierIcon = config.icon;

  const handleManageSubscription = async () => {
    const userEmail = useUserStore.getState().email;
    if (!userEmail) {
      window.location.href = '/subscribe';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = '/subscribe';
      }
    } catch {
      window.location.href = '/subscribe';
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newTier) => {
    const userEmail = useUserStore.getState().email;
    if (!userEmail) {
      window.location.href = '/subscribe';
      return;
    }

    setUpgrading(newTier);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, newTier }),
      });
      const data = await res.json();
      if (data.success) {
        useUserStore.getState().subscribe(userEmail, newTier);
        window.location.reload();
      } else {
        alert(data.error || 'Upgrade failed — try again or contact support.');
      }
    } catch {
      alert('Network error — please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  // Build upgrade options
  const currentLevel = config.level;
  const upgradeOptions = [];
  if (isSubscribed && currentLevel < 2) upgradeOptions.push({ tier: 'premium', ...TIER_CONFIG.premium });
  if (isSubscribed && currentLevel < 3) upgradeOptions.push({ tier: 'diamond', ...TIER_CONFIG.diamond });

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12 pb-32">
        <h1 className="text-3xl font-black text-white mb-2">Account</h1>
        <p className="text-white/50 mb-10">Manage your MyStation subscription</p>

        {/* Current Plan */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${config.gradient}`}>
              <TierIcon size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                MyStation {config.name}
              </h2>
              <p className="text-white/50 text-sm">
                {isSubscribed
                  ? `${config.price}/month — Unlimited streaming`
                  : '4 free songs per session'
                }
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-400' : 'bg-white/30'}`} />
              <span className="text-white/70 text-sm">Unlimited song streaming</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-400' : 'bg-white/30'}`} />
              <span className="text-white/70 text-sm">Background playback</span>
            </div>
            {currentLevel >= 2 && (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/70 text-sm">Spotify Search — 100M+ songs</span>
              </div>
            )}
            {currentLevel >= 3 && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white/70 text-sm">Your Own Station — upload & sell</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-white/70 text-sm">Full Vault + Grammy Nights access</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-400' : 'bg-white/30'}`} />
              <span className="text-white/70 text-sm">Support the Mike Page Foundation</span>
            </div>
          </div>

          {isSubscribed ? (
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/10 text-white rounded-xl font-medium hover:bg-white/15 transition"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Opening portal...</>
              ) : (
                <><CreditCard size={18} /> Manage Subscription</>
              )}
            </button>
          ) : (
            <Link
              href="/subscribe"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition"
            >
              <Crown size={18} /> Subscribe — Plans from $4.99/mo
            </Link>
          )}
        </div>

        {/* Upgrade Options */}
        {upgradeOptions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ArrowUp size={18} className="text-green-400" /> Upgrade Your Plan
            </h3>
            <div className="space-y-3">
              {upgradeOptions.map((opt) => {
                const OptIcon = opt.icon;
                return (
                  <div key={opt.tier} className={`glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${opt.gradient}`}>
                          <OptIcon size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{opt.name}</p>
                          <p className="text-white/40 text-sm">{opt.price}/month</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpgrade(opt.tier)}
                        disabled={upgrading === opt.tier}
                        className={`px-5 py-2.5 bg-gradient-to-r ${opt.gradient} text-white font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2`}
                      >
                        {upgrading === opt.tier ? (
                          <><Loader2 size={14} className="animate-spin" /> Upgrading...</>
                        ) : (
                          <><Zap size={14} /> Upgrade</>
                        )}
                      </button>
                    </div>
                    {opt.tier === 'premium' && (
                      <p className="text-white/40 text-xs mt-2 ml-13">+ Spotify Search, DJ Turntables, Fan Zone, Early drops</p>
                    )}
                    {opt.tier === 'diamond' && (
                      <p className="text-white/40 text-xs mt-2 ml-13">+ Your Own Station, Vault, Grammy Nights, 10% off merch</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
          <div className="space-y-3">
            <Link href="/music" className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition group">
              <span className="text-white/70 group-hover:text-white transition">Browse Music</span>
              <ExternalLink size={16} className="text-white/30" />
            </Link>
            <Link href="/merch" className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition group">
              <span className="text-white/70 group-hover:text-white transition">Shop Merch</span>
              <ExternalLink size={16} className="text-white/30" />
            </Link>
            <Link href="/lotl" className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition group">
              <span className="text-white/70 group-hover:text-white transition">Love on the Lawn 2026</span>
              <ExternalLink size={16} className="text-white/30" />
            </Link>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Questions? Contact us at <a href="mailto:mystationllc@gmail.com" className="text-blue-400 hover:text-blue-300">mystationllc@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
