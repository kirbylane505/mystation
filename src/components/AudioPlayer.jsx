/**
 * MYSTATION - Audio Engine
 * Handles actual audio playback with HTML5 Audio
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';

// Audio file mapping - maps track IDs to actual audio files
const AUDIO_FILES = {
  // CINDY'S SON ALBUM
  1: '/audio/01 IDMG Mike Page 372.mp3', // Rich Off Rags
  2: '/audio/Impossible Dreamz PAGE 701_5.mp3', // Moved South
  3: '/audio/01 Mike Page x King Deazel idmg478 (ruff02).mp3', // Pick It Up Bag It
  4: '/audio/IDMG 273.mp3', // Meditation
  5: '/audio/01 Mike Page - idmg483 (X3.0) L.mp3', // 5 Mo
  6: '/audio/IDMG 342.mp3', // Til We All Up
  7: '/audio/IDMG 338 Deazel Page.mp3', // Doing Me ft King Deazel
  8: '/audio/01 Mike Page idmg482 ruff2.mp3', // Aww Shit
  9: '/audio/IDMG 394.mp3', // Up There
  10: '/audio/IDMG 414 VB Page.mp3', // Vibe ft Vincent Berry
  11: '/audio/ART_MP_IDMG_WATER.mp3', // Ask Yourself
  12: '/audio/01 Mike Page Lizzo.mp3', // Stretch U Out
  13: '/audio/01 Mike Page Rolling.mp3', // Damaged
  14: '/audio/IDMG 259 Mike Page.mp3', // Ready For Me
  15: '/audio/01 IDMG Love Is Mike Page Hook.mp3', // What Do We Do
  16: '/audio/01 IDMG 240 very special Mike Page Hook.mp3', // I Remember That
  17: '/audio/01 iDMG No Weapon Final1.mp3', // Things We Been Through
  18: '/audio/IDMG 305 VINYL.mp3', // Angel
  19: '/audio/01 Mike Page -Stand  Up(X05)(M02).mp3', // Stand Up
  20: '/audio/IDMG 337 VINYL Page.mp3', // Supa Love Ya Momma

  // 2025 SINGLES
  21: '/audio/01 Impossible Dreamz 2024 21_Mike.mp3', // Ten Toes Down
  22: '/audio/Impossible Dreamz 2024 61 -Mike Page (X1.1).mp3', // I'm Tryin
  23: '/audio/VB_iDMG 2024_62 - Ocean Level (ruff).mp3', // 4 A Minute
  24: '/audio/Impossible Dreamz 2024 74_Mike Page_1.mp3', // To The Moon
  25: '/audio/Impossible Dreamz 2024 86 - Mike Page x King Deazel _1.mp3', // One Love

  // 2024 SINGLES
  26: '/audio/iDMG x v120 - Mike Page (X1.0) new bass01.mp3', // Caught That
  27: '/audio/iDMG x gee_v107 - Mike Page _x1.1_.mp3', // Be Right There
  28: '/audio/IDMG Defoor 100 Shawn Hibbler - Mike Page (ruff01).mp3', // Dominate

  // 2023 SINGLES
  29: '/audio/01 iDMG 143 Mike Page x King Deaz.mp3', // Mindset
  30: '/audio/01 iDMG 788 MIKE PAGE x LYRIVELLI.mp3', // To the Money
  31: '/audio/01 (X4.3) iDMG 788 MIKE PAGE x LY.mp3', // Obvious
  32: '/audio/iDMG No Baggage Final1.mp3', // Remain a Hunnid Proof
  33: '/audio/TRUCKER - MIX 6.mp3', // Hammydowns

  // 2022 SINGLES
  34: '/audio/2023-06-07_Impossible Dreamz Splice 124_2rough.mp3', // Life Goes On
  35: '/audio/2023-06-08_Impossible Dreamz Splice 124_2rough.mp3', // Dick Gregory

  // 2021 SINGLES
  36: '/audio/From The Town (feat. Mike Page) [u1qUeN3tabY].mp3', // Power To the People

  // 2020 SINGLES
  37: '/audio/2023-06-07_Impossible Dreamz Splice 124_2rough_acap.mp3', // Pain
  38: '/audio/2023-06-08_Impossible Dreamz Splice 124_2rough_acap.mp3', // Piece of Mind

  // DARKSIDE BALLAZ
  39: '/audio/ART_MP_IDMG_WATER.mp3', // We Just Getting Started

  // iDMG COKE WAVE BEATS (Instrumentals) - using various beats
  40: '/audio/IDMG 273.mp3',
  41: '/audio/IDMG 342.mp3',
  42: '/audio/IDMG 394.mp3',
  43: '/audio/IDMG 259 Mike Page.mp3',
  44: '/audio/IDMG 305 VINYL.mp3',
  45: '/audio/IDMG 337 VINYL Page.mp3',
  46: '/audio/IDMG 338 Deazel Page.mp3',
  47: '/audio/IDMG 414 VB Page.mp3',
  48: '/audio/01 IDMG Mike Page 372.mp3',
  49: '/audio/Impossible Dreamz PAGE 701_5.mp3',
  50: '/audio/01 Mike Page - idmg483 (X3.0) L.mp3',

  // VAULT/EXCLUSIVE
  51: '/audio/2023-09-14_Mike Page - They know x murrille (169)_2.mp3', // They Know
  52: '/audio/2024-02-13_LOTL video edit.mp3', // LOTL Anthem
};

// Default audio for any unmapped tracks
const DEFAULT_AUDIO = '/audio/2023-09-14_Mike Page - They know x murrille (169)_2.mp3';

export default function AudioPlayer() {
  const audioRef = useRef(null);
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
  } = usePlayerStore();

  // Get audio URL for a track
  const getAudioUrl = useCallback((track) => {
    if (!track) return null;

    // Check if track has specific audio file mapped
    if (AUDIO_FILES[track.id]) {
      return AUDIO_FILES[track.id];
    }

    // Use default audio for demo purposes
    return DEFAULT_AUDIO;
  }, []);

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
  }, [currentTrack?.id, getAudioUrl]);

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
