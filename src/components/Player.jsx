/**
 * MYSTATION - Premium Audio Player
 * Mobile-first responsive design
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat,
  Heart, Share2, Music, Sparkles, ChevronUp, X
} from 'lucide-react';

export default function Player() {
  const audioRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    playCount,
    togglePlay,
    setProgress,
    setDuration,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    openSubscribeModal,
  } = usePlayerStore();

  const { isSubscribed } = useUserStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close expanded view on escape
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    setProgress(newTime);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  // Calculate remaining free plays
  const freePlaysRemaining = Math.max(0, 3 - playCount);
  const showFreePlaysBadge = mounted && !isSubscribed && freePlaysRemaining > 0;

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-16 md:h-24 bg-mystation-navyDark/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-center">
        <p className="text-white/30 flex items-center gap-3 text-sm md:text-base">
          <Music size={18} />
          Select a track to play
        </p>
      </div>
    );
  }

  // MOBILE EXPANDED VIEW
  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-mystation-navy via-mystation-navyDark to-mystation-black flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setExpanded(false)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center z-10"
        >
          <X size={20} className="text-white" />
        </button>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-72 h-72 md:w-80 md:h-80 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
            <Music size={80} className="text-blue-400" />
            {isPlaying && (
              <div className="absolute bottom-8 flex gap-1">
                <span className="w-2 h-6 bg-blue-400 rounded-full animate-pulse" />
                <span className="w-2 h-8 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="px-8 mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{currentTrack.title}</h2>
          <p className="text-white/50">Mike Page {currentTrack.featured && `ft. ${currentTrack.featured}`}</p>
          {currentTrack.bpm && (
            <p className="text-blue-400/60 text-sm mt-2">{currentTrack.bpm} BPM • {currentTrack.key}</p>
          )}
        </div>

        {/* Progress */}
        <div className="px-8 mb-6">
          <div className="progress-bar h-2 rounded-full" onClick={handleProgressClick}>
            <div className="progress-bar-fill h-full rounded-full" style={{ width: `${(progress / duration) * 100 || 0}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-white/40 font-mono">{formatTime(progress)}</span>
            <span className="text-xs text-white/40 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="px-8 pb-12">
          <div className="flex items-center justify-center gap-8 mb-8">
            <button onClick={toggleShuffle} className={shuffle ? 'text-blue-400' : 'text-white/40'}>
              <Shuffle size={22} />
            </button>
            <button onClick={prevTrack} className="text-white/60">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40"
            >
              {isPlaying ? <Pause size={36} fill="white" className="text-white" /> : <Play size={36} fill="white" className="text-white ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-white/60">
              <SkipForward size={32} fill="currentColor" />
            </button>
            <button onClick={toggleRepeat} className={repeat !== 'off' ? 'text-blue-400' : 'text-white/40'}>
              <Repeat size={22} />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-4 justify-center">
            <button onClick={toggleMute} className="text-white/40">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-32"
            />
          </div>
        </div>
      </div>
    );
  }

  // MOBILE MINI PLAYER (shows on small screens)
  return (
    <>
      {/* Mobile Mini Player */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-mystation-navy/95 backdrop-blur-xl border-t border-white/5 z-40"
        onClick={() => setExpanded(true)}
      >
        {/* Mini Progress Bar */}
        <div className="h-1 bg-white/10">
          <div className="h-full bg-blue-500" style={{ width: `${(progress / duration) * 100 || 0}%` }} />
        </div>

        <div className="flex items-center gap-3 p-3">
          {/* Album Art */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
            <Music size={18} className="text-blue-400" />
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">{currentTrack.title}</h4>
            <p className="text-xs text-white/50 truncate">Mike Page</p>
          </div>

          {/* Play/Pause */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0"
          >
            {isPlaying ? <Pause size={18} fill="white" className="text-white" /> : <Play size={18} fill="white" className="text-white ml-0.5" />}
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextTrack(); }}
            className="text-white/60 shrink-0"
          >
            <SkipForward size={22} fill="currentColor" />
          </button>

          {/* Expand */}
          <ChevronUp size={20} className="text-white/40 shrink-0" />
        </div>
      </div>

      {/* Desktop Player */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 h-28 bg-mystation-navy/95 backdrop-blur-xl border-t border-white/5 z-40">
        {showFreePlaysBadge && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <Sparkles size={14} className="text-yellow-300" />
            <span className="text-white text-sm font-medium">{freePlaysRemaining} free {freePlaysRemaining === 1 ? 'song' : 'songs'} left</span>
            <button onClick={() => openSubscribeModal()} className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs text-white font-semibold transition">Unlock All</button>
          </div>
        )}

        {mounted && isSubscribed && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg flex items-center gap-2">
            <Sparkles size={12} className="text-white" />
            <span className="text-white text-xs font-medium">Unlimited Access</span>
          </div>
        )}

        <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-80">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden">
              <Music size={24} className="text-blue-400" />
              {isPlaying && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate text-base">{currentTrack.title}</h4>
              <p className="text-sm text-white/50 truncate">Mike Page {currentTrack.featured && `ft. ${currentTrack.featured}`}</p>
              {currentTrack.bpm && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-blue-400/60">{currentTrack.bpm} BPM</span>
                  {currentTrack.key && <><span className="text-white/20">|</span><span className="text-xs text-blue-400/60">{currentTrack.key}</span></>}
                </div>
              )}
            </div>
            <button className="text-white/40 hover:text-blue-400 transition"><Heart size={20} /></button>
          </div>

          {/* Player Controls */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center justify-center gap-8 mb-3">
              <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}><Shuffle size={18} /></button>
              <button onClick={prevTrack} className="text-white/60 hover:text-white transition"><SkipBack size={22} fill="currentColor" /></button>
              <button onClick={togglePlay} className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg shadow-blue-500/30">
                {isPlaying ? <Pause size={26} className="text-white" fill="white" /> : <Play size={26} className="text-white ml-1" fill="white" />}
              </button>
              <button onClick={nextTrack} className="text-white/60 hover:text-white transition"><SkipForward size={22} fill="currentColor" /></button>
              <button onClick={toggleRepeat} className={`transition relative ${repeat !== 'off' ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}>
                <Repeat size={18} />
                {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[10px] font-bold">1</span>}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-white/40 w-12 text-right font-mono">{formatTime(progress)}</span>
              <div className="progress-bar flex-1" onClick={handleProgressClick}>
                <div className="progress-bar-fill" style={{ width: `${(progress / duration) * 100 || 0}%` }} />
              </div>
              <span className="text-xs text-white/40 w-12 font-mono">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center gap-4 w-80 justify-end">
            <button onClick={toggleMute} className="text-white/40 hover:text-white transition">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="w-28">
              <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-full" />
            </div>
            <button className="text-white/40 hover:text-white transition ml-2"><Share2 size={18} /></button>
          </div>
        </div>
      </div>
    </>
  );
}
