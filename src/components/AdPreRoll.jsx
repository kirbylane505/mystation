'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AdPreRoll — Pre-roll audio ad component
 * Fetches and plays an audio ad + displays banner before the actual song plays.
 * Only shown to non-subscribers. Subscribers skip straight to music.
 */
export default function AdPreRoll({ onAdComplete, onAdSkipped }) {
  const [ad, setAd] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Fetch a random ad
    fetch('/api/ads/serve')
      .then((r) => r.json())
      .then((data) => {
        if (data.ad) {
          setAd(data.ad);
        } else {
          // No ads available — skip
          onAdComplete?.();
        }
      })
      .catch(() => {
        onAdComplete?.();
      });
  }, []);

  const handlePlay = useCallback(() => {
    if (!audioRef.current || !ad) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {
      // Autoplay blocked — skip ad
      onAdComplete?.();
    });
  }, [ad, onAdComplete]);

  // Auto-play when ad loads
  useEffect(() => {
    if (ad && audioRef.current) {
      handlePlay();
    }
  }, [ad, handlePlay]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    setPlaying(false);
    // Log completed impression
    if (ad) {
      fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: ad.id, completed: true }),
      }).catch(() => {});
    }
    onAdComplete?.();
  };

  const handleBannerClick = () => {
    if (!ad?.click_url) return;
    // Log click
    fetch('/api/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, clicked: true }),
    }).catch(() => {});
    window.open(ad.click_url, '_blank', 'noopener');
  };

  if (!ad) return null;

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Banner */}
        <div
          onClick={handleBannerClick}
          className={`rounded-xl overflow-hidden mb-4 ${ad.click_url ? 'cursor-pointer' : ''}`}
        >
          <img
            src={ad.banner_url}
            alt={ad.title}
            className="w-full h-auto rounded-xl"
          />
        </div>

        {/* Ad label + progress */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider">Ad</span>
          <div className="flex-1 h-1 bg-[#27272a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-[#71717a]">
            {Math.ceil(duration - progress)}s
          </span>
        </div>

        <p className="text-center text-[#52525b] text-xs">
          Subscribe for ad-free listening
        </p>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={ad.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={() => onAdComplete?.()}
        />
      </div>
    </div>
  );
}
