/**
 * MYSTATION - Hero Section
 * IDMG logo + brand + "Caught That" video under tagline
 */

'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <section className="video-hero relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628]" />
      {/* Subtle orb effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />

      {/* Hero content */}
      <div className="text-center px-6 relative z-10 w-full max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-6 flex justify-center hero-title">
          <Image
            src="/images/idmg-logo-white.png"
            alt="IDMG - Impossible Dreamz Music Group"
            width={280}
            height={280}
            priority
            className="drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-4 font-display tracking-tight hero-subtitle drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          MY<span className="gradient-text">STATION</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-lg mx-auto hero-cta drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Your Music. Your Station. No Limits.
        </p>

        {/* "Caught That" Official 4K Video */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/xqw4wV8Npzs?rel=0&modestbranding=1&playsinline=1"
            title="Mike Page - Caught That (Official 4K Video)"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>
        <p className="text-white/30 text-xs uppercase tracking-[0.2em] mt-4">
          "Caught That" — Official 4K Video &bull; Prod. by The Cubist
        </p>
      </div>
    </section>
  );
}
