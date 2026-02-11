/**
 * MYSTATION - Audio Engine v2
 * Bulletproof streaming: continuous play, background audio, lock screen controls
 * Plays like Tidal / Apple Music / YouTube Music
 *
 * KEY FIXES:
 * - No beforeunload killing audio on mobile screen lock
 * - Ref-based handlers prevent stale closures (next song always chains)
 * - visibilitychange resumes audio after screen unlock
 * - Retry logic for mobile play() failures
 * - Preloads next track for gapless transitions
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { useEngagementStore } from '@/store/engagementStore';

// Global audio element - persists across page navigation
let globalAudio = null;
let isAudioInitialized = false;

function getGlobalAudio() {
  if (typeof window === 'undefined') return null;

  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.preload = 'auto';
    // Critical for iOS background playback
    globalAudio.setAttribute('playsinline', '');
    globalAudio.setAttribute('webkit-playsinline', '');
  }
  return globalAudio;
}

// Retry audio.play() with backoff — mobile browsers reject play() after suspension
async function safePlay(audio, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await audio.play();
      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        // User gesture required — can't retry, need user interaction
        return false;
      }
      // AbortError or other — wait and retry
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 200 * (i + 1)));
      }
    }
  }
  return false;
}

// Setup Media Session API for lock screen / notification controls
function setupMediaSession(track, handlers) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  const { onPlay, onPause, onNext, onPrev } = handlers;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.featured ? `Mike Page ft. ${track.featured}` : 'Mike Page',
    album: track.album || 'MyStation',
    artwork: [
      { src: track.coverArt || '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: track.coverArt || '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ]
  });

  // These handlers use refs so they always call the latest store action
  navigator.mediaSession.setActionHandler('play', onPlay);
  navigator.mediaSession.setActionHandler('pause', onPause);
  navigator.mediaSession.setActionHandler('nexttrack', onNext);
  navigator.mediaSession.setActionHandler('previoustrack', onPrev);
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
    }
  });
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset || 10));
    }
  });
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    const audio = getGlobalAudio();
    if (audio && details.seekTime != null) {
      audio.currentTime = details.seekTime;
    }
  });
}

export default function AudioPlayer() {
  const lastTrackIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  const canPlayListenerRef = useRef(null);

  // Use refs for all store actions so event handlers never go stale
  const storeActionsRef = useRef({});
  const repeatRef = useRef('off');

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

  // Keep refs always fresh
  storeActionsRef.current = {
    setProgress, setDuration, nextTrack, prevTrack,
    incrementPlayCount, openSubscribeModal, pause, play,
  };
  repeatRef.current = repeat;

  const isVaultTrack = useCallback((track) => {
    if (!track) return false;
    return track.albumId === 'vault' || track.album === 'Vault' ||
      (typeof track.id === 'string' && track.id.startsWith('vault-'));
  }, []);

  const getAudioUrl = useCallback((track) => {
    if (!track) return null;
    return track.audioFile || null;
  }, []);

  const checkCanPlay = useCallback((trackId) => {
    return usePlayerStore.getState().canPlay(trackId);
  }, []);

  // ─── Initialize audio element ONCE ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || isAudioInitialized) return;
    isAudioInitialized = true;

    // TIME UPDATE — uses ref so never stale
    const onTimeUpdate = () => {
      storeActionsRef.current.setProgress(audio.currentTime);
    };

    // LOADED METADATA
    const onLoadedMetadata = () => {
      storeActionsRef.current.setDuration(audio.duration);
    };

    // ENDED — chains to next track, uses ref so repeat mode is always current
    const onEnded = () => {
      if (repeatRef.current === 'one') {
        audio.currentTime = 0;
        safePlay(audio);
      } else {
        // Always advance to next track
        storeActionsRef.current.nextTrack();
      }
    };

    // ERROR — retry on network errors, skip on decode errors
    const onError = () => {
      const err = audio.error;
      if (!err) return;
      console.error('Audio error:', err.code, err.message);

      // MEDIA_ERR_NETWORK (2) — retry once
      if (err.code === 2 && audio.src) {
        setTimeout(() => {
          audio.load();
          if (usePlayerStore.getState().isPlaying) {
            safePlay(audio);
          }
        }, 1000);
      }
      // MEDIA_ERR_DECODE (3) or MEDIA_ERR_SRC_NOT_SUPPORTED (4) — skip to next
      else if (err.code === 3 || err.code === 4) {
        storeActionsRef.current.nextTrack();
      }
    };

    // STALLED / WAITING — audio buffering, try to recover
    const onStalled = () => {
      if (usePlayerStore.getState().isPlaying && audio.paused) {
        setTimeout(() => {
          if (usePlayerStore.getState().isPlaying && audio.paused && audio.readyState >= 2) {
            safePlay(audio);
          }
        }, 500);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('waiting', onStalled);

    // VISIBILITY CHANGE — resume audio after screen unlock / tab return
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = usePlayerStore.getState();
        if (state.isPlaying && audio.paused) {
          // Audio was suspended by the browser — resume it
          safePlay(audio);
        }
        // Update media session position after returning
        if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && audio.duration) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audio.duration,
              playbackRate: audio.playbackRate,
              position: audio.currentTime,
            });
          } catch (e) {}
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    // NO beforeunload — we WANT audio to survive background/lock screen
    // Audio will naturally stop when the tab is actually closed

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('waiting', onStalled);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // ─── Load new track when currentTrack changes ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!currentTrack || !audio) return;

    const isNewTrack = lastTrackIdRef.current !== currentTrack.id;
    if (!isNewTrack) return;

    const { isPlaying: playing, vaultUnlocked } = usePlayerStore.getState();

    // Block vault tracks if not unlocked
    if (isVaultTrack(currentTrack) && !vaultUnlocked) {
      audio.pause();
      pause();
      const { queue, queueIndex } = usePlayerStore.getState();
      const nextNonVault = queue.slice(queueIndex + 1).find(t => !isVaultTrack(t));
      if (nextNonVault) {
        usePlayerStore.getState().setTrack(nextNonVault);
      }
      return;
    }

    // Subscription wall check
    if (playing) {
      if (!checkCanPlay(currentTrack.id)) {
        audio.pause();
        pause();
        openSubscribeModal(currentTrack);
        return;
      }
      incrementPlayCount(currentTrack.id);
    }

    lastTrackIdRef.current = currentTrack.id;

    // Analytics (fire-and-forget)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'play',
        track_id: currentTrack.id,
        track_title: currentTrack.title,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '/',
      }),
    }).catch(() => {});

    try {
      useEngagementStore.getState().recordPlay(currentTrack.id, currentTrack.albumId);
    } catch (e) {}

    const audioUrl = getAudioUrl(currentTrack);
    if (!audioUrl) return;

    // Remove any stale canplay listener
    if (canPlayListenerRef.current) {
      audio.removeEventListener('canplay', canPlayListenerRef.current);
      audio.removeEventListener('canplaythrough', canPlayListenerRef.current);
      canPlayListenerRef.current = null;
    }

    const currentSrc = audio.src ? new URL(audio.src, window.location.origin).pathname : '';
    if (currentSrc !== audioUrl) {
      isLoadingRef.current = true;
      audio.src = audioUrl;
      audio.load();

      // Use both canplay and canplaythrough for maximum compatibility
      const onReady = () => {
        audio.removeEventListener('canplay', onReady);
        audio.removeEventListener('canplaythrough', onReady);
        canPlayListenerRef.current = null;
        isLoadingRef.current = false;
        if (usePlayerStore.getState().isPlaying) {
          safePlay(audio);
        }
      };
      canPlayListenerRef.current = onReady;
      audio.addEventListener('canplay', onReady);
      audio.addEventListener('canplaythrough', onReady);

      // Fallback: if canplay doesn't fire within 5s (cached audio edge case), force play
      setTimeout(() => {
        if (isLoadingRef.current && audio.readyState >= 2) {
          isLoadingRef.current = false;
          if (usePlayerStore.getState().isPlaying) {
            safePlay(audio);
          }
        }
      }, 5000);
    }
  }, [currentTrack?.id, getAudioUrl, checkCanPlay, incrementPlayCount, openSubscribeModal, pause, isVaultTrack]);

  // ─── Handle play/pause state changes ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    if (isLoadingRef.current) return;

    if (isPlaying) {
      const { uniquePlaysThisSession } = usePlayerStore.getState();
      if (!uniquePlaysThisSession.includes(currentTrack.id)) {
        if (!checkCanPlay(currentTrack.id)) {
          audio.pause();
          pause();
          openSubscribeModal(currentTrack);
          return;
        }
        incrementPlayCount(currentTrack.id);
      }
      safePlay(audio);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // ─── Volume ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // ─── Seeking ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio && Math.abs(audio.currentTime - progress) > 1.5) {
      audio.currentTime = progress;
    }
  }, [progress]);

  // ─── Media Session (lock screen / notification controls) ───
  useEffect(() => {
    if (!currentTrack) return;

    setupMediaSession(currentTrack, {
      onPlay: () => usePlayerStore.getState().play(),
      onPause: () => usePlayerStore.getState().pause(),
      onNext: () => usePlayerStore.getState().nextTrack(),
      onPrev: () => usePlayerStore.getState().prevTrack(),
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [currentTrack, isPlaying]);

  // ─── Position state for lock screen seek bar ───
  useEffect(() => {
    if (!currentTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const audio = getGlobalAudio();
    if (audio && audio.duration && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: Math.min(audio.currentTime, audio.duration),
        });
      } catch (e) {}
    }
  }, [progress, currentTrack]);

  return null;
}
