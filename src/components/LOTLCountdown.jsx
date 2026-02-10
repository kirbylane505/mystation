/**
 * MYSTATION - LOTL 2026 Countdown Timer
 * Reusable countdown component for homepage and LOTL page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Ticket, MapPin, Flame } from 'lucide-react';

const FESTIVAL_DATE = new Date('2026-09-05T14:00:00');

function TimeUnit({ value, label }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-1">
        <span className="text-2xl sm:text-3xl font-black text-white">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function LOTLCountdown({ variant = 'full' }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      const diff = FESTIVAL_DATE - now;
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  // Compact variant for homepage
  if (variant === 'compact') {
    return (
      <Link href="/lotl" className="block group">
        <div className="relative overflow-hidden rounded-2xl p-[1px]" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)' }}>
          <div className="bg-mystation-navyDark rounded-2xl px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Flame size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Love on the Lawn 2026</p>
                  <p className="text-white/40 text-xs flex items-center gap-1">
                    <Calendar size={10} /> Sept 5 <span className="mx-1">|</span> <MapPin size={10} /> Elgin, IL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-center px-2">
                  <span className="text-lg font-black text-orange-400">{timeLeft.days}</span>
                  <p className="text-white/30 text-[10px]">DAYS</p>
                </div>
                <span className="text-white/20">:</span>
                <div className="text-center px-2">
                  <span className="text-lg font-black text-pink-400">{timeLeft.hours}</span>
                  <p className="text-white/30 text-[10px]">HRS</p>
                </div>
                <span className="text-white/20">:</span>
                <div className="text-center px-2">
                  <span className="text-lg font-black text-purple-400">{timeLeft.minutes}</span>
                  <p className="text-white/30 text-[10px]">MIN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Full variant
  return (
    <div className="relative overflow-hidden rounded-3xl p-[2px]" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #f97316)', backgroundSize: '300% 100%', animation: 'lotl-border-flow 6s linear infinite' }}>
      <div className="bg-mystation-navyDark rounded-[22px] px-8 py-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-4">
            <Flame size={14} className="text-orange-400" />
            <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Love on the Lawn 2026</span>
          </div>

          <h3 className="text-2xl font-black text-white mb-2">September 5, 2026 | Elgin, IL</h3>
          <p className="text-white/50 text-sm mb-6">10,000 capacity Hip-Hop/R&B festival</p>

          <div className="flex justify-center gap-3 sm:gap-4 mb-6">
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Secs" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/lotl"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/30"
            >
              <Ticket size={18} />
              Get Tickets
            </Link>
            <Link
              href="/merch"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition"
            >
              Shop Festival Merch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
