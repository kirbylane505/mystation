/**
 * MYSTATION - LOTL Promo Marquee Banner
 * First 250 subscribers who stay until Aug 1 get FREE LOTL 2026 ticket.
 * Glossy scrolling marquee with live count.
 * Shows for EVERYONE. Dismissible per session — returns on next visit.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { X } from 'lucide-react';

// Urgency countdown — spots decrease by 10/day from this baseline
const URGENCY_START = new Date('2026-02-25T00:00:00');
const DAILY_DECREASE = 4;
const FLOOR = 3; // Never show 0 — always "almost gone"

export default function FoundingMemberBanner() {
  const [remaining, setRemaining] = useState(null);
  const [realRemaining, setRealRemaining] = useState(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Admin check for real count badge
  const isAdmin = typeof window !== 'undefined' && (() => {
    try { return sessionStorage.getItem('ADMIN_KEY') === 'mpf2026'; } catch { return false; }
  })();

  useEffect(() => {
    // Check if dismissed this session
    const d = sessionStorage.getItem('founding-banner-dismissed');
    if (d) { setDismissed(true); return; }

    // Fetch remaining founding member slots
    fetch('/api/subscription/subscribe')
      .then(r => r.json())
      .then(data => {
        if (data.remaining > 0) {
          setRealRemaining(data.remaining);

          // Urgency math — decrease by 10/day from baseline
          const daysPassed = Math.max(0, Math.floor((Date.now() - URGENCY_START.getTime()) / 86400000));
          const urgencyCount = Math.max(FLOOR, data.remaining - (daysPassed * DAILY_DECREASE));
          setRemaining(urgencyCount);
          setReady(true);
        }
      })
      .catch(() => {});
  }, []);

  // Only hide if dismissed or data not loaded yet
  if (dismissed || remaining === null || !ready) return null;

  const handleClick = () => {
    usePlayerStore.getState().openSubscribeModal();
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    sessionStorage.setItem('founding-banner-dismissed', Date.now().toString());
    setDismissed(true);
  };

  // Build marquee text
  const spotText = remaining === 1 ? '1 Spot Left' : `${remaining} Spots Left`;
  const segment = `\u00A0\u00A0\u00A0\u2727 FREE LOTL TICKET — Subscribe & Stay Until Aug 1st \u2727\u00A0\u00A0\u00A0\u2022\u00A0\u00A0\u00A0${spotText} of 250 \u2022\u00A0\u00A0\u00A0Love on the Lawn 2026 \u2022\u00A0\u00A0\u00A0Year 5 \u2022`;

  // Repeat enough times for seamless scroll
  const repeated = Array(8).fill(segment).join('');

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer overflow-hidden rounded-none group"
      style={{ animation: 'bannerFadeIn 0.4s ease-out' }}
    >
      {/* Glossy glass background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-blue-500/90 to-purple-600/90 backdrop-blur-md" />

      {/* Top glossy shine */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
        }}
      />

      {/* Subtle moving shine on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'glossShine 1.5s ease-in-out',
        }}
      />

      {/* Bottom edge highlight */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Content wrapper */}
      <div className="relative flex items-center h-10 md:h-11">
        {/* Scrolling marquee */}
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div
            className="inline-block"
            style={{ animation: 'marqueeScroll 30s linear infinite' }}
          >
            <span className="text-white/95 text-xs md:text-sm font-semibold tracking-wide">
              {repeated}
            </span>
          </div>
        </div>

        {/* Admin real count — only Mike sees this */}
        {isAdmin && realRemaining !== null && (
          <div className="shrink-0 px-2 py-0.5 bg-black/40 rounded text-[9px] text-green-400 font-mono mr-1" title="Real subscriber count">
            Real: {realRemaining}
          </div>
        )}

        {/* CTA pill — right side */}
        <div className="shrink-0 flex items-center gap-1.5 mr-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
            className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full border border-white/30 text-white font-bold text-[11px] md:text-xs uppercase tracking-wider transition-all duration-200 hover:scale-105"
          >
            Subscribe
          </button>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
            aria-label="Dismiss"
          >
            <X size={12} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bannerFadeIn {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes glossShine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
