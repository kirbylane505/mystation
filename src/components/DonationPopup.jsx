/**
 * MYSTATION - Donation Popup
 * Appears every 60 seconds to encourage donations
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Heart, Sparkles, ExternalLink, Users, Globe } from 'lucide-react';

export default function DonationPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Show popup every 60 seconds
    const interval = setInterval(() => {
      setIsVisible(true);
    }, 60000); // 60 seconds

    // Also show after initial 30 second delay for first visit
    const initialTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDonate = () => {
    window.open('https://cash.app/$RIDE4PAGEMUSIC847', '_blank');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - fully opaque to prevent bleed-through */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
          {/* Gradient header */}
          <div className="relative bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 px-6 py-8 text-center overflow-hidden">
            {/* Animated hearts */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <Heart
                  key={i}
                  size={20}
                  className="absolute text-white/20 animate-float"
                  style={{
                    left: `${15 + i * 15}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: '3s'
                  }}
                  fill="currentColor"
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
            >
              <X size={18} className="text-white" />
            </button>

            {/* Icon */}
            <div className="relative w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <Heart size={32} className="text-white" fill="white" />
            </div>

            <h2 className="relative text-2xl font-bold text-white mb-2">
              Mike Page Foundation
            </h2>
            <p className="relative text-white/90 text-lg font-medium">
              Where Everybody Matters
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-6 bg-gradient-to-b from-mystation-navy to-mystation-navyDark">
            {/* Mission statement */}
            <p className="text-center text-white/80 text-lg leading-relaxed mb-6">
              We lead with <span className="text-pink-400 font-semibold">love</span> through
              community building and integrating <span className="text-blue-400 font-semibold">every culture</span> around.
            </p>

            {/* Impact icons */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-pink-500/20 rounded-xl flex items-center justify-center">
                  <Users size={24} className="text-pink-400" />
                </div>
                <p className="text-white/50 text-xs">Community</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Globe size={24} className="text-blue-400" />
                </div>
                <p className="text-white/50 text-xs">Unity</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Heart size={24} className="text-orange-400" />
                </div>
                <p className="text-white/50 text-xs">Love</p>
              </div>
            </div>

            {/* Donate button */}
            <button
              onClick={handleDonate}
              className="w-full py-4 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 flex items-center justify-center gap-3"
            >
              <Sparkles size={20} />
              Donate Now
              <ExternalLink size={16} />
            </button>

            {/* CashApp tag */}
            <p className="text-center text-white/40 text-sm mt-4">
              $RIDE4PAGEMUSIC847
            </p>

            {/* 501(c)(3) badge */}
            <div className="flex justify-center mt-4">
              <span className="px-3 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                501(c)(3) Tax Deductible
              </span>
            </div>
          </div>
        </div>

        {/* Skip text */}
        <button
          onClick={handleClose}
          className="w-full mt-3 py-2 text-white/40 hover:text-white/60 text-sm transition"
        >
          Maybe later
        </button>
      </div>

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(100%) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-400%) rotate(20deg);
            opacity: 0;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
