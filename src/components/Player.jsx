/**
 * MYSTATION - Premium Audio Player
 * Navy blue theme
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat,
  Heart, Share2, Music
} from 'lucide-react';

export default function Player() {
  const audioRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    togglePlay,
    setProgress,
    setDuration,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

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
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-mystation-navyDark/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-center">
        <p className="text-white/30 flex items-center gap-3">
          <Music size={20} />
          Select a track to start listening
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-28 bg-mystation-navy/95 backdrop-blur-xl border-t border-white/5">
      <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between gap-6">

        {/* Track Info */}
        <div className="flex items-center gap-4 w-80">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-xl flex items-center justify-center border border-white/10">
            <Music size={24} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate text-base">
              {currentTrack.title}
            </h4>
            <p className="text-sm text-white/50 truncate">
              Mike Page {currentTrack.featured && `ft. ${currentTrack.featured}`}
            </p>
          </div>
          <button className="text-white/40 hover:text-blue-400 transition">
            <Heart size={20} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center justify-center gap-8 mb-3">
            <button
              onClick={toggleShuffle}
              className={`transition ${shuffle ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>

            <button
              onClick={prevTrack}
              className="text-white/60 hover:text-white transition"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg shadow-blue-500/30"
            >
              {isPlaying ? (
                <Pause size={26} className="text-white" fill="white" />
              ) : (
                <Play size={26} className="text-white ml-1" fill="white" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-white/60 hover:text-white transition"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`transition relative ${repeat !== 'off' ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
            >
              <Repeat size={18} />
              {repeat === 'one' && (
                <span className="absolute -top-1 -right-1 text-[10px] font-bold">1</span>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40 w-12 text-right font-mono">
              {formatTime(progress)}
            </span>
            <div
              className="progress-bar flex-1"
              onClick={handleProgressClick}
            >
              <div
                className="progress-bar-fill"
                style={{ width: `${(progress / duration) * 100 || 0}%` }}
              />
            </div>
            <span className="text-xs text-white/40 w-12 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center gap-4 w-80 justify-end">
          <button
            onClick={toggleMute}
            className="text-white/40 hover:text-white transition"
          >
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <div className="w-28">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full"
            />
          </div>

          <button className="text-white/40 hover:text-white transition ml-2">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
