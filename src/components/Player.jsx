/**
 * MYSTATION - Main Audio Player Component
 * Luxury design with full controls
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat,
  Heart, Share2
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

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
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

  // Volume slider
  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-mystation-darker border-t border-white/10 flex items-center justify-center">
        <p className="text-white/50">Select a track to start listening</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 glass border-t border-white/10">
      <div className="max-w-screen-2xl mx-auto h-full px-4 flex items-center justify-between gap-4">

        {/* Track Info */}
        <div className="flex items-center gap-4 w-72">
          <div className="w-16 h-16 bg-mystation-accent rounded-lg flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">
              {currentTrack.title}
            </h4>
            <p className="text-sm text-white/60 truncate">
              Mike Page {currentTrack.featured && `ft. ${currentTrack.featured}`}
            </p>
          </div>
          <button className="text-white/60 hover:text-mystation-gold transition">
            <Heart size={20} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center justify-center gap-6 mb-2">
            <button
              onClick={toggleShuffle}
              className={`transition ${shuffle ? 'text-mystation-gold' : 'text-white/60 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>

            <button
              onClick={prevTrack}
              className="text-white/80 hover:text-white transition"
            >
              <SkipBack size={24} />
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-mystation-gold rounded-full flex items-center justify-center hover:scale-105 transition"
            >
              {isPlaying ? (
                <Pause size={24} className="text-mystation-dark" />
              ) : (
                <Play size={24} className="text-mystation-dark ml-1" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-white/80 hover:text-white transition"
            >
              <SkipForward size={24} />
            </button>

            <button
              onClick={toggleRepeat}
              className={`transition ${repeat !== 'off' ? 'text-mystation-gold' : 'text-white/60 hover:text-white'}`}
            >
              <Repeat size={18} />
              {repeat === 'one' && <span className="text-xs ml-0.5">1</span>}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 w-10 text-right">
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
            <span className="text-xs text-white/60 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center gap-4 w-72 justify-end">
          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition"
          >
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 accent-mystation-gold"
          />

          <button className="text-white/60 hover:text-white transition">
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
