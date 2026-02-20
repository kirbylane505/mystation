/**
 * MYSTATION - CashApp Donation Thank You Popup
 * Intercepts all CashApp donate links site-wide.
 * Shows a heartfelt thank you popup, then opens CashApp.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, X, DollarSign, Sparkles } from 'lucide-react';

export default function CashAppThankYou() {
  const [show, setShow] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setShow(false);
      setClosing(false);
    }, 300);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      // Find the closest anchor tag
      const link = e.target.closest('a[href*="cash.app/$RIDE4PAGEMUSIC847"]');
      if (!link) return;

      // Prevent default navigation
      e.preventDefault();
      e.stopPropagation();

      // Show the thank you popup
      setShow(true);

      // Open CashApp in a new tab after a short delay
      setTimeout(() => {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }, 600);

      // Auto-close popup after 6 seconds
      setTimeout(() => {
        setClosing(true);
        setTimeout(() => {
          setShow(false);
          setClosing(false);
        }, 300);
      }, 6000);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Popup */}
      <div className={`relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl ${closing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700" />

        {/* Shine overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X size={16} className="text-white/70" />
          </button>

          {/* Icon cluster */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <Sparkles size={24} className="text-yellow-300 animate-pulse" />
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Heart size={32} className="text-white" fill="white" />
            </div>
            <Sparkles size={24} className="text-yellow-300 animate-pulse" />
          </div>

          {/* Thank you text */}
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Thank You!
          </h2>
          <p className="text-white/90 text-lg mb-4">
            Your support means everything to us.
          </p>
          <p className="text-white/70 text-sm mb-6 max-w-xs mx-auto">
            Every dollar goes directly to supporting youth music programs through the Mike Page Foundation.
          </p>

          {/* CashApp tag */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 rounded-full border border-white/20 mb-4">
            <DollarSign size={18} className="text-green-300" />
            <span className="text-white font-semibold text-sm">$RIDE4PAGEMUSIC847</span>
          </div>

          <p className="text-white/50 text-xs">
            CashApp is opening in a new tab...
          </p>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes scaleOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.85); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-fadeOut { animation: fadeOut 0.3s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleOut { animation: scaleOut 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
