/**
 * MYSTATION - Timed Popups
 * 1. Donate/Subscribe popup every 7 minutes
 * 2. Merch/Deals popup every 4 minutes
 * Music keeps playing — these are overlay-only
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Heart, CreditCard, Crown, ShoppingBag, Sparkles, Ticket, Package, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useUserStore, usePlayerStore } from '@/store/playerStore';

// ============ DONATE / SUBSCRIBE POPUP (every 7 min) ============
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

        {/* Free month + LOTL ticket promo */}
        <div className="px-8 pb-4">
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
            <p className="text-yellow-300 text-sm font-bold">
              <Sparkles size={14} className="inline mr-1" />
              Your First Month is FREE!
            </p>
            <p className="text-white/50 text-xs">Every new subscriber gets their first 30 days free</p>
            <p className="text-green-400 text-xs font-bold mt-1">First 250 subscribers get a FREE ticket to Love on the Lawn!</p>
          </div>
        </div>

        <div className="px-8 pb-4 space-y-3">
          {/* Subscribe */}
          <button
            onClick={() => { onClose(); usePlayerStore.getState().openSubscribeModal(); }}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/30"
          >
            <Crown size={18} />
            Subscribe — Plans from $4.99/mo
          </button>

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

// ============ MERCH / DEALS POPUP (every 4 min, auto-dismiss 10s) ============
// Featuring LOTL hoodie visual — pushing LOTL merch for 2026 Year 5
function MerchPopup({ onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10 * 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-green-900/80 via-mystation-navy to-mystation-navyDark rounded-3xl border border-green-500/20 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10">
          <X size={18} />
        </button>

        {/* Animated glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-green-500/20 rounded-full blur-3xl animate-pulse" />

        {/* LOTL Year 5 Badge */}
        <div className="relative pt-6 px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
            <Sparkles size={14} className="text-green-400" />
            <span className="text-green-400 text-xs font-black uppercase tracking-wider">LOTL 2026 — Year 5</span>
          </div>
        </div>

        {/* LOTL Hoodie Visual */}
        <div className="px-8 pb-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
            <img
              src="/images/mockups/lotl-hoodie-black.jpg"
              alt="Love on the Lawn 2026 Hoodie"
              className="w-full h-56 object-cover"
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-black text-lg">LOTL Official Hoodie</p>
              <p className="text-green-400 text-sm font-bold">Limited Edition Festival Gear</p>
            </div>
          </div>
        </div>

        {/* Ticket Promo */}
        <div className="px-8 pb-4">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Ticket size={16} className="text-green-400" />
              <span className="text-green-300 text-xs font-bold uppercase tracking-wider">Festival Merch Deal</span>
            </div>
            <p className="text-white text-sm font-bold">Spend $50+ = 25% OFF LOTL tickets</p>
            <p className="text-white text-sm font-bold">Spend $100+ = 1 FREE TICKET</p>
            <p className="text-white/40 text-xs mt-1">September 5, 2026 — Festival Park, Elgin IL</p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-8 pb-4">
          <Link
            href="/merch"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-green-500/30"
          >
            <ShoppingBag size={18} />
            Shop LOTL Merch
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="px-8 pb-6 text-center">
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
    // Don't show donate popup to subscribers — check both Zustand state AND cookies
    const donateInterval = setInterval(() => {
      const hasSub = typeof document !== 'undefined' && (
        document.cookie.includes('mystation-sub=') ||
        document.cookie.includes('mystation-friend=') ||
        document.cookie.includes('mystation-auth=')
      );
      if (!isSubscribed && !hasSub) {
        setShowDonate(true);
      }
    }, 7 * 60 * 1000); // 7 minutes

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
