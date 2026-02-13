/**
 * MYSTATION - Hero Section
 * Animated entrance, floating orbs, premium feel
 */

import { getOfficialTracks } from '@/data/tracks';

export default function Hero() {
  const officialTracks = getOfficialTracks();

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Animated background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[100px] animate-float-slow" style={{ animationDelay: '-7s' }} />
      <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] bg-blue-400/5 rounded-full blur-[80px] animate-float-slow" style={{ animationDelay: '-3s' }} />

      <div className="text-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-6 flex justify-center hero-title">
          <img
            src="/images/idmg-logo-white.png"
            alt="IDMG - Impossible Dreamz Music Group"
            width={300}
            height={300}
            className="drop-shadow-2xl"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 font-display tracking-tight hero-subtitle">
          MY<span className="gradient-text">STATION</span>
        </h1>

        {/* Tagline */}
        <p className="text-base md:text-lg text-white/50 mb-10 max-w-md mx-auto hero-cta">
          Stream the entire catalog. Every play gives back.
        </p>

        {/* Stats bar */}
        <div className="mt-4 flex items-center justify-center gap-8 text-white/30 text-xs uppercase tracking-wider hero-stats">
          <span>{officialTracks.length} Tracks</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>100% Free</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>501(c)(3)</span>
        </div>
      </div>
    </div>
  );
}
