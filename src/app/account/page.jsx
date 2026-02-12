/**
 * MYSTATION - Account Page
 * Subscription status, manage/cancel via Stripe Customer Portal
 */

'use client';

import { useState } from 'react';
import { useUserStore, usePlayerStore } from '@/store/playerStore';
import { CreditCard, Crown, Music, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const { isSubscribed, supporterTier } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    const email = useUserStore.getState().email;
    if (!email) {
      // No email stored — just link to subscription checkout
      window.location.href = 'https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback — open subscription page
        window.location.href = 'https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04';
      }
    } catch (err) {
      console.error('Portal error:', err);
      window.location.href = 'https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-white mb-2">Account</h1>
        <p className="text-white/50 mb-10">Manage your MyStation subscription</p>

        {/* Subscription Status */}
        <div className="glass rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isSubscribed ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-white/10'}`}>
              {isSubscribed ? <Crown size={28} className="text-white" /> : <Music size={28} className="text-white/40" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isSubscribed ? `MyStation ${supporterTier === 'diamond' ? 'Diamond' : supporterTier === 'premium' ? 'Premium' : 'Regular'}` : 'Free Plan'}
              </h2>
              <p className="text-white/50 text-sm">
                {isSubscribed
                  ? `${supporterTier === 'diamond' ? '$14.99' : supporterTier === 'premium' ? '$9.99' : '$4.99'}/month — Unlimited streaming`
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
            <button
              onClick={() => usePlayerStore.getState().openSubscribeModal()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition"
            >
              <Crown size={18} /> Subscribe — Plans from $4.99/mo
            </button>
          )}
        </div>

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
          Questions? Contact us at <a href="mailto:idmgatl@gmail.com" className="text-blue-400 hover:text-blue-300">idmgatl@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
