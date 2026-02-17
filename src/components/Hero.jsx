/**
 * MYSTATION - Hero Section
 * Clean hero with animated orbs, IDMG logo, premium feel
 */

import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Animated background orbs — CSS gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full animate-float-slow bg-orb-blue" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full animate-float-slow bg-orb-purple" style={{ animationDelay: '-7s' }} />
      <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] rounded-full animate-float-slow bg-orb-cyan" style={{ animationDelay: '-3s' }} />

      <div className="text-center px-6 relative z-10">
        {/* Logo */}
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
      </div>
    </section>
  );
}
