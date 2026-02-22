/**
 * MYSTATION - Premium Draggable Seek Bar
 * Touch-drag + mouse-drag seek with real-time preview
 * Uses progressBridge for zero-rerender progress updates
 */

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { progressBridge } from '@/lib/progressBridge';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SeekBar({ showTimes = true, height = 4, className = '' }) {
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const thumbRef = useRef(null);
  const currentTimeRef = useRef(null);
  const totalTimeRef = useRef(null);
  const isDragging = useRef(false);
  const [hovering, setHovering] = useState(false);

  const setProgress = usePlayerStore(s => s.setProgress);
  const duration = usePlayerStore(s => s.duration);
  const durationRef = useRef(0);

  // Keep duration ref in sync
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Subscribe to progressBridge — direct DOM updates, zero re-renders
  useEffect(() => {
    const unsub = progressBridge.subscribe((progress, dur) => {
      if (isDragging.current) return; // Don't update while user is dragging
      const d = dur || durationRef.current;
      const pct = d > 0 ? (progress / d) * 100 : 0;
      if (fillRef.current) fillRef.current.style.width = `${pct}%`;
      if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
      if (currentTimeRef.current) currentTimeRef.current.textContent = formatTime(progress);
      if (totalTimeRef.current) totalTimeRef.current.textContent = formatTime(d);
    });
    return unsub;
  }, []);

  const getPercentFromEvent = useCallback((e) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const updateVisual = useCallback((pct) => {
    const percent = pct * 100;
    if (fillRef.current) fillRef.current.style.width = `${percent}%`;
    if (thumbRef.current) thumbRef.current.style.left = `${percent}%`;
    const d = durationRef.current;
    if (currentTimeRef.current && d) {
      currentTimeRef.current.textContent = formatTime(pct * d);
    }
  }, []);

  const commitSeek = useCallback((pct) => {
    const d = durationRef.current;
    if (d > 0) {
      setProgress(pct * d);
    }
  }, [setProgress]);

  // Mouse handlers
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    const pct = getPercentFromEvent(e);
    updateVisual(pct);

    const onMouseMove = (e) => {
      const pct = getPercentFromEvent(e);
      updateVisual(pct);
    };

    const onMouseUp = (e) => {
      isDragging.current = false;
      const pct = getPercentFromEvent(e);
      commitSeek(pct);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [getPercentFromEvent, updateVisual, commitSeek]);

  // Touch handlers
  const onTouchStart = useCallback((e) => {
    isDragging.current = true;
    const pct = getPercentFromEvent(e);
    updateVisual(pct);
  }, [getPercentFromEvent, updateVisual]);

  const onTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const pct = getPercentFromEvent(e);
    updateVisual(pct);
  }, [getPercentFromEvent, updateVisual]);

  const onTouchEnd = useCallback((e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // Use last known position from changedTouches
    if (e.changedTouches && e.changedTouches[0] && trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.changedTouches[0].clientX - rect.left) / rect.width));
      commitSeek(pct);
    }
  }, [commitSeek]);

  return (
    <div className={`flex items-center gap-3 w-full ${className}`}>
      {showTimes && (
        <span ref={currentTimeRef} className="text-[11px] text-white/40 w-10 text-right font-mono tabular-nums select-none">
          0:00
        </span>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className="relative flex-1 group cursor-pointer"
        style={{ height: Math.max(height, 24), display: 'flex', alignItems: 'center' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Background track */}
        <div
          className="absolute left-0 right-0 rounded-full bg-white/10 transition-all"
          style={{ height: hovering ? height + 2 : height, top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Fill */}
        <div
          ref={fillRef}
          className="absolute left-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-[height] duration-150"
          style={{ width: '0%', height: hovering ? height + 2 : height, top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Thumb */}
        <div
          ref={thumbRef}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-opacity duration-150"
          style={{
            left: '0%',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            opacity: hovering ? 1 : 0,
            pointerEvents: 'none',
          }}
        />
      </div>

      {showTimes && (
        <span ref={totalTimeRef} className="text-[11px] text-white/40 w-10 font-mono tabular-nums select-none">
          0:00
        </span>
      )}
    </div>
  );
}
