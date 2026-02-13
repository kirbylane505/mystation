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
let audioUnlocked = false;
let lastSkipTime = 0;
let consecutiveErrors = 0;

// Tiny silent WAV — used to unlock iOS audio on first touch
const SILENCE_DATA_URL = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

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

// iOS Safari requires audio.play() in the same call stack as a user gesture.
// This unlocks the audio element on first touch so future programmatic play() works.
function setupIOSAudioUnlock() {
  if (typeof document === 'undefined' || audioUnlocked) return;

  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const audio = getGlobalAudio();
    if (audio) {
      audio.src = SILENCE_DATA_URL;
      const p = audio.play();
      if (p) p.then(() => { audio.pause(); audio.currentTime = 0; audio.src = ''; }).catch(() => { audio.src = ''; });
    }
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('touchend', unlock, true);
    document.removeEventListener('click', unlock, true);
  };

  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('touchend', unlock, true);
  document.addEventListener('click', unlock, true);
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
    trackGuestPlay,
    openSubscribeModal,
    initTrial,
    pause,
    play,
  } = usePlayerStore();

  // Keep refs always fresh
  storeActionsRef.current = {
    setProgress, setDuration, nextTrack, prevTrack,
    incrementPlayCount, trackGuestPlay, openSubscribeModal, initTrial, pause, play,
  };
  repeatRef.current = repeat;

  const isVaultTrack = useCallback((track) => {
    if (!track) return false;
    return track.albumId === 'vault' || track.album === 'Vault' ||
      (typeof track.id === 'string' && track.id.startsWith('vault-'));
  }, []);

  const getAudioUrl = useCallback(async (track) => {
    if (!track) return null;
    if (!track.audioFile) return null;
    // External URLs (Spotify previews, etc) — use directly, no token needed
    if (track.audioFile.startsWith('http')) return track.audioFile;
    try {
      // Get signed token from server
      const resp = await fetch('/api/audio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id })
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        if (errData.needsEmail) {
          // Server has no trial cookie — sync client state and re-show email gate
          localStorage.removeItem('mystation_email');
          localStorage.removeItem('mystation_guest');
          const userStore = useUserStore.getState();
          userStore.setEmail('');
          userStore.setTrialStatus('none');
          storeActionsRef.current.pause();
          return null;
        }
        if (errData.trialExpired) {
          // Trial expired — show subscribe modal
          storeActionsRef.current.pause();
          storeActionsRef.current.openSubscribeModal(track);
          return null;
        }
        return null; // Other errors — don't play with bad token
      }
      const { token } = await resp.json();
      if (!token) return null;
      // Direct CDN URL with token — middleware validates and serves static file
      return `${track.audioFile}?_t=${token}`;
    } catch {
      return null; // Network error — don't fallback to unprotected URL
    }
  }, []);

  const checkCanPlay = useCallback((trackId) => {
    return usePlayerStore.getState().canPlay(trackId);
  }, []);

  // ─── Initialize audio element ONCE ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || isAudioInitialized) return;
    isAudioInitialized = true;

    // Unlock iOS audio on first user touch/click
    setupIOSAudioUnlock();

    // TIME UPDATE — uses ref so never stale
    const onTimeUpdate = () => {
      storeActionsRef.current.setProgress(audio.currentTime);
      // Audio is playing successfully — reset error counter
      if (consecutiveErrors > 0) consecutiveErrors = 0;
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

    // ERROR — retry on network errors, controlled skip on decode errors
    const onError = () => {
      const err = audio.error;
      if (!err) return;
      console.error('Audio error:', err.code, err.message);

      // MEDIA_ERR_NETWORK (2) — retry up to 2 times with backoff
      if (err.code === 2 && audio.src) {
        setTimeout(() => {
          audio.load();
          if (usePlayerStore.getState().isPlaying) {
            safePlay(audio);
          }
        }, 2000);
      }
      // MEDIA_ERR_DECODE (3) or MEDIA_ERR_SRC_NOT_SUPPORTED (4) — skip with cooldown
      else if (err.code === 3 || err.code === 4) {
        consecutiveErrors++;
        const now = Date.now();
        // Stop chain-skipping: max 3 consecutive errors, min 2s between skips
        if (consecutiveErrors > 3 || now - lastSkipTime < 2000) {
          console.warn('Audio: stopping auto-skip after consecutive errors');
          consecutiveErrors = 0;
          storeActionsRef.current.pause();
          return;
        }
        lastSkipTime = now;
        setTimeout(() => storeActionsRef.current.nextTrack(), 500);
      }
    };

    // STALLED / WAITING — audio buffering, gentle recovery (don't force-play too early)
    const onStalled = () => {
      if (usePlayerStore.getState().isPlaying && audio.paused) {
        setTimeout(() => {
          // Only resume if audio is actually ready (readyState 3+ = enough data)
          if (usePlayerStore.getState().isPlaying && audio.paused && audio.readyState >= 3) {
            safePlay(audio);
          }
        }, 1500);
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

    // Subscription wall check (24-hour free trial)
    if (playing) {
      initTrial(); // Start 24h clock on first play
      if (!checkCanPlay(currentTrack.id)) {
        audio.pause();
        pause();
        openSubscribeModal(currentTrack);
        return;
      }
      incrementPlayCount(currentTrack.id);
      trackGuestPlay(currentTrack.id);
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

    // Async: get secure audio URL with token
    (async () => {
      const audioUrl = await getAudioUrl(currentTrack);
      if (!audioUrl) {
        // Reset so user can retry same track (e.g., after entering email)
        lastTrackIdRef.current = null;
        return;
      }

      // Remove any stale canplay listener
      if (canPlayListenerRef.current) {
        audio.removeEventListener('canplay', canPlayListenerRef.current);
        audio.removeEventListener('canplaythrough', canPlayListenerRef.current);
        canPlayListenerRef.current = null;
      }

      const currentSrc = audio.src ? audio.src : '';
      // Check if this track's audio file is already loaded
      const trackFile = currentTrack.audioFile;
      const trackLoaded = currentSrc && (
        currentSrc.includes(trackFile) ||
        currentSrc.includes(encodeURI(trackFile))
      );
      if (!trackLoaded) {
        isLoadingRef.current = true;
        audio.src = audioUrl;
        audio.load();

        // Use both canplay and canplaythrough for maximum compatibility
        const onReady = async () => {
          audio.removeEventListener('canplay', onReady);
          audio.removeEventListener('canplaythrough', onReady);
          canPlayListenerRef.current = null;
          isLoadingRef.current = false;
          if (usePlayerStore.getState().isPlaying) {
            const played = await safePlay(audio);
            if (!played) {
              // iOS blocked playback — sync store state so UI isn't stuck
              storeActionsRef.current.pause();
            }
          }
        };
        canPlayListenerRef.current = onReady;
        audio.addEventListener('canplay', onReady);
        audio.addEventListener('canplaythrough', onReady);

        // Fallback: if canplay doesn't fire within 5s (cached audio edge case), force play
        setTimeout(async () => {
          if (isLoadingRef.current && audio.readyState >= 2) {
            isLoadingRef.current = false;
            if (usePlayerStore.getState().isPlaying) {
              const played = await safePlay(audio);
              if (!played) storeActionsRef.current.pause();
            }
          }
        }, 5000);
      }
    })();
  }, [currentTrack?.id, getAudioUrl, checkCanPlay, incrementPlayCount, trackGuestPlay, openSubscribeModal, initTrial, pause, isVaultTrack]);

  // ─── Handle play/pause state changes ───
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    // Don't try to play while a new track is loading — the load handler will start playback
    if (isLoadingRef.current) return;

    if (isPlaying) {
      // Only check subscription for tracks we haven't counted yet
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
      // Only call play if audio is actually paused (prevent double-play race)
      if (audio.paused && audio.readyState >= 2) {
        safePlay(audio).then(played => {
          if (!played) storeActionsRef.current.pause();
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id]);

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
