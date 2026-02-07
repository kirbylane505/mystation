/**
 * MYSTATION - Audio Engine
 * Handles actual audio playback with HTML5 Audio
 * PERSISTS across page navigation - audio keeps playing!
 * BACKGROUND PLAYBACK - music continues when browsing other apps/sites
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { useEngagementStore } from '@/store/engagementStore';

// Global audio element - persists across page navigation
let globalAudio = null;
let isAudioInitialized = false;
let mediaSessionInitialized = false;

function getGlobalAudio() {
  if (typeof window === 'undefined') return null;

  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'metadata';
  }
  return globalAudio;
}

// Setup Media Session API for background playback controls
function setupMediaSession(track, handlers) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  const { play, pause, nextTrack, previousTrack } = handlers;

  // Set metadata for lock screen / notification
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.featured ? `Mike Page ft. ${track.featured}` : 'Mike Page',
    album: track.album || 'MyStation',
    artwork: [
      { src: track.coverArt || '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: track.coverArt || '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ]
  });

  // Set up action handlers for system controls
  navigator.mediaSession.setActionHandler('play', play);
  navigator.mediaSession.setActionHandler('pause', pause);
  navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
  navigator.mediaSession.setActionHandler('previoustrack', previousTrack);
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
    }
  });
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + (details.seekOffset || 10));
    }
  });

  mediaSessionInitialized = true;
}

export default function AudioPlayer() {
  const lastTrackIdRef = useRef(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    progress,
    setProgress,
    setDuration,
    nextTrack,
    prevTrack,
    repeat,
    incrementPlayCount,
    openSubscribeModal,
    pause,
    play,
  } = usePlayerStore();

  const { isSubscribed } = useUserStore();

  // Get audio URL directly from track
  const getAudioUrl = useCallback((track) => {
    if (!track) return null;
    return track.audioFile || null;
  }, []);

  // 4 free songs, then subscription wall
  const checkCanPlay = useCallback((trackId) => {
    return usePlayerStore.getState().canPlay(trackId);
  }, []);

  // Event handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = getGlobalAudio();
    if (audio) {
      setProgress(audio.currentTime);
    }
  }, [setProgress]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = getGlobalAudio();
    if (audio) {
      setDuration(audio.duration);
    }
  }, [setDuration]);

  const handleEnded = useCallback(() => {
    const audio = getGlobalAudio();
    if (repeat === 'one' && audio) {
      audio.currentTime = 0;
      audio.play();
    } else {
      nextTrack();
    }
  }, [repeat, nextTrack]);

  const handleError = useCallback((e) => {
    console.error('Audio error:', e);
  }, []);

  // Initialize audio element ONCE
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || isAudioInitialized) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    isAudioInitialized = true;

    // Stop music when app/tab is closed
    const handleBeforeUnload = () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded, handleError]);

  // Update listeners when handlers change
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio) return;

    // Update ended handler for repeat mode changes
    audio.removeEventListener('ended', handleEnded);
    audio.addEventListener('ended', handleEnded);
  }, [handleEnded]);

  // Track loading flag to prevent race conditions
  const isLoadingRef = useRef(false);

  // Load new track when currentTrack changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!currentTrack || !audio) return;

    const isNewTrack = lastTrackIdRef.current !== currentTrack.id;

    if (isNewTrack) {
      if (!checkCanPlay(currentTrack.id)) {
        pause();
        openSubscribeModal(currentTrack);
        return;
      }

      incrementPlayCount(currentTrack.id);
      lastTrackIdRef.current = currentTrack.id;

      try {
        useEngagementStore.getState().recordPlay(currentTrack.id, currentTrack.albumId);
      } catch (e) {
        // Engagement store might not be loaded
      }

      const audioUrl = getAudioUrl(currentTrack);
      if (audioUrl) {
        // Compare properly - audio.src is absolute, audioUrl is relative
        const currentSrc = audio.src ? new URL(audio.src, window.location.origin).pathname : '';
        if (currentSrc !== audioUrl) {
          isLoadingRef.current = true;
          audio.src = audioUrl;
          audio.load();

          // Wait for canplay before attempting playback
          const onCanPlay = () => {
            audio.removeEventListener('canplay', onCanPlay);
            isLoadingRef.current = false;
            if (usePlayerStore.getState().isPlaying) {
              audio.play().catch(() => {});
            }
          };
          audio.addEventListener('canplay', onCanPlay);
        }
      }
    }
  }, [currentTrack?.id, getAudioUrl, checkCanPlay, incrementPlayCount, openSubscribeModal, pause]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    // Skip if we're loading a new track - the canplay handler will start playback
    if (isLoadingRef.current) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle seeking
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio && Math.abs(audio.currentTime - progress) > 1) {
      audio.currentTime = progress;
    }
  }, [progress]);

  // Setup Media Session for background playback (lock screen, other apps)
  useEffect(() => {
    if (!currentTrack) return;

    setupMediaSession(currentTrack, {
      play,
      pause,
      nextTrack,
      previousTrack: prevTrack,
    });

    // Update playback state for system UI
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [currentTrack, isPlaying, play, pause, nextTrack, prevTrack]);

  // Update position state for seek bar on lock screen
  useEffect(() => {
    if (!currentTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const audio = getGlobalAudio();
    if (audio && audio.duration && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch (e) {
        // Some browsers don't support this
      }
    }
  }, [progress, currentTrack]);

  return null;
}
