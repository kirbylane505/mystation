/**
 * MYSTATION - Empire Welcome
 * When visitors arrive from LOTL or MyTicketsLive (?ref=empire),
 * show a welcome modal with options: Shop Merch, Get Tickets, Subscribe
 * Auto-plays "Love On The Lawn" track
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';
import { ShoppingBag, Ticket, Music, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

// LOTL track — public single (ID 138)
const LOTL_TRACK = {
  id: 138,
  title: "Love On The Lawn",
  artist: "Mike Page",
  featured: "Vincent Berry II",
  album: "Coming Soon",
  year: 2026,
  duration: "3:48",
  trackNumber: 8,
  albumId: 'singles-2026',
  audioFile: '/audio/grammy-nights/04-love-on-the-lawn.mp3',
  isNew: true,
};

export default function EmpireWelcome() {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const setTrack = usePlayerStore((s) => s.setTrack);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref === 'empire' || ref === 'lotl' || ref === 'tickets') {
      // Only show once per session
      if (!sessionStorage.getItem('empire_welcome_shown')) {
        setShow(true);
        sessionStorage.setItem('empire_welcome_shown', '1');
        // Auto-play LOTL after a short delay (let page render first)
        setTimeout(() => {
          setTrack(LOTL_TRACK);
        }, 1500);
      }
    }
  }, [searchParams, setTrack]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setShow(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition z-10"
        >
          <X size={16} className="text-white/70" />
        </button>

        <div className="bg-gradient-to-b from-[#0f1a2e] to-[#0a0f1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative px-6 pt-8 pb-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 to-transparent" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/15 border border-[#D4AF37]/25 rounded-full mb-4">
                <Sparkles size={12} className="text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">Welcome to MyStation</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Love on the Lawn
                <span className="text-[#D4AF37]"> is Playing</span>
              </h2>
              <p className="text-white/40 text-sm">
                Stream music, shop official merch, grab tickets — all in one place.
                <br />
                <span className="text-white/25">Free for 26 minutes. Then $4.99/mo.</span>
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="px-6 pb-6 space-y-3">
            {/* Shop Merch */}
            <Link
              href="/merch"
              onClick={() => setShow(false)}
              className="flex items-center gap-4 w-full px-5 py-4 bg-white/5 hover:bg-[#D4AF37]/15 border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl transition group"
            >
              <div className="w-11 h-11 bg-[#D4AF37] rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag size={20} className="text-black" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-sm group-hover:text-[#D4AF37] transition">Shop Merch</p>
                <p className="text-white/35 text-xs">LOTL & IDMG official gear</p>
              </div>
              <span className="text-white/20 text-lg">→</span>
            </Link>

            {/* Get Tickets */}
            <a
              href="https://myticketslive.com/events/lotl-2026"
              onClick={() => setShow(false)}
              className="flex items-center gap-4 w-full px-5 py-4 bg-white/5 hover:bg-[#D4AF37]/15 border border-white/8 hover:border-[#D4AF37]/30 rounded-2xl transition group"
            >
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Ticket size={20} className="text-[#D4AF37]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-sm group-hover:text-[#D4AF37] transition">Get Tickets</p>
                <p className="text-white/35 text-xs">LOTL 2026 — Sept 5 — from $20</p>
              </div>
              <span className="text-white/20 text-lg">→</span>
            </a>

            {/* Subscribe */}
            <Link
              href="/account"
              onClick={() => setShow(false)}
              className="flex items-center gap-4 w-full px-5 py-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 hover:from-[#D4AF37]/20 hover:to-[#D4AF37]/10 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 rounded-2xl transition group"
            >
              <div className="w-11 h-11 bg-gradient-to-br from-[#D4AF37] to-[#B8960F] rounded-xl flex items-center justify-center shrink-0">
                <Music size={20} className="text-black" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[#D4AF37] font-bold text-sm">Subscribe — $4.99/mo</p>
                <p className="text-white/35 text-xs">Unlimited streaming, merch discounts</p>
              </div>
              <span className="text-[#D4AF37]/40 text-lg">→</span>
            </Link>
          </div>

          {/* Now Playing indicator */}
          <div className="px-6 pb-5">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-black/40 rounded-xl border border-white/5">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-3 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-4 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2.5 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="w-0.5 h-3.5 bg-[#D4AF37] rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-xs truncate">Now Playing — <span className="text-[#D4AF37]">Love On The Lawn</span></p>
                <p className="text-white/30 text-[10px]">Mike Page ft. Vincent Berry II</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
