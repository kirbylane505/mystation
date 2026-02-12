/**
 * MYSTATION - Sleep Timer
 * Play music before bed, set a timer, computer sleeps when done.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Moon, X, Clock, Volume2 } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

const PRESETS = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '90 min', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

export default function SleepTimer({ isOpen, onClose }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const fadeRef = useRef(null);
  const originalVolumeRef = useRef(1);

  const { pause, volume, setVolume } = usePlayerStore();

  // Countdown timer
  useEffect(() => {
    if (!isActive || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          startFadeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // Fade out volume over 30 seconds then stop
  const startFadeOut = useCallback(() => {
    setIsFading(true);
    originalVolumeRef.current = volume;
    const fadeSteps = 30;
    const stepTime = 1000; // 1 second per step
    const volumeStep = volume / fadeSteps;
    let step = 0;

    fadeRef.current = setInterval(() => {
      step++;
      const newVolume = Math.max(0, volume - (volumeStep * step));
      setVolume(newVolume);

      if (step >= fadeSteps) {
        clearInterval(fadeRef.current);
        pause();
        setVolume(originalVolumeRef.current);
        setIsActive(false);
        setIsFading(false);
        // Signal for sleep - write to localStorage so local agents can detect it
        localStorage.setItem('mystation-sleep-trigger', Date.now().toString());
        // Try to trigger computer sleep via the API
        triggerSleep();
      }
    }, stepTime);
  }, [volume, setVolume, pause]);

  const triggerSleep = async () => {
    try {
      await fetch('/api/sleep-trigger', { method: 'POST' });
    } catch (e) {
      // Best effort - the local agent will pick it up
    }
  };

  const startTimer = () => {
    const mins = customMinutes ? parseInt(customMinutes) : selectedMinutes;
    if (!mins || mins <= 0) return;
    setSecondsLeft(mins * 60);
    setIsActive(true);
    onClose();
  };

  const cancelTimer = () => {
    setIsActive(false);
    setSecondsLeft(0);
    setIsFading(false);
    if (fadeRef.current) clearInterval(fadeRef.current);
  };

  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Active timer badge (always visible when timer running)
  if (isActive && !isOpen) {
    return (
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 border border-indigo-400/40 rounded-full text-indigo-300 text-xs font-mono animate-pulse"
        title="Sleep timer active — click to manage"
      >
        <Moon size={12} />
        {isFading ? 'Fading...' : formatCountdown(secondsLeft)}
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Moon className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white">Sleep Timer</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="text-white/70" size={20} />
          </button>
        </div>

        <div className="p-4">
          {isActive ? (
            /* Active Timer View */
            <div className="text-center py-6">
              <Moon size={48} className="text-indigo-400 mx-auto mb-4" />
              <p className="text-white/60 text-sm mb-2">Music stops in</p>
              <p className="text-5xl font-bold text-white font-mono mb-6">
                {formatCountdown(secondsLeft)}
              </p>
              {isFading && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Volume2 size={16} className="text-indigo-400" />
                  <p className="text-indigo-300 text-sm">Volume fading out...</p>
                </div>
              )}
              <button
                onClick={cancelTimer}
                className="px-8 py-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full font-medium hover:bg-red-500/30 transition"
              >
                Cancel Timer
              </button>
            </div>
          ) : (
            /* Set Timer View */
            <>
              <p className="text-white/50 text-sm mb-4 flex items-center gap-2">
                <Clock size={14} /> Play music, then sleep
              </p>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {PRESETS.map(preset => (
                  <button
                    key={preset.minutes}
                    onClick={() => { setSelectedMinutes(preset.minutes); setCustomMinutes(''); }}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedMinutes === preset.minutes && !customMinutes
                        ? 'bg-indigo-500/30 border border-indigo-400/50 text-indigo-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Time */}
              <div className="mb-6">
                <label className="text-white/40 text-xs mb-1 block">Or enter custom minutes:</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  placeholder="e.g. 75"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg placeholder-white/20 focus:border-indigo-400/50 outline-none"
                />
              </div>

              {/* Start Button */}
              <button
                onClick={startTimer}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-xl hover:opacity-90 transition flex items-center justify-center gap-3"
              >
                <Moon size={22} />
                Start Sleep Timer — {customMinutes || selectedMinutes} min
              </button>

              <p className="text-white/30 text-xs text-center mt-3">
                Volume fades out over 30 seconds, then your computer sleeps
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
