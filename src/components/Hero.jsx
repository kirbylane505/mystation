/**
 * MYSTATION - Hero Section
 * Full-bleed "Caught That" video background — LOTL style
 * YouTube autoplay muted loop, dark overlay, text on top
 */

'use client';

import Image from 'next/image';

export default function Hero() {
  return (
    <section className="video-hero relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Full-bleed YouTube video background — autoplay, muted, loop, no controls */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 scale-[1.2]">
          <iframe
            className="w-full h-full pointer-events-none"
            src="https://www.youtube.com/embed/xqw4wV8Npzs?autoplay=1&mute=1&loop=1&playlist=xqw4wV8Npzs&controls=0&showinfo=0&modestbranding=1&rel=0&playsinline=1&disablekb=1&iv_load_policy=3&enablejsapi=1"
            title="Mike Page - Caught That (Official 4K Video)"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ border: 'none' }}
            tabIndex={-1}
          />
        </div>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/50 z-[1]" />
        {/* Bottom gradient fade into site */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a1628] to-transparent z-[1]" />
      </div>

      {/* Hero content on top of video */}
      <div className="text-center px-6 relative z-10">
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
        <p className="text-lg md:text-xl text-white/70 mb-8 max-w-lg mx-auto hero-cta drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Your Music. Your Station. No Limits.
        </p>

        {/* Video credit */}
        <p className="text-white/30 text-xs uppercase tracking-[0.2em] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          "Caught That" — Official 4K Video &bull; Prod. by The Cubist
        </p>
      </div>
    </section>
  );
}
