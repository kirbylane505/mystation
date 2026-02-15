/**
 * MYSTATION - Waveform Progress Bar
 * Uses wavesurfer.js bound to the global audio element
 * Desktop player only — mobile keeps the simple progress bar
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';

let WaveSurfer = null;

export default function WaveformProgress({ audioElement }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { currentTrack, setProgress } = usePlayerStore();

  // Lazy-load wavesurfer (avoid SSR issues)
  useEffect(() => {
    if (!WaveSurfer) {
      import('wavesurfer.js').then((mod) => {
        WaveSurfer = mod.default;
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  // Initialize wavesurfer when ready and audio element exists
  useEffect(() => {
    if (!ready || !containerRef.current || !audioElement) return;

    // Destroy previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 32,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 0,
      waveColor: '#1a2d4a',
      progressColor: '#3b82f6',
      media: audioElement,
      interact: true,
      normalize: true,
      backend: 'MediaElement',
    });

    ws.on('interaction', (newTime) => {
      setProgress(newTime);
    });

    wavesurferRef.current = ws;

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [ready, audioElement, currentTrack?.id]);

  return (
    <div
      ref={containerRef}
      className="flex-1 cursor-pointer min-h-[32px]"
      style={{ minWidth: 0 }}
    />
  );
}
