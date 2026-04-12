'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/store/playerStore';

const TRACKS = [
  { title: 'Coke Wave Back', duration: '3:13', id: 'jUI5rFOXbQs' },
  { title: 'Vein', duration: '1:55', id: 'bpvD_vwFzkM' },
  { title: 'Count Up', duration: '3:13', id: 's6yUu6Gmxlo' },
  { title: "That's Her", duration: '3:27', id: 'R4Mn-Ye3dGk' },
  { title: '2 Steps Ahead', duration: '', id: 'mfKXFEco8jk' },
  { title: 'Slide', duration: '', id: 'AIC5QHVkvyE' },
  { title: 'Run It Up', duration: '', id: 'D2J-XeDfwyg' },
];

const PLAYLIST_IDS = TRACKS.map(t => t.id).join(',');

export default function CubistPlayer() {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const ytReadyRef = useRef(false);

  // Pause global player when YouTube plays
  const pauseGlobal = useCallback(() => {
    const state = usePlayerStore.getState();
    if (state.isPlaying) {
      state.pause();
    }
  }, []);

  // Pause YouTube when global player starts
  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state, prev) => {
      if (state.isPlaying && !prev?.isPlaying && playerRef.current && ytReadyRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) { /* player not ready */ }
      }
    });
    return () => unsub();
  }, []);

  // Load YouTube IFrame API + create player
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => createPlayer();

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  function createPlayer() {
    if (playerRef.current) return;
    playerRef.current = new window.YT.Player('cubist-yt-player', {
      height: '100%',
      width: '100%',
      videoId: TRACKS[0].id,
      playerVars: {
        playlist: PLAYLIST_IDS,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => { ytReadyRef.current = true; },
        onStateChange: (e) => {
          // 1 = playing
          if (e.data === 1) pauseGlobal();
        },
      },
    });
  }

  function playTrack(index) {
    pauseGlobal();
    if (playerRef.current && ytReadyRef.current) {
      playerRef.current.playVideoAt(index);
    }
  }

  return (
    <div>
      {/* YouTube Player */}
      <div className="mb-10">
        <div className="aspect-video rounded-2xl overflow-hidden mb-4">
          <div id="cubist-yt-player" />
        </div>
        <h3 className="text-xl font-bold text-white">iDMG Coke Wave Beats</h3>
        <p className="text-white/50">Produced by The Cubist, Consecutive Playback</p>
      </div>

      {/* Tracklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRACKS.map((track, i) => (
          <button
            key={i}
            onClick={() => playTrack(i)}
            className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-colors group text-left"
          >
            <span className="text-amber-400/60 text-sm font-mono w-5">{i + 1}</span>
            <span className="text-white font-medium flex-1 group-hover:text-amber-400 transition-colors">{track.title}</span>
            {track.duration && <span className="text-white/30 text-sm">{track.duration}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
