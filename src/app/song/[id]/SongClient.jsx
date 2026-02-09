'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause, Music, Share2, Heart, Disc3, Loader2, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { shareMP3 } from '@/lib/shareAudio';

export default function SongClient({ track, allTracks, albumArt }) {
  const {
    currentTrack, isPlaying, setTrack, setQueue, togglePlay,
    progress, duration, setProgress, volume, isMuted, setVolume, toggleMute,
    nextTrack, prevTrack
  } = usePlayerStore();
  const [shared, setShared] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);
  const isThisTrack = currentTrack?.id === track.id;
  const isThisPlaying = isThisTrack && isPlaying;

  // Auto-play on mount
  useEffect(() => {
    const albumTracks = allTracks.filter(t => t.albumId === track.albumId);
    const idx = albumTracks.findIndex(t => t.id === track.id);
    setQueue(albumTracks, idx >= 0 ? idx : 0);
  }, [track.id]);

  const handlePlay = () => {
    if (isThisTrack) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  const handleShare = async () => {
    const url = `https://mystationlive.com/song/${track.id}`;
    const text = `Listen to "${track.title}" by Mike Page${track.featured ? ` ft. ${track.featured}` : ''} on MyStation`;
    if (navigator.share) {
      await navigator.share({ title: track.title, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(percent * duration);
  };

  const handleSendMP3 = async () => {
    setMp3Loading(true);
    try {
      await shareMP3(track);
    } catch (err) {
      // User cancelled or error
    } finally {
      setMp3Loading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-mystation-darker to-mystation-black" />
      <div className="bg-orb w-[600px] h-[600px] bg-blue-500 top-[-200px] left-[-150px]" />
      <div className="bg-orb w-[400px] h-[400px] bg-purple-500 bottom-[10%] right-[-100px]" style={{ animationDelay: '-4s' }} />

      <div className="relative max-w-2xl mx-auto px-6 py-12 pb-48 flex flex-col items-center text-center">
        {/* Album Art */}
        <div className="relative mb-8">
          <div className={`w-72 h-72 md:w-80 md:h-80 rounded-3xl bg-gradient-to-br from-blue-600/40 to-purple-900/60 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden relative ${isThisPlaying ? 'shadow-blue-500/30' : ''}`}>
            {albumArt ? (
              <Image src={albumArt} alt={track.album || track.title} fill className="object-cover" />
            ) : (
              <div className="text-center">
                {isThisPlaying ? (
                  <Disc3 size={80} className="text-blue-400 mx-auto mb-3 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Music size={80} className="text-blue-400/60 mx-auto mb-3" />
                )}
                <p className="text-white/30 text-sm font-medium">{track.album}</p>
              </div>
            )}
            {albumArt && isThisPlaying && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-6 bg-white rounded-full animate-pulse" />
                <span className="w-2 h-8 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
          {track.bpm && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm">
              <span className="text-blue-300 text-xs font-medium">{track.bpm} BPM &bull; {track.key}</span>
            </div>
          )}
        </div>

        {/* Track Info */}
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{track.title}</h1>
        <p className="text-xl text-white/60 mb-1">
          Mike Page{track.featured && <span className="text-blue-400"> ft. {track.featured}</span>}
        </p>
        {track.producer && (
          <p className="text-purple-400 text-sm mb-1">Prod. {track.producer}</p>
        )}
        <p className="text-white/30 text-sm mb-8">{track.album} &bull; {track.year} &bull; {track.duration}</p>

        {/* Player Controls */}
        <div className="w-full max-w-md mb-8">
          {/* Transport: Prev / Play / Next */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <button onClick={prevTrack} className="text-white/50 hover:text-white transition active:scale-95">
              <SkipBack size={28} fill="currentColor" />
            </button>
            <button
              onClick={handlePlay}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-110 transition-all duration-300"
            >
              {isThisPlaying ? <Pause size={36} className="text-white" /> : <Play size={36} className="text-white ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-white/50 hover:text-white transition active:scale-95">
              <SkipForward size={28} fill="currentColor" />
            </button>
          </div>

          {/* Progress / Seek Bar */}
          {isThisTrack && (
            <>
              <div
                className="w-full h-3 bg-white/10 rounded-full cursor-pointer relative group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full relative"
                  style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
              <div className="flex justify-between mt-2 px-1">
                <span className="text-xs text-white/40 font-mono">{formatTime(progress)}</span>
                <span className="text-xs text-white/40 font-mono">{formatTime(duration)}</span>
              </div>
            </>
          )}

          {/* Volume Control */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setVolume(Math.max(0, volume - 0.2))}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg font-bold active:bg-white/20 transition"
            >
              −
            </button>
            <button onClick={toggleMute} className="flex items-center gap-2">
              {isMuted || volume === 0 ? (
                <VolumeX size={22} className="text-red-400" />
              ) : (
                <Volume2 size={22} className="text-blue-400" />
              )}
              <span className="text-white font-bold text-sm w-10">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </button>
            <button
              onClick={() => setVolume(Math.min(1, volume + 0.2))}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg font-bold active:bg-white/20 transition"
            >
              +
            </button>
          </div>

          {/* Volume Bars */}
          <div className="flex justify-center gap-1.5 mt-3">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setVolume(level * 0.2)}
                className={`h-6 w-10 rounded-full transition-all ${
                  (isMuted ? 0 : volume) >= level * 0.2
                    ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-12 flex-wrap justify-center">
          <button
            onClick={handleSendMP3}
            disabled={mp3Loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
          >
            {mp3Loading ? <Loader2 size={16} className="animate-spin" /> : <Music size={16} />}
            {mp3Loading ? 'Preparing...' : 'Send MP3'}
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-all"
          >
            <Share2 size={16} />
            {shared ? 'Link Copied!' : 'Share Link'}
          </button>
          <Link
            href="/music"
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-all"
          >
            <Music size={16} />
            Full Catalog
          </Link>
        </div>

        {/* Stream Free Badge */}
        <div className="glass rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Stream Free on MyStation</p>
              <p className="text-white/40 text-xs">Every stream supports the Mike Page Foundation</p>
            </div>
          </div>
          <Link
            href="/"
            className="block w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm rounded-xl text-center hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Open MyStation
          </Link>
        </div>
      </div>
    </div>
  );
}
