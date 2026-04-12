'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Pause, Music, Share2, Heart, Disc3, Loader2, SkipBack, SkipForward, Volume2, VolumeX, RotateCcw, Smartphone } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { progressBridge } from '@/lib/progressBridge';
import { shareMP3 } from '@/lib/shareAudio';
import CommentSection from '@/components/CommentSection';
import VoiceCommand from '@/components/VoiceCommand';
import RelatedTracks from '@/components/RelatedTracks';

// Get the global audio element set by AudioPlayer
function getAudio() {
  return typeof window !== 'undefined' ? window.__mystation_audio : null;
}

// Detect iOS — volume is hardware-only on iOS Safari
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function SongClient({ track, allTracks, albumArt, shared: isSharedLink = false }) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setTrack = usePlayerStore(s => s.setTrack);
  const setQueue = usePlayerStore(s => s.setQueue);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const volume = usePlayerStore(s => s.volume);
  const isMuted = usePlayerStore(s => s.isMuted);
  const setVolume = usePlayerStore(s => s.setVolume);
  const toggleMute = usePlayerStore(s => s.toggleMute);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const prevTrack = usePlayerStore(s => s.prevTrack);
  const setSharedTrackId = usePlayerStore(s => s.setSharedTrackId);
  const clearSharedTrack = usePlayerStore(s => s.clearSharedTrack);

  const [shared, setShared] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveDuration, setLiveDuration] = useState(0);
  const seekBarRef = useRef(null);
  const progressBarRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isThisTrack = currentTrack?.id === track.id;
  const isThisPlaying = isThisTrack && isPlaying;
  const isiOS = mounted && isIOS();

  useEffect(() => { setMounted(true); }, []);

  // Shared link — grant full play for this ONE track, expires on navigation
  useEffect(() => {
    if (isSharedLink && track?.id) {
      setSharedTrackId(track.id);
      sessionStorage.setItem('mystation-shared-track', String(track.id));
    }
    return () => {
      clearSharedTrack();
      sessionStorage.removeItem('mystation-shared-track');
    };
  }, [isSharedLink, track?.id, setSharedTrackId, clearSharedTrack]);

  // Subscribe to progressBridge for real-time progress (no re-renders via store)
  useEffect(() => {
    const unsub = progressBridge.subscribe((p, d) => {
      setLiveProgress(p);
      setLiveDuration(d);
      // Direct DOM update for smooth seek bar (avoids React re-render lag)
      if (progressBarRef.current && d > 0) {
        progressBarRef.current.style.width = `${(p / d) * 100}%`;
      }
    });
    return unsub;
  }, []);

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

  // Rewind 10 seconds — use audio element directly (store progress is stale)
  const handleRewind = useCallback(() => {
    const audio = getAudio();
    if (audio && audio.duration > 0) {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    }
  }, []);

  // Forward 10 seconds — use audio element directly
  const handleForward = useCallback(() => {
    const audio = getAudio();
    if (audio && audio.duration > 0) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    }
  }, []);

  const handleShare = async () => {
    const url = `https://mystationlive.com/song/${track.id}?shared=true`;
    const text = `🎵 "${track.title}" - ${track.artist || 'Mike Page'}\n\nStream now on MyStation.`;
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

  // Seek — use audio element directly
  const seekToPosition = useCallback((clientX) => {
    const bar = seekBarRef.current;
    const audio = getAudio();
    if (!bar || !audio || !audio.duration) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = percent * audio.duration;
  }, []);

  const handleSeek = (e) => seekToPosition(e.clientX);

  // Touch drag support for seek bar
  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    seekToPosition(e.touches[0].clientX);
  };
  const handleTouchMove = (e) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      seekToPosition(e.touches[0].clientX);
    }
  };
  const handleTouchEnd = () => { isDraggingRef.current = false; };

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
          {track.artist || 'Mike Page'}{track.featured && <span className="text-blue-400"> ft. {track.featured}</span>}
        </p>
        {track.producer && (
          <p className="text-purple-400 text-sm mb-1">Prod. {track.producer}</p>
        )}
        <p className="text-white/30 text-sm mb-8">{track.album} &bull; {track.year} &bull; {track.duration}</p>

        {/* Player Controls */}
        <div className="w-full max-w-md mb-8">
          {/* Progress / Seek Bar — live via progressBridge */}
          <div
            ref={seekBarRef}
            className="w-full h-3 bg-white/10 rounded-full cursor-pointer relative group touch-none"
            onClick={handleSeek}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full relative"
              style={{ width: `${liveDuration ? (liveProgress / liveDuration) * 100 : 0}%`, transition: 'none' }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg md:opacity-0 md:group-hover:opacity-100 transition" />
            </div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-xs text-white/40 font-mono">{formatTime(isThisTrack ? liveProgress : 0)}</span>
            <span className="text-xs text-white/40 font-mono">{formatTime(isThisTrack ? liveDuration : 0)}</span>
          </div>

          {/* Transport: Rewind / Prev / Play / Next / Forward */}
          <div className="flex items-center justify-center gap-4 mt-4 mb-5">
            <button
              onClick={handleRewind}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all"
              title="Rewind 10s"
            >
              <RotateCcw size={20} />
            </button>
            <button onClick={prevTrack} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button
              onClick={handlePlay}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-300"
            >
              {isThisPlaying ? <Pause size={36} className="text-white" /> : <Play size={36} className="text-white ml-1" />}
            </button>
            <button onClick={nextTrack} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all">
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button
              onClick={handleForward}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all rotate-180"
              title="Forward 10s"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Volume Control — iOS uses hardware buttons only */}
          {isiOS ? (
            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.04] rounded-xl">
              <Smartphone size={16} className="text-white/40" />
              <span className="text-white/40 text-sm">Use device volume buttons</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setVolume(Math.max(0, volume - 0.2))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-bold active:bg-white/20 active:scale-90 transition-all"
                >
                  −
                </button>
                <button onClick={toggleMute} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition">
                  {mounted && (isMuted || volume === 0) ? (
                    <VolumeX size={24} className="text-red-400" />
                  ) : (
                    <Volume2 size={24} className="text-blue-400" />
                  )}
                  <span className="text-white font-bold text-lg w-12 text-center">{mounted ? Math.round((isMuted ? 0 : volume) * 100) : 80}%</span>
                </button>
                <button
                  onClick={() => setVolume(Math.min(1, volume + 0.2))}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-bold active:bg-white/20 active:scale-90 transition-all"
                >
                  +
                </button>
              </div>

              {/* Volume Bars — larger touch targets */}
              <div className="flex justify-center gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setVolume(level * 0.2)}
                    className={`h-8 w-12 rounded-lg transition-all active:scale-90 ${
                      mounted && (isMuted ? 0 : volume) >= level * 0.2
                        ? 'bg-gradient-to-t from-blue-500 to-cyan-400 shadow-md shadow-blue-500/20'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-6 flex-wrap justify-center">
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
          <CommentSection trackId={track.id} trackTitle={track.title} />
          <VoiceCommand />
          <Link
            href="/music"
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-all"
          >
            <Music size={16} />
            Full Catalog
          </Link>
        </div>

        {/* Navigation Options for Recipients */}
        <div className="glass rounded-2xl p-6 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Stream Free on MyStation</p>
              <p className="text-white/40 text-xs">Every stream supports the Mike Page Foundation</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="block w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm rounded-xl text-center hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Open MyStation
            </Link>
            <Link
              href="/music"
              className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl text-center transition-all"
            >
              Browse All Music
            </Link>
            <Link
              href="/events"
              className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl text-center transition-all"
            >
              Tour the Site
            </Link>
          </div>
        </div>

        {/* Related Tracks */}
        <div className="w-full max-w-md mt-8">
          <RelatedTracks trackId={parseInt(track.id, 10)} />
        </div>
      </div>
    </div>
  );
}
