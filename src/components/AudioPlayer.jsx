/**
 * MYSTATION - Audio Engine
 * Handles actual audio playback with HTML5 Audio
 * Includes 3-song free limit with subscription wall
 * Tracks engagement stats (streaks, badges, etc.)
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { useEngagementStore } from '@/store/engagementStore';

export default function AudioPlayer() {
  const audioRef = useRef(null);
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
    playCount,
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
    // Subscribed users can always play
    if (isSubscribed) return true;

    // Get current play count from store
    const { playCount, uniquePlaysThisSession } = usePlayerStore.getState();

    // Already played this track? Allow replay
    if (uniquePlaysThisSession.includes(trackId)) return true;

    // Check if under limit (3 free unique plays)
    return playCount < 3;
  }, [isSubscribed]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';

      // Event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, []);

  // Load new track when currentTrack changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    // Check if this is a new track
    const isNewTrack = lastTrackIdRef.current !== currentTrack.id;

    if (isNewTrack) {
      // Check subscription wall for new tracks
      if (!checkCanPlay(currentTrack.id)) {
        // Hit the wall - show subscribe modal
        pause();
        openSubscribeModal(currentTrack);
        return;
      }

      // Track this play (only counts unique plays)
      incrementPlayCount(currentTrack.id);
      lastTrackIdRef.current = currentTrack.id;

      // Record play for engagement (streaks, badges, etc.)
      useEngagementStore.getState().recordPlay(currentTrack.id, currentTrack.albumId);
    }

    const audioUrl = getAudioUrl(currentTrack);
    if (audioUrl) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();

      // Auto-play when track changes
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise.catch(err => {
            console.log('Playback prevented:', err);
          });
        }
      }
    }
  }, [currentTrack?.id, getAudioUrl, checkCanPlay, incrementPlayCount, openSubscribeModal, pause, isPlaying]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise.catch(err => {
          console.log('Playback prevented:', err);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle seeking (when user clicks progress bar)
  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - progress) > 1) {
      audioRef.current.currentTime = progress;
    }
  }, [progress]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      nextTrack();
    }
  };

  const handleError = (e) => {
    console.error('Audio error:', e);
  };

  // This component doesn't render anything visible
  return null;
}
