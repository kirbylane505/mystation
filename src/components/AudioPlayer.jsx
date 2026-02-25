/**
 * MYSTATION - Audio Engine v4
 * Bulletproof streaming: continuous play, background audio, lock screen controls
 * No timer lockout — all non-vault tracks are free to stream
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { useEngagementStore } from '@/store/engagementStore';
import { progressBridge } from '@/lib/progressBridge';

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
    globalAudio.setAttribute('playsinline', '');
    globalAudio.setAttribute('webkit-playsinline', '');
    if (typeof window !== 'undefined') window.__mystation_audio = globalAudio;
  }
  return globalAudio;
}

function setupIOSAudioUnlock() {
  if (typeof document === 'undefined' || audioUnlocked) return;

  const unlock = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    const audio = getGlobalAudio();
    if (audio) {
      // If a real track is already loaded, play IT instead of the silence WAV.
      // The user gesture still unlocks the iOS audio context.
      // This prevents the silence WAV from overwriting audio.src and
      // triggering onEnded → nextTrack (off-by-one track bug).
      if (audio.src && !audio.src.startsWith('data:') && audio.src !== window.location.href) {
        audio.play().catch(() => {});
      } else {
        audio.src = SILENCE_DATA_URL;
        const p = audio.play();
        if (p) p.then(() => { audio.pause(); audio.currentTime = 0; audio.src = ''; }).catch(() => { audio.src = ''; });
      }
    }
    document.removeEventListener('touchstart', unlock, true);
    document.removeEventListener('touchend', unlock, true);
    document.removeEventListener('click', unlock, true);
  };

  document.addEventListener('touchstart', unlock, true);
  document.addEventListener('touchend', unlock, true);
  document.addEventListener('click', unlock, true);
}

async function safePlay(audio, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await audio.play();
      return true;
    } catch (err) {
      if (err.name === 'NotAllowedError') return false;
      // AbortError means another play() call interrupted this one — not a real failure
      if (err.name === 'AbortError') return true;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 200 * (i + 1)));
      }
    }
  }
  return false;
}

function setupMediaSession(track, handlers) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  const { onPlay, onPause, onNext, onPrev } = handlers;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.featured ? `Mike Page ft. ${track.featured}` : 'Mike Page',
    album: track.album || 'MyStation',
    artwork: [
      { src: track.albumArt || track.coverArt || '/images/idmg-logo-white.png', sizes: '512x512', type: 'image/jpeg' },
    ]
  });

  navigator.mediaSession.setActionHandler('play', onPlay);
  navigator.mediaSession.setActionHandler('pause', onPause);
  navigator.mediaSession.setActionHandler('nexttrack', onNext);
  navigator.mediaSession.setActionHandler('previoustrack', onPrev);
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    const audio = getGlobalAudio();
    if (audio) audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    const audio = getGlobalAudio();
    if (audio) audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset || 10));
  });
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    const audio = getGlobalAudio();
    if (audio && details.seekTime != null) audio.currentTime = details.seekTime;
  });
}

export default function AudioPlayer() {
  const lastTrackIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  const canPlayListenerRef = useRef(null);
  const loadTimeoutRef = useRef(null);

  const storeActionsRef = useRef({});
  const repeatRef = useRef('off');

  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const volume = usePlayerStore(s => s.volume);
  const isMuted = usePlayerStore(s => s.isMuted);
  const repeat = usePlayerStore(s => s.repeat);
  const pause = usePlayerStore(s => s.pause);
  const play = usePlayerStore(s => s.play);
  const incrementPlayCount = usePlayerStore(s => s.incrementPlayCount);

  storeActionsRef.current = {
    nextTrack: usePlayerStore.getState().nextTrack,
    prevTrack: usePlayerStore.getState().prevTrack,
    incrementPlayCount,
    openSubscribeModal: usePlayerStore.getState().openSubscribeModal,
    pause,
    play,
    setDuration: usePlayerStore.getState().setDuration,
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
    if (track.audioFile.startsWith('http')) return track.audioFile;
    try {
      const resp = await fetch('/api/audio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.id })
      });
      if (!resp.ok) {
        return null;
      }
      const { token } = await resp.json();
      if (!token) return null;
      return `/api/audio/stream?path=${encodeURIComponent(track.audioFile)}&_t=${token}`;
    } catch {
      return null;
    }
  }, []);

  // Initialize audio element ONCE
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || isAudioInitialized) return;
    isAudioInitialized = true;

    setupIOSAudioUnlock();

    const onTimeUpdate = () => {
      progressBridge.set(audio.currentTime, audio.duration || 0);
      if (consecutiveErrors > 0) consecutiveErrors = 0;
    };

    const onLoadedMetadata = () => {
      storeActionsRef.current.setDuration(audio.duration);
      progressBridge.set(audio.currentTime, audio.duration);
    };

    const onEnded = () => {
      // Don't auto-advance during track loading — prevents iOS audio unlock
      // silence WAV from triggering nextTrack() when its ended event races
      // with the real track load (off-by-one bug)
      if (isLoadingRef.current) return;

      // Ignore silence WAV endings — iOS audio unlock artifact
      // The silence WAV is a data: URL; real tracks are streaming URLs
      if (!audio.src || audio.src.startsWith('data:') || audio.duration < 0.5) return;

      if (repeatRef.current === 'one') {
        audio.currentTime = 0;
        safePlay(audio);
      } else {
        // Guard: only auto-advance if the ended track is still the current track
        // Prevents race where user clicks a new track but onEnded fires before
        // AudioPlayer effect can pause the old audio
        const storeTrackId = usePlayerStore.getState().currentTrack?.id;
        if (storeTrackId === lastTrackIdRef.current) {
          storeActionsRef.current.nextTrack();
        }
      }
    };

    const onError = () => {
      const err = audio.error;
      if (!err) return;
      if (err.code === 2 && audio.src) {
        setTimeout(() => {
          audio.load();
          if (usePlayerStore.getState().isPlaying) safePlay(audio);
        }, 2000);
      } else if (err.code === 3 || err.code === 4) {
        consecutiveErrors++;
        const now = Date.now();
        if (consecutiveErrors > 3 || now - lastSkipTime < 2000) {
          consecutiveErrors = 0;
          storeActionsRef.current.pause();
          return;
        }
        lastSkipTime = now;
        setTimeout(() => storeActionsRef.current.nextTrack(), 500);
      }
    };

    const onStalled = () => {
      if (usePlayerStore.getState().isPlaying && audio.paused) {
        setTimeout(() => {
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

    // Background audio persistence — auto-resume if system pauses audio
    // Only tries once per pause event. If resume fails, syncs store to paused
    // so the UI doesn't show "playing" with no audio (ghost state).
    const onAudioPause = () => {
      setTimeout(() => {
        const state = usePlayerStore.getState();
        if (state.isPlaying && audio.paused && audio.readyState >= 2 && !isLoadingRef.current) {
          safePlay(audio).then(played => {
            // If resume failed and user isn't looking at the page, don't force pause yet —
            // onVisibilityChange will try again when they return.
            // If they ARE looking, sync the store so UI shows paused.
            if (!played && document.visibilityState === 'visible') {
              storeActionsRef.current.pause();
            }
          });
        }
      }, 300);
    };
    audio.addEventListener('pause', onAudioPause);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = usePlayerStore.getState();
        if (state.isPlaying && audio.paused) {
          safePlay(audio).then(played => {
            // User is looking — if we can't resume, sync store so play button shows paused
            if (!played) storeActionsRef.current.pause();
          });
        }
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

    // Web Lock API — keeps page alive during background audio playback
    // Prevents browser from suspending the tab while music is playing
    let wakeLockRef = null;
    const acquireWakeLock = async () => {
      if ('locks' in navigator && usePlayerStore.getState().isPlaying) {
        try {
          navigator.locks.request('mystation-audio-lock', { mode: 'shared' }, () => {
            return new Promise((resolve) => { wakeLockRef = resolve; });
          });
        } catch {}
      }
    };
    const releaseWakeLock = () => {
      if (wakeLockRef) { wakeLockRef(); wakeLockRef = null; }
    };
    acquireWakeLock();
    // Re-acquire on play, release on pause
    const lockSub = usePlayerStore.subscribe((state, prev) => {
      if (state.isPlaying && !prev?.isPlaying) acquireWakeLock();
      if (!state.isPlaying && prev?.isPlaying) releaseWakeLock();
    });

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('waiting', onStalled);
      audio.removeEventListener('pause', onAudioPause);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      releaseWakeLock();
      lockSub();
    };
  }, []);

  // Load new track when currentTrack changes
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

    if (playing) {
      incrementPlayCount(currentTrack.id);
    }

    lastTrackIdRef.current = currentTrack.id;

    // Set loading flag SYNCHRONOUSLY so play/pause effect skips this render cycle
    isLoadingRef.current = true;

    // PAUSE immediately — stop old track from playing during async token fetch
    audio.pause();

    // Remove stale canplay listeners synchronously before async work
    if (canPlayListenerRef.current) {
      audio.removeEventListener('canplay', canPlayListenerRef.current);
      audio.removeEventListener('canplaythrough', canPlayListenerRef.current);
      canPlayListenerRef.current = null;
    }

    // Clear stale fallback timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

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

    // Track generation counter to discard stale async results
    const trackGeneration = currentTrack.id;

    // Async: get secure audio URL with token
    (async () => {
      const audioUrl = await getAudioUrl(currentTrack);
      if (!audioUrl) {
        lastTrackIdRef.current = null;
        isLoadingRef.current = false;
        return;
      }

      // Discard if user already switched to another track
      if (lastTrackIdRef.current !== trackGeneration) return;

      const currentSrc = audio.src ? audio.src : '';
      const trackFile = currentTrack.audioFile;
      const trackLoaded = currentSrc && (
        currentSrc.includes(trackFile) ||
        currentSrc.includes(encodeURI(trackFile))
      );
      if (!trackLoaded) {
        audio.src = audioUrl;
        audio.load();

        // Clear any previous fallback timeout
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }

        const onReady = async () => {
          audio.removeEventListener('canplay', onReady);
          audio.removeEventListener('canplaythrough', onReady);
          canPlayListenerRef.current = null;
          // Clear fallback timeout — canplay won the race
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
          if (!isLoadingRef.current) return; // already handled by timeout
          isLoadingRef.current = false;
          if (usePlayerStore.getState().isPlaying) {
            const played = await safePlay(audio);
            if (!played) storeActionsRef.current.pause();
          }
        };
        canPlayListenerRef.current = onReady;
        audio.addEventListener('canplay', onReady);
        audio.addEventListener('canplaythrough', onReady);

        loadTimeoutRef.current = setTimeout(async () => {
          loadTimeoutRef.current = null;
          if (isLoadingRef.current && audio.readyState >= 2) {
            isLoadingRef.current = false;
            if (usePlayerStore.getState().isPlaying) {
              const played = await safePlay(audio);
              if (!played) storeActionsRef.current.pause();
            }
          }
        }, 5000);
      } else {
        // Track already loaded — clear loading flag and play
        isLoadingRef.current = false;
        if (usePlayerStore.getState().isPlaying) {
          safePlay(audio);
        }
      }
    })();
  }, [currentTrack?.id, getAudioUrl, incrementPlayCount, pause, isVaultTrack]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;
    if (isLoadingRef.current) return;

    if (isPlaying) {
      const { uniquePlaysThisSession } = usePlayerStore.getState();
      if (!uniquePlaysThisSession.includes(currentTrack.id)) {
        incrementPlayCount(currentTrack.id);
      }
      if (audio.paused && audio.readyState >= 2) {
        safePlay(audio).then(played => {
          if (!played) storeActionsRef.current.pause();
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id]);

  // Volume
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio) audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Seeking — subscribe to store progress for user-initiated seeks only
  useEffect(() => {
    let lastProgress = usePlayerStore.getState().progress;
    const unsub = usePlayerStore.subscribe((state) => {
      if (state.progress !== lastProgress) {
        lastProgress = state.progress;
        // Skip seeking while a new track is loading — the progress:0 reset
        // from nextTrack/prevTrack would otherwise seek the OLD track to 0
        if (isLoadingRef.current) return;
        const audio = getGlobalAudio();
        if (audio && Math.abs(audio.currentTime - state.progress) > 1.5) {
          audio.currentTime = state.progress;
        }
      }
    });
    return unsub;
  }, []);

  // Media Session
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

  // Position state for lock screen seek bar — use progressBridge
  useEffect(() => {
    if (!currentTrack || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const unsub = progressBridge.subscribe((progress) => {
      const audio = getGlobalAudio();
      if (audio && audio.duration && navigator.mediaSession.setPositionState) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: Math.min(progress, audio.duration),
          });
        } catch (e) {}
      }
    });
    return unsub;
  }, [currentTrack]);

  return null;
}
