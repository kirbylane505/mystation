/**
 * MYSTATION - Audio Engine
 * Handles actual audio playback with HTML5 Audio
 * PERSISTS across page navigation - audio keeps playing!
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
    globalAudio.preload = 'metadata';
  }
  return globalAudio;
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
    repeat,
    incrementPlayCount,
    openSubscribeModal,
    pause,
  } = usePlayerStore();

  const { isSubscribed } = useUserStore();

  // Get audio URL directly from track
  const getAudioUrl = useCallback((track) => {
    if (!track) return null;
    return track.audioFile || null;
  }, []);

  // Check subscription wall before playing
  const checkCanPlay = useCallback((trackId) => {
    if (isSubscribed) return true;
    const { playCount, uniquePlaysThisSession } = usePlayerStore.getState();
    if (uniquePlaysThisSession.includes(trackId)) return true;
    return playCount < 3;
  }, [isSubscribed]);

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

    // DON'T cleanup - we want audio to persist!
    return () => {
      // Only cleanup listeners, never pause the audio
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
      if (audioUrl && audio.src !== audioUrl) {
        audio.src = audioUrl;
        audio.load();

        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch(err => {
              console.log('Playback prevented:', err);
            });
          }
        }
      }
    }
  }, [currentTrack?.id, getAudioUrl, checkCanPlay, incrementPlayCount, openSubscribeModal, pause, isPlaying]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = getGlobalAudio();
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(err => {
          console.log('Playback prevented:', err);
        });
      }
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

  return null;
}
