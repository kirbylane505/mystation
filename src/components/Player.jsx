/**
 * MYSTATION - Premium Audio Player
 * Mobile-first responsive design
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat,
  Heart, Share2, Music, Sparkles, ChevronUp, X, Crown, AlarmClock, Moon, Loader2
} from 'lucide-react';
import AlarmClockModal from './AlarmClock';
import SleepTimer from './SleepTimer';
import VoiceCommand from './VoiceCommand';
import { shareMP3 } from '@/lib/shareAudio';
import { albums } from '@/data/tracks';
import Image from 'next/image';

// Get album cover art for a track
function getAlbumArt(track) {
  if (!track) return null;
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || null;
}

export default function Player() {
  const pathname = usePathname();
  const isSongPage = pathname?.startsWith('/song/');
  const audioRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);
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
    getTrialRemaining,
  } = usePlayerStore();

  const { isSubscribed } = useUserStore();

  // 24-hour free trial countdown
  const [trialRemaining, setTrialRemaining] = useState(24 * 60 * 60 * 1000);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update trial countdown every minute
  useEffect(() => {
    if (isSubscribed || !mounted) return;
    const update = () => setTrialRemaining(getTrialRemaining());
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [isSubscribed, mounted, getTrialRemaining]);

  const trialHours = Math.floor(trialRemaining / (1000 * 60 * 60));
  const trialMinutes = Math.floor((trialRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const trialExpired = trialRemaining <= 0;
  const showTrialBadge = mounted && !isSubscribed && !trialExpired;

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

  // Share to social media
  const shareTrack = (platform) => {
    const trackUrl = `https://mystationlive.com/song/${currentTrack.id}`;
    const text = `🎵 Listen to "${currentTrack.title}" by Mike Page on MyStation! ${currentTrack.featured ? `ft. ${currentTrack.featured}` : ''} #MikePage #MyStation #IDMG`;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(trackUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackUrl)}&quote=${encodeURIComponent(text)}`,
      tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(trackUrl)}&text=${encodeURIComponent(text)}`,
      snapchat: `https://www.snapchat.com/share?url=${encodeURIComponent(trackUrl)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't have direct share URL, opens app
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + trackUrl)}`,
      copy: trackUrl
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(trackUrl);
      alert('Link copied! Share it anywhere.');
    } else if (platform === 'native' && navigator.share) {
      navigator.share({
        title: `${currentTrack.title} - Mike Page`,
        text: text,
        url: trackUrl,
      });
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleSendMP3 = async () => {
    setMp3Loading(true);
    try {
      await shareMP3(currentTrack);
    } catch (err) {
      // User cancelled or error
    } finally {
      setMp3Loading(false);
      setShowShareMenu(false);
    }
  };

  // Song page has its own full controls — hide bottom player there
  if (isSongPage) return null;

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
          <div className="w-72 h-72 md:w-80 md:h-80 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl relative overflow-hidden">
            {getAlbumArt(currentTrack) ? (
              <Image src={getAlbumArt(currentTrack)} alt={currentTrack.album || currentTrack.title} fill className="object-cover" />
            ) : (
              <Music size={80} className="text-blue-400" />
            )}
            {isPlaying && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-3 py-1.5 rounded-full">
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
          {currentTrack.producer && (
            <p className="text-purple-400 text-sm mt-1">Prod by {currentTrack.producer}</p>
          )}
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

          {/* Volume - Easy to Use */}
          <div className="flex items-center justify-center gap-3 px-4">
            <button
              onClick={() => setVolume(Math.max(0, volume - 0.2))}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold active:bg-white/20 transition-colors"
            >
              −
            </button>

            <button
              onClick={toggleMute}
              className="flex flex-col items-center gap-1 px-4"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={28} className="text-red-400" />
              ) : (
                <Volume2 size={28} className="text-blue-400" />
              )}
              <span className="text-white font-bold text-lg">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </button>

            <button
              onClick={() => setVolume(Math.min(1, volume + 0.2))}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold active:bg-white/20 transition-colors"
            >
              +
            </button>
          </div>

          {/* Volume Bar Visual */}
          <div className="flex justify-center gap-1 mt-3 px-8">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setVolume(level * 0.2)}
                className={`h-8 flex-1 rounded-full transition-all ${
                  (isMuted ? 0 : volume) >= level * 0.2
                    ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Send MP3 Button - Mobile */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSendMP3}
              disabled={mp3Loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white font-semibold disabled:opacity-60"
            >
              {mp3Loading ? <Loader2 size={20} className="animate-spin" /> : <Music size={20} />}
              {mp3Loading ? 'Preparing audio...' : 'Send MP3'}
            </button>
          </div>

          {/* Share Link Button - Mobile */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => shareTrack('native')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white font-semibold"
            >
              <Share2 size={20} />
              Share This Track
            </button>
          </div>

          {/* Social Share Grid */}
          <div className="mt-4 flex justify-center gap-3 flex-wrap px-4">
            <button onClick={() => shareTrack('tiktok')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-white/20">🎵</button>
            <button onClick={() => shareTrack('snapchat')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-white/20">👻</button>
            <button onClick={() => shareTrack('instagram')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-white/20">📸</button>
            <button onClick={() => shareTrack('twitter')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-white/20">🐦</button>
            <button onClick={() => shareTrack('whatsapp')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-white/20">💬</button>
            <button onClick={() => shareTrack('copy')} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl hover:bg-white/20">🔗</button>
          </div>

          {/* Wake Up & Sleep Buttons */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={() => setShowAlarmModal(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 hover:bg-yellow-500/30 transition-colors"
            >
              <AlarmClock size={20} />
              <span className="font-medium">Wake Up to This Song</span>
            </button>
            <button
              onClick={() => setShowSleepTimer(true)}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-full text-indigo-400 hover:bg-indigo-500/30 transition-colors"
            >
              <Moon size={20} />
              <span className="font-medium">Sleep Timer</span>
            </button>
          </div>
        </div>

        {/* Alarm Modal */}
        <AlarmClockModal isOpen={showAlarmModal} onClose={() => setShowAlarmModal(false)} />
        {/* Sleep Timer Modal */}
        <SleepTimer isOpen={showSleepTimer} onClose={() => setShowSleepTimer(false)} />
      </div>
    );
  }

  // MOBILE MINI PLAYER (shows on small screens)
  return (
    <>
      {/* Mobile Subscribe Banner */}
      {mounted && !isSubscribed && trialExpired && (
        <a
          href="https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04"
          className="md:hidden fixed bottom-[72px] left-0 right-0 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-xl z-40"
        >
          <div className="w-full flex items-center justify-center gap-2 py-2 text-white font-semibold text-sm">
            <Crown size={16} />
            Join the MyStation Family — $4.99/mo
          </div>
        </a>
      )}

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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-lg flex items-center justify-center border border-white/10 shrink-0 relative overflow-hidden">
            {getAlbumArt(currentTrack) ? (
              <Image src={getAlbumArt(currentTrack)} alt={currentTrack.album || ''} fill className="object-cover" />
            ) : (
              <Music size={18} className="text-blue-400" />
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm">{currentTrack.title}</h4>
            <p className="text-xs text-white/50">Mike Page</p>
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
        {showTrialBadge && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-300" />
            <span className="text-white text-sm font-medium">Free trial: {trialHours}h {trialMinutes}m left</span>
            <a href="https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04" className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs text-white font-semibold transition">Subscribe</a>
          </div>
        )}

        <div className="max-w-screen-2xl mx-auto h-full px-6 flex items-center justify-between gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-80">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600/30 to-blue-900/50 rounded-xl flex items-center justify-center border border-white/10 relative overflow-hidden">
              {getAlbumArt(currentTrack) ? (
                <Image src={getAlbumArt(currentTrack)} alt={currentTrack.album || ''} fill className="object-cover" />
              ) : (
                <Music size={24} className="text-blue-400" />
              )}
              {isPlaying && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-base">{currentTrack.title}</h4>
              <p className="text-sm text-white/50">Mike Page {currentTrack.featured && `ft. ${currentTrack.featured}`}</p>
              {currentTrack.producer && (
                <p className="text-xs text-purple-400 mt-0.5">Prod by {currentTrack.producer}</p>
              )}
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
          <div className="flex items-center gap-3 w-80 justify-end relative">
            {/* Volume Down */}
            <button
              onClick={() => setVolume(Math.max(0, volume - 0.1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors"
            >
              −
            </button>

            {/* Mute Button with Level */}
            <button onClick={toggleMute} className="flex items-center gap-2 text-white/60 hover:text-white transition">
              {isMuted || volume === 0 ? <VolumeX size={20} className="text-red-400" /> : <Volume2 size={20} className="text-blue-400" />}
              <span className="text-xs font-bold w-8">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
            </button>

            {/* Volume Up */}
            <button
              onClick={() => setVolume(Math.min(1, volume + 0.1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold transition-colors"
            >
              +
            </button>

            {/* Visual Volume Bars */}
            <div className="flex items-end gap-0.5 h-5">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setVolume(level * 0.2)}
                  className={`w-2 rounded-sm transition-all hover:opacity-80 ${
                    (isMuted ? 0 : volume) >= level * 0.2
                      ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
                      : 'bg-white/20'
                  }`}
                  style={{ height: `${level * 4}px` }}
                />
              ))}
            </div>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="text-white/40 hover:text-white transition ml-2"
              title="Share"
            >
              <Share2 size={18} />
            </button>
            <button
              onClick={() => setShowAlarmModal(true)}
              className="text-white/40 hover:text-yellow-400 transition"
              title="Set Alarm"
            >
              <AlarmClock size={18} />
            </button>
            <button
              onClick={() => setShowSleepTimer(true)}
              className="text-white/40 hover:text-indigo-400 transition"
              title="Sleep Timer"
            >
              <Moon size={18} />
            </button>

            {/* Sleep Timer Badge (shows countdown when active) */}
            <SleepTimer isOpen={false} onClose={() => setShowSleepTimer(true)} />

            {/* Voice Command */}
            <VoiceCommand />

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-mystation-navy border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-white/10">
                  <p className="text-white/60 text-xs px-2">Share this track</p>
                </div>
                <button onClick={handleSendMP3} disabled={mp3Loading} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-500/20 text-white text-sm border-b border-white/10 disabled:opacity-60">
                  {mp3Loading ? <Loader2 size={16} className="animate-spin text-orange-400" /> : <span>🎵</span>} {mp3Loading ? 'Preparing...' : 'Send MP3'}
                </button>
                <button onClick={() => shareTrack('native')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>📱</span> Share...
                </button>
                <button onClick={() => shareTrack('tiktok')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>🎵</span> TikTok
                </button>
                <button onClick={() => shareTrack('snapchat')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>👻</span> Snapchat
                </button>
                <button onClick={() => shareTrack('instagram')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>📸</span> Instagram
                </button>
                <button onClick={() => shareTrack('twitter')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>🐦</span> Twitter/X
                </button>
                <button onClick={() => shareTrack('facebook')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>📘</span> Facebook
                </button>
                <button onClick={() => shareTrack('whatsapp')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm">
                  <span>💬</span> WhatsApp
                </button>
                <button onClick={() => shareTrack('copy')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm border-t border-white/10">
                  <span>🔗</span> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alarm Clock Modal */}
      <AlarmClockModal isOpen={showAlarmModal} onClose={() => setShowAlarmModal(false)} />
      {/* Sleep Timer Modal */}
      <SleepTimer isOpen={showSleepTimer} onClose={() => setShowSleepTimer(false)} />
    </>
  );
}
