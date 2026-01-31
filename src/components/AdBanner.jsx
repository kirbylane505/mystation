/**
 * MYSTATION - Ad Banner Component
 * Google AdSense integration for monetization
 * Shows ads between songs and in dedicated slots
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// Ad slot configurations
const AD_SLOTS = {
  banner: {
    format: 'horizontal',
    style: { display: 'block', width: '100%', height: '90px' }
  },
  sidebar: {
    format: 'rectangle',
    style: { display: 'block', width: '300px', height: '250px' }
  },
  inFeed: {
    format: 'fluid',
    style: { display: 'block', width: '100%' }
  },
  interstitial: {
    format: 'auto',
    style: { display: 'block', width: '100%', maxWidth: '728px' }
  }
};

// Placeholder for development - shows ad slot info
function AdPlaceholder({ type, onClose }) {
  return (
    <div className="relative bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl overflow-hidden">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition z-10"
        >
          <X size={16} className="text-white/60" />
        </button>
      )}
      <div className="p-4 text-center" style={AD_SLOTS[type]?.style}>
        <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Advertisement</p>
        <p className="text-white/20 text-xs">Ad space - {type}</p>
      </div>
    </div>
  );
}

// Main Ad Banner Component
export default function AdBanner({
  type = 'banner',
  adSlot = '', // Your AdSense ad slot ID
  adClient = '', // Your AdSense publisher ID (ca-pub-XXXXXXXX)
  showClose = false,
  className = ''
}) {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [showAd, setShowAd] = useState(true);

  useEffect(() => {
    // Only load AdSense in production with valid credentials
    if (adClient && adSlot && typeof window !== 'undefined') {
      try {
        // Check if adsbygoogle script is loaded
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
          setAdLoaded(true);
        }
      } catch (e) {
        console.log('AdSense not available:', e);
      }
    }
  }, [adClient, adSlot]);

  if (!showAd) return null;

  // Show placeholder in development or when AdSense not configured
  if (!adClient || !adSlot) {
    return (
      <div className={className}>
        <AdPlaceholder type={type} onClose={showClose ? () => setShowAd(false) : null} />
      </div>
    );
  }

  // Production AdSense
  return (
    <div className={`relative ${className}`}>
      {showClose && (
        <button
          onClick={() => setShowAd(false)}
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition z-10"
        >
          <X size={16} className="text-white/60" />
        </button>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={AD_SLOTS[type]?.style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={AD_SLOTS[type]?.format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Audio Ad Component - plays between songs
export function AudioAd({ onComplete, onSkip }) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        if (prev <= 10) setCanSkip(true);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="glass rounded-3xl p-8 max-w-md w-full mx-4 text-center">
        <p className="text-white/40 text-sm uppercase tracking-wider mb-4">Advertisement</p>

        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-4xl font-bold text-white">{timeLeft}</span>
        </div>

        <p className="text-white text-lg mb-2">Support Mike Page</p>
        <p className="text-white/50 text-sm mb-6">
          Ads help fund new music and the Mike Page Foundation
        </p>

        {canSkip ? (
          <button
            onClick={onSkip}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition"
          >
            Skip Ad
          </button>
        ) : (
          <p className="text-white/30 text-sm">Skip available in {timeLeft - 5}s</p>
        )}
      </div>
    </div>
  );
}

// Interstitial Ad - shows between page loads or actions
export function InterstitialAd({ isOpen, onClose }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full">
        <div className="absolute top-0 right-0 -translate-y-full pb-2 flex items-center gap-2">
          <span className="text-white/40 text-sm">Ad</span>
          {countdown > 0 ? (
            <span className="text-white/60 text-sm">Close in {countdown}s</span>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition"
            >
              <X size={14} />
              Close
            </button>
          )}
        </div>

        <div className="glass rounded-2xl p-8">
          <AdBanner type="interstitial" />
        </div>
      </div>
    </div>
  );
}
