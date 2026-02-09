/**
 * MYSTATION - Timed Popups
 * 1. Donate/Subscribe popup every 2 minutes
 * 2. Merch/Deals popup every 4 minutes
 * Music keeps playing — these are overlay-only
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Heart, CreditCard, Crown, ShoppingBag, Sparkles, Ticket, Package, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/playerStore';

// ============ DONATE / SUBSCRIBE POPUP (every 2 min) ============
function DonatePopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10">
          <X size={18} />
        </button>

        {/* Header glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative pt-10 pb-6 px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Heart size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Support the Mission</h2>
          <p className="text-white/60 text-sm">
            Every dollar funds youth music programs, free meals, and community support through the Mike Page Foundation.
          </p>
        </div>

        <div className="px-8 pb-4 space-y-3">
          {/* Subscribe */}
          <a
            href="https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04"
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/30"
          >
            <Crown size={18} />
            Subscribe — $4.99/mo
          </a>

          {/* Donate */}
          <Link
            href="/contact"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 font-bold rounded-xl hover:bg-green-500/30 transition"
          >
            <Gift size={18} />
            Make a Donation
          </Link>
        </div>

        {/* Benefits */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white/5 rounded-xl">
              <p className="text-white text-xs font-bold">Youth Music</p>
              <p className="text-white/40 text-[10px]">Free instruments</p>
            </div>
            <div className="p-2 bg-white/5 rounded-xl">
              <p className="text-white text-xs font-bold">Free Meals</p>
              <p className="text-white/40 text-[10px]">Feed My Friends</p>
            </div>
            <div className="p-2 bg-white/5 rounded-xl">
              <p className="text-white text-xs font-bold">Scholarships</p>
              <p className="text-white/40 text-[10px]">Education fund</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 text-center">
          <button onClick={onClose} className="text-white/40 text-sm hover:text-white/60 transition">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MERCH / DEALS POPUP (every 4 min) ============
function MerchPopup({ onClose }) {
  const deals = [
    { emoji: '👕', name: '2 Tanks', price: '$35.98', was: '$39.98', save: 'SAVE $4', color: 'green' },
    { emoji: '🎪', name: 'Festival Pack', price: '$85.69', was: '$100.81', save: 'FESTIVAL PACK', color: 'purple' },
    { emoji: '🔥', name: 'Full Fit Pack', price: '$103.53', was: '$121.80', save: 'FULL FIT', color: 'pink' },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10">
          <X size={18} />
        </button>

        {/* Header glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-orange-500/20 rounded-full blur-3xl" />

        <div className="relative pt-10 pb-4 px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <ShoppingBag size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Official Merch</h2>
          <p className="text-white/60 text-sm">Rep the movement. Every purchase supports the Mike Page Foundation.</p>
        </div>

        {/* LOTL Promo */}
        <div className="px-8 pb-4">
          <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={16} className="text-orange-400" />
              <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Love on the Lawn 2026</span>
            </div>
            <p className="text-white text-sm font-bold">Spend $50+ = 25% OFF tickets</p>
            <p className="text-white text-sm font-bold">Spend $100+ = 1 FREE TICKET</p>
          </div>
        </div>

        {/* Deal Cards */}
        <div className="px-8 pb-4 space-y-3">
          {deals.map((deal, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition">
              <span className="text-2xl">{deal.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm">{deal.name}</p>
                  <span className={`px-2 py-0.5 bg-${deal.color}-500/20 text-${deal.color}-400 text-[10px] font-bold rounded-full`}>{deal.save}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-${deal.color}-400 font-black`}>{deal.price}</span>
                  <span className="text-white/30 line-through text-xs">{deal.was}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-8 pb-4">
          <Link
            href="/merch"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/30"
          >
            <ShoppingBag size={18} />
            Shop Now
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Any 5+ discount */}
        <div className="px-8 pb-4 text-center">
          <p className="text-white/50 text-xs">
            <Sparkles size={12} className="inline text-blue-400 mr-1" />
            Any 5+ items = <span className="text-blue-400 font-bold">15% OFF</span> auto-applied at checkout
          </p>
        </div>

        <div className="px-8 pb-8 text-center">
          <button onClick={onClose} className="text-white/40 text-sm hover:text-white/60 transition">
            Keep listening
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN CONTROLLER ============
export default function TimedPopups() {
  const [showDonate, setShowDonate] = useState(false);
  const [showMerch, setShowMerch] = useState(false);
  const { isSubscribed } = useUserStore();

  useEffect(() => {
    // Don't show donate popup to subscribers
    const donateInterval = setInterval(() => {
      if (!isSubscribed) {
        setShowDonate(true);
      }
    }, 2 * 60 * 1000); // 2 minutes

    const merchInterval = setInterval(() => {
      setShowMerch(true);
    }, 4 * 60 * 1000); // 4 minutes

    return () => {
      clearInterval(donateInterval);
      clearInterval(merchInterval);
    };
  }, [isSubscribed]);

  // Don't stack popups — merch takes priority if both fire at same time
  if (showMerch) {
    return <MerchPopup onClose={() => setShowMerch(false)} />;
  }

  if (showDonate) {
    return <DonatePopup onClose={() => setShowDonate(false)} />;
  }

  return null;
}
