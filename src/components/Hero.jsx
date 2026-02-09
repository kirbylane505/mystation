/**
 * MYSTATION - Hero Section
 * Solid color. Logo only. Clean.
 */

'use client';

import { Play } from 'lucide-react';
import { getOfficialTracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';

export default function Hero() {
  const { setQueue } = usePlayerStore();
  const officialTracks = getOfficialTracks();

  const handlePlayAll = () => {
    setQueue(officialTracks, 0);
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center" style={{ background: '#0a1628' }}>
      <div className="text-center px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="/images/mpf-logo.png"
            alt="Mike Page Foundation"
            width={320}
            height={320}
            className="drop-shadow-2xl"
            style={{ imageRendering: 'auto' }}
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 font-display tracking-tight">
          MY<span className="text-blue-500">STATION</span>
        </h1>

        {/* One line */}
        <p className="text-lg text-white/50 mb-12 max-w-md mx-auto">
          Stream the entire catalog. Every play gives back.
        </p>

        {/* CTA */}
        <button
          onClick={handlePlayAll}
          className="inline-flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-widest rounded-full transition-all duration-200"
        >
          <Play size={18} fill="white" />
          Play Now
        </button>
      </div>
    </div>
  );
}
