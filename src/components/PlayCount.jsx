/**
 * Play Count Display
 * Shows track popularity with animated counter
 */

'use client';

import { useEffect, useState } from 'react';
import { Play, TrendingUp, Flame } from 'lucide-react';

// Format large numbers (1234 -> 1.2K, 1234567 -> 1.2M)
const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

export default function PlayCount({
  count = 0,
  variant = 'default', // default, compact, badge
  showIcon = true,
  showTrending = false,
  className = ''
}) {
  const [displayCount, setDisplayCount] = useState(0);

  // Animate count on mount
  useEffect(() => {
    if (count === 0) return;

    const duration = 1000;
    const steps = 30;
    const increment = count / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= count) {
        setDisplayCount(count);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [count]);

  // Badge variant - small pill
  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-white/60 text-xs ${className}`}>
        <Play size={10} fill="currentColor" />
        {formatCount(displayCount)}
      </span>
    );
  }

  // Compact variant - just number
  if (variant === 'compact') {
    return (
      <span className={`flex items-center gap-1 text-white/50 text-sm ${className}`}>
        {showIcon && <Play size={12} fill="currentColor" />}
        {formatCount(displayCount)}
      </span>
    );
  }

  // Default variant - full display
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-white/60">
        <Play size={14} fill="currentColor" />
        <span className="font-medium">{formatCount(displayCount)}</span>
        <span className="text-white/40 text-sm">plays</span>
      </div>

      {showTrending && count > 1000 && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 rounded-full">
          <Flame size={12} className="text-orange-400" />
          <span className="text-orange-400 text-xs font-medium">Trending</span>
        </div>
      )}
    </div>
  );
}

// Hook to track and retrieve play counts
export function usePlayCount(trackId) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Load from localStorage (will connect to Supabase later)
    const plays = JSON.parse(localStorage.getItem('mystation_plays') || '{}');
    setCount(plays[trackId] || 0);
  }, [trackId]);

  const incrementPlay = () => {
    const plays = JSON.parse(localStorage.getItem('mystation_plays') || '{}');
    plays[trackId] = (plays[trackId] || 0) + 1;
    localStorage.setItem('mystation_plays', JSON.stringify(plays));
    setCount(plays[trackId]);
  };

  return { count, incrementPlay };
}
