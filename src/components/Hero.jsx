/**
 * MYSTATION - Hero Section
 * Animated entrance, floating orbs, premium feel
 * Perf: Lazy YouTube iframe, next/image, CSS gradient orbs
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

export default function Hero() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Animated background orbs — CSS gradients instead of runtime blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full animate-float-slow bg-orb-blue" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full animate-float-slow bg-orb-purple" style={{ animationDelay: '-7s' }} />
      <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] rounded-full animate-float-slow bg-orb-cyan" style={{ animationDelay: '-3s' }} />

      <div className="text-center px-6 relative z-10">
        {/* Logo — next/image with priority for LCP */}
        <div className="mb-6 flex justify-center hero-title">
          <Image
            src="/images/idmg-logo-white.png"
            alt="IDMG - Impossible Dreamz Music Group"
            width={300}
            height={300}
            priority
            className="drop-shadow-2xl"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 font-display tracking-tight hero-subtitle">
          MY<span className="gradient-text">STATION</span>
        </h1>

        {/* Tagline */}
        <p className="text-base md:text-lg text-white/50 mb-8 max-w-md mx-auto hero-cta">
          Your Music. Your Station. No Limits.
        </p>

        {/* Featured Video — Lazy loaded YouTube */}
        <div className="w-full max-w-2xl mx-auto mb-8 hero-cta">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10" style={{ paddingBottom: '56.25%' }}>
            {showVideo ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/xqw4wV8Npzs?rel=0&modestbranding=1&color=white&autoplay=1"
                title="Mike Page - Caught That (Official 4K Video) prod. by The Cubist"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 w-full h-full group cursor-pointer"
                aria-label="Play video"
              >
                {/* YouTube thumbnail */}
                <Image
                  src="https://i.ytimg.com/vi/xqw4wV8Npzs/maxresdefault.jpg"
                  alt="Mike Page - Caught That (Official 4K Video)"
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play size={36} className="text-white ml-1" fill="white" />
                  </div>
                </div>
              </button>
            )}
          </div>
          <p className="text-white/30 text-xs mt-3 text-center uppercase tracking-wider">
            "Caught That" — Official 4K Video • Prod. by The Cubist
          </p>
        </div>

      </div>
    </div>
  );
}
