/**
 * MYSTATION - Hero Section
 * Artist showcase with donation CTA
 */

'use client';

import DonationButton from './DonationButton';
import { Play, Users, Music, Heart } from 'lucide-react';
import { tracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';

export default function Hero() {
  const { setQueue } = usePlayerStore();

  const handlePlayAll = () => {
    setQueue(tracks, 0);
  };

  return (
    <div className="relative min-h-[70vh] flex items-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-mystation-accent/50 via-mystation-darker to-mystation-darker" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-mystation-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-mystation-purple/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="foundation-badge mb-6 inline-flex items-center gap-2">
              <Heart size={14} className="text-mystation-gold" />
              Mike Page Foundation
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 font-display leading-tight">
              MY<span className="text-mystation-gold">STATION</span>
            </h1>

            <p className="text-xl text-white/70 mb-8 max-w-lg">
              Stream Mike Page's entire catalog for <span className="text-white font-semibold">FREE</span>.
              Every donation supports youth music programs and community events through the Mike Page Foundation.
            </p>

            {/* Stats */}
            <div className="flex gap-8 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-mystation-gold/20 rounded-full flex items-center justify-center">
                  <Music size={24} className="text-mystation-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{tracks.length}+</p>
                  <p className="text-white/60 text-sm">Tracks</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-mystation-gold/20 rounded-full flex items-center justify-center">
                  <Users size={24} className="text-mystation-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-white/60 text-sm">To Foundation</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 px-8 py-4 bg-white text-mystation-dark rounded-full font-bold hover:bg-white/90 transition"
              >
                <Play size={24} />
                Play Now
              </button>
              <DonationButton variant="hero" />
            </div>
          </div>

          {/* Right: Album Art */}
          <div className="relative">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Main album */}
              <div className="absolute inset-0 bg-gradient-to-br from-mystation-gold/30 to-mystation-purple/30 rounded-3xl glow-gold">
                <div className="absolute inset-4 bg-mystation-accent rounded-2xl flex items-center justify-center overflow-hidden">
                  <div className="text-center">
                    <p className="text-6xl mb-4">🎤</p>
                    <h3 className="text-2xl font-bold text-white mb-2">MIKE PAGE</h3>
                    <p className="text-white/60">Cindy's Son & More</p>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-mystation-gold rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
                <span className="text-3xl">🔥</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-mystation-purple rounded-2xl shadow-lg flex items-center justify-center">
                <span className="text-2xl">💿</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
