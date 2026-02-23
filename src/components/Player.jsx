/**
 * MYSTATION - Premium Audio Player v4
 * Spotify/Apple Music tier — draggable seek, premium visuals, background audio
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { progressBridge } from '@/lib/progressBridge';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Volume1, Shuffle, Repeat, Repeat1,
  Heart, Share2, Music, ChevronUp, ChevronDown, X,
  AlarmClock, Moon, Loader2, ListMusic
} from 'lucide-react';
import AlarmClockModal from './AlarmClock';
import SleepTimer from './SleepTimer';
import VoiceCommand from './VoiceCommand';
import SeekBar from './SeekBar';
import { shareMP3 } from '@/lib/shareAudio';
import { albums } from '@/data/tracks';
import Image from 'next/image';
import { Smartphone } from 'lucide-react';

// iOS Safari ignores audio.volume — hardware buttons only
function useIsIOS() {
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  }, []);
  return ios;
}

// Get album cover art for a track
function getAlbumArt(track) {
  if (!track) return null;
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || null;
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Volume icon based on level
function VolumeIcon({ volume, muted, size = 18 }) {
  if (muted || volume === 0) return <VolumeX size={size} className="text-white/50" />;
  if (volume < 0.5) return <Volume1 size={size} className="text-white/60" />;
  return <Volume2 size={size} className="text-white/60" />;
}

export default function Player() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);

  // Mini player progress refs (direct DOM, zero re-renders)
  const miniProgressRef = useRef(null);
  const miniTimeRef = useRef(null);

  // Zustand selectors
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const duration = usePlayerStore(s => s.duration);
  const volume = usePlayerStore(s => s.volume);
  const isMuted = usePlayerStore(s => s.isMuted);
  const shuffle = usePlayerStore(s => s.shuffle);
  const repeat = usePlayerStore(s => s.repeat);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const setVolume = usePlayerStore(s => s.setVolume);
  const toggleMute = usePlayerStore(s => s.toggleMute);
  const nextTrack = usePlayerStore(s => s.nextTrack);
  const prevTrack = usePlayerStore(s => s.prevTrack);
  const toggleShuffle = usePlayerStore(s => s.toggleShuffle);
  const toggleRepeat = usePlayerStore(s => s.toggleRepeat);
  const favorites = useUserStore(s => s.favorites);
  const toggleFavorite = useUserStore(s => s.toggleFavorite);

  // Subscribe to progressBridge for mini player bar
  useEffect(() => {
    const unsub = progressBridge.subscribe((p, d) => {
      const pct = d > 0 ? (p / d) * 100 : 0;
      if (miniProgressRef.current) miniProgressRef.current.style.width = `${pct}%`;
    });
    return unsub;
  }, []);

  useEffect(() => { setMounted(true); }, []);

  // Close expanded on escape
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Lock body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  const isiOS = useIsIOS();
  const isFavorite = currentTrack ? favorites.includes(currentTrack.id) : false;

  // Share handlers
  const shareTrack = (platform) => {
    const trackUrl = `https://mystationlive.com/song/${currentTrack.id}`;
    const text = `Listen to "${currentTrack.title}" by Mike Page on MyStation! ${currentTrack.featured ? `ft. ${currentTrack.featured}` : ''} #MikePage #MyStation #IDMG`;
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(trackUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackUrl)}&quote=${encodeURIComponent(text)}`,
      tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(trackUrl)}&text=${encodeURIComponent(text)}`,
      snapchat: `https://www.snapchat.com/share?url=${encodeURIComponent(trackUrl)}`,
      instagram: `https://www.instagram.com/`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + trackUrl)}`,
      copy: trackUrl
    };
    if (platform === 'copy') {
      navigator.clipboard.writeText(trackUrl);
      toast.success('Link copied!');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({ title: `${currentTrack.title} - Mike Page`, text, url: trackUrl });
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleSendMP3 = async () => {
    setMp3Loading(true);
    try { await shareMP3(currentTrack); } catch {} finally { setMp3Loading(false); setShowShareMenu(false); }
  };

  // Volume slider handlers
  const volumeTrackRef = useRef(null);
  const handleVolumeInteraction = useCallback((e) => {
    if (!volumeTrackRef.current) return;
    const rect = volumeTrackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setVolume(pct);
  }, [setVolume]);

  const onVolMouseDown = useCallback((e) => {
    e.preventDefault();
    handleVolumeInteraction(e);
    const move = (e) => handleVolumeInteraction(e);
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [handleVolumeInteraction]);

  // ========================================
  // EMPTY STATE — no track selected
  // ========================================
  if (!currentTrack) {
    return (
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 h-16 md:h-20 bg-[#0a0f1a]/98 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-center z-[500]">
        <p className="text-white/25 flex items-center gap-2.5 text-sm">
          <Music size={16} />
          Select a track to play
        </p>
      </div>
    );
  }

  const albumArt = getAlbumArt(currentTrack);

  // ========================================
  // MOBILE EXPANDED — Full-screen now playing
  // ========================================
  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(180deg, #0c1929 0%, #070d17 50%, #030508 100%)' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <button onClick={() => setExpanded(false)} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronDown size={28} className="text-white/60" />
          </button>
          <div className="text-center">
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">Now Playing</p>
          </div>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="w-10 h-10 flex items-center justify-center -mr-2"
          >
            <Share2 size={20} className="text-white/60" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Album Art */}
          <div className="flex items-center justify-center px-8 pt-4 pb-6">
            <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-xl overflow-hidden shadow-2xl shadow-black/60">
              {albumArt ? (
                <Image src={albumArt} alt={currentTrack.album || currentTrack.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600/40 to-indigo-900/60 flex items-center justify-center">
                  <Music size={80} className="text-blue-400/60" />
                </div>
              )}
              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-[3px] bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="w-[3px] h-4 bg-blue-400 rounded-full now-playing-bar" />
                  <span className="w-[3px] h-6 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '150ms' }} />
                  <span className="w-[3px] h-3 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '300ms' }} />
                  <span className="w-[3px] h-5 bg-cyan-400 rounded-full now-playing-bar" style={{ animationDelay: '100ms' }} />
                </div>
              )}
            </div>
          </div>

          {/* Track Info + Heart */}
          <div className="px-8 mb-6 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-[22px] font-bold text-white leading-tight truncate">{currentTrack.title}</h2>
              <p className="text-[15px] text-white/50 mt-0.5">
                Mike Page{currentTrack.featured ? ` ft. ${currentTrack.featured}` : ''}
              </p>
              {currentTrack.producer && (
                <p className="text-[13px] text-purple-400/80 mt-1">Prod. {currentTrack.producer}</p>
              )}
            </div>
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="mt-1 ml-4 shrink-0"
            >
              <Heart
                size={24}
                className={isFavorite ? 'text-red-500' : 'text-white/30'}
                fill={isFavorite ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          {/* Seek Bar */}
          <div className="px-8 mb-8">
            <SeekBar showTimes height={4} />
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-7 px-8 mb-8">
            <button onClick={toggleShuffle} className={`p-2 ${shuffle ? 'text-blue-400' : 'text-white/30'}`}>
              <Shuffle size={20} />
            </button>
            <button onClick={prevTrack} className="p-2 text-white/70 active:text-white active:scale-95 transition">
              <SkipBack size={28} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-[72px] h-[72px] bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/20 active:scale-95 transition"
            >
              {isPlaying
                ? <Pause size={32} className="text-black" fill="black" />
                : <Play size={32} className="text-black ml-1" fill="black" />
              }
            </button>
            <button onClick={nextTrack} className="p-2 text-white/70 active:text-white active:scale-95 transition">
              <SkipForward size={28} fill="currentColor" />
            </button>
            <button onClick={toggleRepeat} className={`p-2 relative ${repeat !== 'off' ? 'text-blue-400' : 'text-white/30'}`}>
              {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>
          </div>

          {/* Volume - iOS shows hardware message, others get slider */}
          <div className="px-8 mb-8">
            {isiOS ? (
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.04] rounded-xl">
                <Smartphone size={16} className="text-white/40" />
                <span className="text-white/40 text-sm">Use device volume buttons</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={toggleMute}>
                  <VolumeIcon volume={volume} muted={isMuted} size={20} />
                </button>
                <div
                  ref={volumeTrackRef}
                  className="relative flex-1 h-8 flex items-center cursor-pointer"
                  onMouseDown={onVolMouseDown}
                  onTouchStart={(e) => handleVolumeInteraction(e)}
                  onTouchMove={(e) => { e.preventDefault(); handleVolumeInteraction(e); }}
                >
                  <div className="absolute left-0 right-0 h-1 rounded-full bg-white/10" />
                  <div
                    className="absolute left-0 h-1 rounded-full bg-white/60"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow"
                    style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-3">
            {/* Send MP3 + Share Row */}
            <div className="flex gap-3">
              <button
                onClick={handleSendMP3}
                disabled={mp3Loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.06] hover:bg-white/10 rounded-xl text-white/70 text-sm font-medium transition disabled:opacity-50"
              >
                {mp3Loading ? <Loader2 size={16} className="animate-spin" /> : <Music size={16} />}
                {mp3Loading ? 'Preparing...' : 'Send MP3'}
              </button>
              <button
                onClick={() => shareTrack('native')}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.06] hover:bg-white/10 rounded-xl text-white/70 text-sm font-medium transition"
              >
                <Share2 size={16} />
                Share Track
              </button>
            </div>

            {/* Alarm + Sleep Row */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowAlarmModal(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.06] hover:bg-white/10 rounded-xl text-white/70 text-sm font-medium transition"
              >
                <AlarmClock size={16} />
                Alarm
              </button>
              <button
                onClick={() => setShowSleepTimer(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.06] hover:bg-white/10 rounded-xl text-white/70 text-sm font-medium transition"
              >
                <Moon size={16} />
                Sleep Timer
              </button>
            </div>

            {/* Social Share Grid */}
            {showShareMenu && (
              <div className="flex justify-center gap-4 flex-wrap py-4">
                {[
                  { key: 'tiktok', icon: '🎵' },
                  { key: 'snapchat', icon: '👻' },
                  { key: 'instagram', icon: '📸' },
                  { key: 'twitter', icon: '𝕏' },
                  { key: 'whatsapp', icon: '💬' },
                  { key: 'facebook', icon: '📘' },
                  { key: 'copy', icon: '🔗' },
                ].map(({ key, icon }) => (
                  <button
                    key={key}
                    onClick={() => shareTrack(key)}
                    className="w-12 h-12 bg-white/[0.08] hover:bg-white/15 rounded-full flex items-center justify-center text-lg transition"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AlarmClockModal isOpen={showAlarmModal} onClose={() => setShowAlarmModal(false)} />
        <SleepTimer isOpen={showSleepTimer} onClose={() => setShowSleepTimer(false)} />
      </div>
    );
  }

  // ========================================
  // MOBILE MINI PLAYER
  // ========================================
  // ========================================
  // DESKTOP PLAYER
  // ========================================
  return (
    <>
      {/* MOBILE MINI PLAYER */}
      <div
        className="md:hidden fixed bottom-14 left-0 right-0 z-[500] bg-[#0a0f1a]/98 backdrop-blur-2xl border-t border-white/[0.06]"
        onClick={() => setExpanded(true)}
      >
        {/* Progress line on top */}
        <div className="h-[2px] bg-white/[0.06]">
          <div ref={miniProgressRef} className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: '0%', transition: 'none' }} />
        </div>

        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Album art */}
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600/30 to-blue-900/50 border border-white/[0.08] shrink-0 relative">
            {albumArt ? (
              <Image src={albumArt} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-blue-400/60" /></div>
            )}
          </div>

          {/* Track info — scrolling marquee for long titles */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="font-semibold text-white text-[13px] truncate leading-tight">{currentTrack.title}</p>
            <p className="text-[11px] text-white/40 truncate">Mike Page{currentTrack.featured ? ` ft. ${currentTrack.featured}` : ''}</p>
          </div>

          {/* Heart */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(currentTrack.id); }}
            className="shrink-0 p-1"
          >
            <Heart size={18} className={isFavorite ? 'text-red-500' : 'text-white/20'} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0 active:scale-95 transition"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause size={16} className="text-black" fill="black" />
              : <Play size={16} className="text-black ml-0.5" fill="black" />
            }
          </button>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextTrack(); }}
            className="text-white/50 shrink-0 p-1 active:text-white transition"
            aria-label="Next"
          >
            <SkipForward size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* DESKTOP PLAYER */}
      <div className="hidden md:block fixed bottom-0 left-0 right-0 h-[88px] bg-[#0a0f1a]/98 backdrop-blur-2xl border-t border-white/[0.06] z-[500]">
        <div className="max-w-screen-2xl mx-auto h-full px-5 flex items-center gap-5">

          {/* Left — Track Info */}
          <div className="flex items-center gap-3.5 w-[280px] shrink-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600/30 to-blue-900/50 border border-white/[0.08] shrink-0 relative">
              {albumArt ? (
                <Image src={albumArt} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Music size={22} className="text-blue-400/60" /></div>
              )}
              {isPlaying && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-[2px]">
                  <span className="w-[2px] h-2.5 bg-blue-400 rounded-full now-playing-bar" />
                  <span className="w-[2px] h-3.5 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '150ms' }} />
                  <span className="w-[2px] h-2 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate leading-tight">{currentTrack.title}</h4>
              <p className="text-xs text-white/40 truncate mt-0.5">
                Mike Page{currentTrack.featured ? ` ft. ${currentTrack.featured}` : ''}
              </p>
              {currentTrack.producer && (
                <p className="text-[11px] text-purple-400/70 mt-0.5 truncate">Prod. {currentTrack.producer}</p>
              )}
            </div>
            <button
              onClick={() => toggleFavorite(currentTrack.id)}
              className="shrink-0 hover:scale-110 transition"
            >
              <Heart size={18} className={isFavorite ? 'text-red-500' : 'text-white/20'} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Center — Controls + Seek */}
          <div className="flex-1 max-w-[600px] mx-auto">
            {/* Playback controls */}
            <div className="flex items-center justify-center gap-5 mb-1.5">
              <button
                onClick={toggleShuffle}
                className={`hover:scale-110 transition ${shuffle ? 'text-blue-400' : 'text-white/30 hover:text-white/60'}`}
              >
                <Shuffle size={16} />
              </button>
              <button onClick={prevTrack} className="text-white/60 hover:text-white hover:scale-105 transition">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md"
              >
                {isPlaying
                  ? <Pause size={18} className="text-black" fill="black" />
                  : <Play size={18} className="text-black ml-0.5" fill="black" />
                }
              </button>
              <button onClick={nextTrack} className="text-white/60 hover:text-white hover:scale-105 transition">
                <SkipForward size={20} fill="currentColor" />
              </button>
              <button
                onClick={toggleRepeat}
                className={`hover:scale-110 transition relative ${repeat !== 'off' ? 'text-blue-400' : 'text-white/30 hover:text-white/60'}`}
              >
                {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </div>

            {/* Seek bar */}
            <SeekBar showTimes height={3} />
          </div>

          {/* Right — Volume + Actions */}
          <div className="flex items-center gap-2 w-[280px] shrink-0 justify-end">
            {/* Volume */}
            <button onClick={toggleMute} className="hover:scale-110 transition">
              <VolumeIcon volume={volume} muted={isMuted} size={18} />
            </button>
            <div
              className="relative w-24 h-6 flex items-center cursor-pointer group"
              onMouseDown={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setVolume(pct);
                const el = e.currentTarget;
                const move = (e) => {
                  const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setVolume(p);
                };
                const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
              }}
            >
              <div className="absolute left-0 right-0 h-1 rounded-full bg-white/10 group-hover:h-1.5 transition-all" />
              <div
                className="absolute left-0 h-1 rounded-full bg-white/60 group-hover:h-1.5 group-hover:bg-blue-400 transition-all"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition shadow"
                style={{ left: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Share */}
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="text-white/30 hover:text-white/60 transition p-1.5"
                title="Share"
              >
                <Share2 size={16} />
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-44 bg-[#111827] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-2 border-b border-white/[0.06]">
                    <p className="text-white/40 text-[11px] px-2 uppercase tracking-wider">Share</p>
                  </div>
                  <button onClick={handleSendMP3} disabled={mp3Loading} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] text-white/70 text-sm disabled:opacity-50">
                    {mp3Loading ? <Loader2 size={14} className="animate-spin" /> : <span>🎵</span>} {mp3Loading ? 'Preparing...' : 'Send MP3'}
                  </button>
                  <button onClick={() => shareTrack('native')} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] text-white/70 text-sm"><span>📱</span> Share...</button>
                  <button onClick={() => shareTrack('twitter')} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] text-white/70 text-sm"><span>𝕏</span> Twitter/X</button>
                  <button onClick={() => shareTrack('tiktok')} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] text-white/70 text-sm"><span>🎵</span> TikTok</button>
                  <button onClick={() => shareTrack('whatsapp')} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] text-white/70 text-sm"><span>💬</span> WhatsApp</button>
                  <button onClick={() => shareTrack('copy')} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/[0.06] text-white/70 text-sm border-t border-white/[0.06]"><span>🔗</span> Copy Link</button>
                </div>
              )}
            </div>

            {/* Alarm */}
            <button
              onClick={() => setShowAlarmModal(true)}
              className="text-white/30 hover:text-yellow-400 transition p-1.5"
              title="Alarm"
            >
              <AlarmClock size={16} />
            </button>

            {/* Sleep Timer */}
            <button
              onClick={() => setShowSleepTimer(true)}
              className="text-white/30 hover:text-indigo-400 transition p-1.5"
              title="Sleep Timer"
            >
              <Moon size={16} />
            </button>

            {/* Sleep Timer Badge */}
            <SleepTimer isOpen={false} onClose={() => setShowSleepTimer(true)} />

            {/* Voice Command */}
            <VoiceCommand />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AlarmClockModal isOpen={showAlarmModal} onClose={() => setShowAlarmModal(false)} />
      <SleepTimer isOpen={showSleepTimer} onClose={() => setShowSleepTimer(false)} />
    </>
  );
}
