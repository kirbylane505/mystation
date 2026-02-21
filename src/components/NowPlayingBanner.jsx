/**
 * MYSTATION - Now Playing Banner
 * Shows current track info + controls on every page
 * Collapses to slim bar when no track selected
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { progressBridge } from '@/lib/progressBridge';
import {
  Play, Pause, SkipBack, SkipForward, Music, Volume2
} from 'lucide-react';

export default function NowPlayingBanner() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const duration = usePlayerStore(s => s.duration);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const prevTrack = usePlayerStore(s => s.prevTrack);

  const progressRef = useRef(null);
  const timeRef = useRef(null);

  useEffect(() => {
    const unsub = progressBridge.subscribe((p, d) => {
      const pct = d ? (p / d) * 100 : 0;
      if (progressRef.current) progressRef.current.style.width = `${pct}%`;
      if (timeRef.current) {
        const mins = Math.floor(p / 60);
        const secs = Math.floor(p % 60);
        timeRef.current.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    });
    return unsub;
  }, []);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 mb-4">
      <div className="glass rounded-2xl p-3 md:p-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Album Art */}
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-xl flex items-center justify-center shrink-0 border border-white/10 relative overflow-hidden">
            <Music size={22} className="text-blue-400" />
            {isPlaying && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                <span className="w-0.5 h-2.5 bg-blue-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest">Now Playing</p>
            <h3 className="text-white font-bold text-sm md:text-base truncate">{currentTrack.title}</h3>
            <p className="text-white/50 text-xs truncate">
              Mike Page{currentTrack.featured ? ` ft. ${currentTrack.featured}` : ''}
              {currentTrack.producer && <span className="text-purple-400"> · {currentTrack.producer}</span>}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <button onClick={prevTrack} className="text-white/40 hover:text-white transition hidden md:block">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 hover:scale-105 transition"
            >
              {isPlaying
                ? <Pause size={18} fill="white" className="text-white" />
                : <Play size={18} fill="white" className="text-white ml-0.5" />
              }
            </button>
            <button onClick={nextTrack} className="text-white/40 hover:text-white transition hidden md:block">
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 flex items-center gap-2">
          <span ref={timeRef} className="text-[10px] text-white/30 w-8 text-right font-mono">0:00</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div ref={progressRef} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-none" style={{ width: '0%' }} />
          </div>
          <span className="text-[10px] text-white/30 w-8 font-mono">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
