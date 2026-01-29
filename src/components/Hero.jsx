/**
 * MYSTATION - Premium Hero Section
 * Navy blue & black theme
 */

'use client';

import DonationButton from './DonationButton';
import { Play, Users, Music, Heart, Sparkles } from 'lucide-react';
import { tracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';

export default function Hero() {
  const { setQueue } = usePlayerStore();

  const handlePlayAll = () => {
    setQueue(tracks, 0);
  };

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-mystation-navy via-mystation-navyDark to-mystation-black" />

      {/* Animated orbs */}
      <div className="bg-orb w-[600px] h-[600px] bg-blue-500 top-[-200px] left-[-100px]" />
      <div className="bg-orb w-[500px] h-[500px] bg-blue-600 bottom-[-150px] right-[-100px]" style={{ animationDelay: '-7s' }} />
      <div className="bg-orb w-[300px] h-[300px] bg-blue-400 top-[40%] right-[20%]" style={{ animationDelay: '-14s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="foundation-badge mb-8 inline-flex items-center gap-2">
              <Sparkles size={14} />
              Mike Page Foundation
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 font-display leading-[0.9] tracking-tight">
              MY<br/>
              <span className="gradient-text">STATION</span>
            </h1>

            <p className="text-xl text-white/60 mb-10 max-w-lg leading-relaxed">
              Stream Mike Page's entire catalog <span className="text-white font-semibold">completely free</span>.
              Every donation supports youth music programs through the Foundation.
            </p>

            {/* Stats */}
            <div className="flex gap-12 mb-12">
              <div>
                <p className="text-4xl font-bold text-white mb-1">{tracks.length}+</p>
                <p className="text-white/40 text-sm uppercase tracking-wider">Tracks</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-1">100%</p>
                <p className="text-white/40 text-sm uppercase tracking-wider">To Foundation</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-white mb-1">Free</p>
                <p className="text-white/40 text-sm uppercase tracking-wider">Forever</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handlePlayAll}
                className="btn-primary flex items-center gap-3"
              >
                <Play size={20} fill="white" />
                Play Now
              </button>
              <DonationButton variant="hero" />
            </div>
          </div>

          {/* Right: Album Art */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main album card */}
              <div className="absolute inset-0 glass glow-blue-strong rounded-3xl p-8">
                <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-blue-900/40 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  {/* Album visual */}
                  <div className="text-center z-10">
                    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                      <Music size={56} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">MIKE PAGE</h3>
                    <p className="text-blue-300/80">Cindy's Son & More</p>
                  </div>

                  {/* Decorative rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border border-white/5 rounded-full" />
                    <div className="absolute w-80 h-80 border border-white/5 rounded-full" />
                    <div className="absolute w-96 h-96 border border-white/5 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-blue-500 rounded-full shadow-lg flex items-center gap-2">
                <span className="text-white font-bold text-sm">NEW</span>
              </div>

              <div className="absolute -bottom-4 -left-4 px-5 py-3 glass rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Heart size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">501(c)(3)</p>
                  <p className="text-white/50 text-xs">Tax Deductible</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
