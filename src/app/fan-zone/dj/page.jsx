/**
 * MYSTATION - DJ Turntable (Fan Zone)
 * Serato-style dual-deck mixer where fans can blend Mike Page songs
 * Web Audio API powered — crossfader, EQ, speed control, effects
 *
 * FIXES (Feb 12 2026):
 * 1. AudioContext created lazily on first user tap (iOS Safari fix)
 * 2. DJ bypasses subscription/trial gate (sends x-dj-mode header)
 * 3. Error UI when track fails to load
 * 4. Search filter in dropdown (129 tracks was too many to scroll)
 * 5. Mobile touch improvements
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { tracks as allTracks } from '@/data/tracks';
import { Music2, Play, Pause, SkipBack, HelpCircle, X, Disc3, ChevronDown, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

// Get only public (non-private) tracks with audio
const djTracks = allTracks.filter(t => t.audioFile && !t.isPrivate);

// ============ AUDIO ENGINE ============
class DeckEngine {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.source = null;
    this.buffer = null;
    this.gainNode = this.ctx.createGain();
    this.eqLow = this.ctx.createBiquadFilter();
    this.eqMid = this.ctx.createBiquadFilter();
    this.eqHigh = this.ctx.createBiquadFilter();

    // EQ setup
    this.eqLow.type = 'lowshelf';
    this.eqLow.frequency.value = 320;
    this.eqLow.gain.value = 0;

    this.eqMid.type = 'peaking';
    this.eqMid.frequency.value = 1000;
    this.eqMid.Q.value = 0.5;
    this.eqMid.gain.value = 0;

    this.eqHigh.type = 'highshelf';
    this.eqHigh.frequency.value = 3200;
    this.eqHigh.gain.value = 0;

    // Chain: source -> eqLow -> eqMid -> eqHigh -> gain -> destination
    this.eqLow.connect(this.eqMid);
    this.eqMid.connect(this.eqHigh);
    this.eqHigh.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    this.isPlaying = false;
    this.startTime = 0;
    this.pauseOffset = 0;
    this.playbackRate = 1.0;
    this.duration = 0;
  }

  async loadTrack(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      if (!arrayBuf || arrayBuf.byteLength === 0) throw new Error('Empty audio data');
      this.buffer = await this.ctx.decodeAudioData(arrayBuf);
      this.duration = this.buffer.duration;
      this.pauseOffset = 0;
      if (this.isPlaying) this.stop();
      return { ok: true };
    } catch (e) {
      console.error('Failed to load track:', e);
      return { ok: false, error: e.message || 'Failed to load audio' };
    }
  }

  play() {
    if (!this.buffer || this.isPlaying) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = this.playbackRate;
    this.source.connect(this.eqLow);
    this.source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseOffset = 0;
      }
    };
    this.source.start(0, this.pauseOffset);
    this.startTime = this.ctx.currentTime - this.pauseOffset;
    this.isPlaying = true;
  }

  pause() {
    if (!this.isPlaying) return;
    try { this.source.stop(); } catch(e) {}
    this.pauseOffset = this.ctx.currentTime - this.startTime;
    this.isPlaying = false;
  }

  stop() {
    if (this.source) {
      try { this.source.stop(); } catch(e) {}
    }
    this.isPlaying = false;
    this.pauseOffset = 0;
  }

  getCurrentTime() {
    if (!this.isPlaying) return this.pauseOffset;
    return (this.ctx.currentTime - this.startTime) * this.playbackRate;
  }

  seekTo(time) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      try { this.source.stop(); } catch(e) {}
      this.isPlaying = false;
    }
    this.pauseOffset = Math.max(0, Math.min(time, this.duration));
    if (wasPlaying) this.play();
  }

  setSpeed(rate) {
    this.playbackRate = rate;
    if (this.source) {
      this.source.playbackRate.value = rate;
    }
  }

  setVolume(val) {
    this.gainNode.gain.value = val;
  }

  setEQ(band, val) {
    if (band === 'low') this.eqLow.gain.value = val;
    if (band === 'mid') this.eqMid.gain.value = val;
    if (band === 'high') this.eqHigh.gain.value = val;
  }
}

// ============ TUTORIAL OVERLAY ============
function Tutorial({ onClose }) {
  const steps = [
    { icon: '🎵', title: 'Load Songs', desc: 'Tap the song dropdown on each deck to load a Mike Page track.' },
    { icon: '▶️', title: 'Play & Pause', desc: 'Hit the big play button on each deck to start the music.' },
    { icon: '🎚️', title: 'Crossfader', desc: 'Slide the crossfader left or right to blend between Deck A and Deck B.' },
    { icon: '⚡', title: 'Speed Control', desc: 'Use the speed slider to slow down or speed up each deck.' },
    { icon: '🎛️', title: 'EQ Knobs', desc: 'Twist the Bass, Mid, and Treble knobs to shape the sound on each deck.' },
    { icon: '🔥', title: 'Mix It Up!', desc: 'Load different songs, blend them together, and create your own mix!' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-amber-400 mb-1 text-center">How to DJ</h2>
        <p className="text-zinc-400 text-sm text-center mb-6">Mix Mike Page tracks like a pro</p>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="text-2xl w-10 h-10 flex items-center justify-center flex-shrink-0">{step.icon}</div>
              <div>
                <div className="text-white font-semibold text-sm">{step.title}</div>
                <div className="text-zinc-400 text-xs">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition">
          Let&apos;s Go!
        </button>
      </div>
    </div>
  );
}

// ============ TURNTABLE VISUAL ============
function Turntable({ isPlaying, speed, trackTitle }) {
  return (
    <div className="relative w-32 h-32 sm:w-44 sm:h-44 mx-auto">
      {/* Platter */}
      <div
        className={`w-full h-full rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center ${isPlaying ? 'animate-spin-vinyl' : ''}`}
        style={{ animationDuration: `${2 / (speed || 1)}s` }}
      >
        {/* Grooves */}
        <div className="absolute inset-3 rounded-full border border-zinc-800" />
        <div className="absolute inset-6 rounded-full border border-zinc-800" />
        <div className="absolute inset-9 rounded-full border border-zinc-800" />
        <div className="absolute inset-12 rounded-full border border-zinc-700" />
        {/* Label */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center z-10 border-2 border-amber-500/50">
          <Disc3 size={18} className="text-black" />
        </div>
      </div>
      {/* Tonearm */}
      <div
        className="absolute -top-1 -right-1 w-1 bg-zinc-500 origin-top transition-transform duration-500"
        style={{
          height: '50px',
          transform: isPlaying ? 'rotate(25deg)' : 'rotate(0deg)',
          borderRadius: '2px',
        }}
      />
      {/* Track name under vinyl */}
      <div className="text-center mt-2 text-xs text-zinc-500 truncate max-w-[160px] mx-auto">
        {trackTitle || 'No track loaded'}
      </div>
    </div>
  );
}

// ============ EQ KNOB ============
function EQKnob({ label, value, onChange }) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const handleStart = (e) => {
    dragging.current = true;
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    startVal.current = value;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging.current) return;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const diff = (startY.current - y) * 0.3;
      const newVal = Math.max(-12, Math.min(12, startVal.current + diff));
      onChange(Math.round(newVal));
    };
    const handleEnd = () => { dragging.current = false; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [onChange, value]);

  const rotation = (value / 12) * 135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-600 cursor-grab active:cursor-grabbing relative select-none touch-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        onDoubleClick={() => onChange(0)}
        title="Double-click to reset"
      >
        <div
          className="absolute top-1 left-1/2 w-0.5 h-3 bg-amber-400 rounded-full origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)`, transformOrigin: '50% 200%' }}
        />
      </div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-[10px] text-amber-400/60">{value > 0 ? `+${value}` : value}</span>
    </div>
  );
}

// ============ DECK COMPONENT ============
function Deck({ label, deckColor, engine, initAudio, tracks }) {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const animRef = useRef(null);
  const searchRef = useRef(null);

  const filteredTracks = searchQuery
    ? tracks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.artist && t.artist.toLowerCase().includes(searchQuery.toLowerCase())))
    : tracks;

  const updateProgress = useCallback(() => {
    if (engine.current && engine.current.isPlaying) {
      const ct = engine.current.getCurrentTime();
      setProgress(ct);
      if (ct >= engine.current.duration) {
        setIsPlaying(false);
        setProgress(0);
      }
    }
    animRef.current = requestAnimationFrame(updateProgress);
  }, [engine]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animRef.current);
  }, [updateProgress]);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (showDropdown && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
    if (!showDropdown) setSearchQuery('');
  }, [showDropdown]);

  const loadTrack = async (track) => {
    setShowDropdown(false);
    setSearchQuery('');
    setLoading(true);
    setError(null);
    setSelectedTrack(track);

    // Initialize AudioContext on first user gesture (iOS Safari fix)
    const audioReady = await initAudio();
    if (!audioReady) {
      setError('Could not start audio. Tap and try again.');
      setLoading(false);
      return;
    }

    // Fetch token with DJ bypass header
    try {
      const tokenRes = await fetch('/api/audio/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dj-mode': '1',
        },
        body: JSON.stringify({ trackId: track.id }),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${tokenRes.status})`);
      }

      const { token } = await tokenRes.json();
      const audioUrl = `${track.audioFile}?_t=${token}`;
      const result = await engine.current.loadTrack(audioUrl);

      if (result.ok) {
        setDuration(engine.current.duration);
        setProgress(0);
        setIsPlaying(false);
      } else {
        setError(result.error || 'Could not decode audio');
      }
    } catch (e) {
      console.error('Failed to load:', e);
      setError(e.message || 'Failed to load song');
    }
    setLoading(false);
  };

  const togglePlay = async () => {
    if (!engine.current || !engine.current.buffer) return;
    const audioReady = await initAudio();
    if (!audioReady) return;
    if (isPlaying) {
      engine.current.pause();
      setIsPlaying(false);
    } else {
      engine.current.play();
      setIsPlaying(true);
    }
  };

  const restart = () => {
    if (!engine.current || !engine.current.buffer) return;
    engine.current.seekTo(0);
    setProgress(0);
    if (!isPlaying) {
      engine.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (val) => {
    const rate = parseFloat(val);
    setSpeed(rate);
    if (engine.current) engine.current.setSpeed(rate);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (engine.current) engine.current.seekTo(val);
    setProgress(val);
  };

  const handleEQ = (band, val) => {
    if (band === 'low') setEqLow(val);
    if (band === 'mid') setEqMid(val);
    if (band === 'high') setEqHigh(val);
    if (engine.current) engine.current.setEQ(band, val);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const borderColor = deckColor === 'blue' ? 'border-blue-500/30' : 'border-red-500/30';
  const labelColor = deckColor === 'blue' ? 'text-blue-400' : 'text-red-400';
  const btnColor = deckColor === 'blue' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500';
  const accentBg = deckColor === 'blue' ? 'from-blue-600/10' : 'from-red-600/10';

  return (
    <div className={`bg-gradient-to-b ${accentBg} to-zinc-900/50 border ${borderColor} rounded-2xl p-3 sm:p-5`}>
      {/* Deck Label */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-bold ${labelColor} tracking-widest`}>{label}</span>
        <span className="text-[10px] text-zinc-500">
          {speed !== 1.0 && `${(speed * 100).toFixed(0)}%`}
        </span>
      </div>

      {/* Turntable */}
      <Turntable isPlaying={isPlaying} speed={speed} trackTitle={selectedTrack?.title} />

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Song Selector with Search */}
      <div className="relative mt-3">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full py-2.5 px-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-left flex items-center justify-between hover:border-zinc-500 transition"
        >
          <span className={selectedTrack ? 'text-white truncate' : 'text-zinc-500'}>
            {loading ? 'Loading...' : selectedTrack ? selectedTrack.title : 'Select a song...'}
          </span>
          <ChevronDown size={16} className={`text-zinc-500 transition-transform flex-shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl z-30 shadow-xl overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-zinc-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search songs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            {/* Track list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTracks.length === 0 ? (
                <div className="px-3 py-4 text-sm text-zinc-500 text-center">No songs found</div>
              ) : (
                filteredTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => loadTrack(t)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-700 active:bg-zinc-600 transition flex items-center gap-2"
                  >
                    <Music2 size={12} className="text-amber-400 flex-shrink-0" />
                    <span className="text-white truncate">{t.title}</span>
                    <span className="text-zinc-500 text-xs ml-auto flex-shrink-0">{t.duration}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <button onClick={restart} className="text-zinc-400 hover:text-white transition p-2" title="Restart">
          <SkipBack size={18} />
        </button>
        <button
          onClick={togglePlay}
          disabled={!selectedTrack || loading}
          className={`w-14 h-14 rounded-full ${btnColor} text-white flex items-center justify-center transition disabled:opacity-30`}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
      </div>

      {/* Speed Control */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Speed</span>
          <button onClick={() => handleSpeedChange(1.0)} className="text-[10px] text-amber-400/60 hover:text-amber-400">Reset</button>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.01}
          value={speed}
          onChange={(e) => handleSpeedChange(e.target.value)}
          className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
          <span>-50%</span>
          <span className="text-amber-400/80">{(speed * 100).toFixed(0)}%</span>
          <span>+50%</span>
        </div>
      </div>

      {/* EQ Section */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-2 text-center">EQ</span>
        <div className="flex items-center justify-center gap-5">
          <EQKnob label="Bass" value={eqLow} onChange={(v) => handleEQ('low', v)} />
          <EQKnob label="Mid" value={eqMid} onChange={(v) => handleEQ('mid', v)} />
          <EQKnob label="Treble" value={eqHigh} onChange={(v) => handleEQ('high', v)} />
        </div>
      </div>
    </div>
  );
}

// ============ MAIN DJ PAGE ============
export default function DJPage() {
  const [mounted, setMounted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [crossfade, setCrossfade] = useState(0.5);
  const audioCtxRef = useRef(null);
  const deckARef = useRef(null);
  const deckBRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem('ms-dj-tutorial');
    if (!seen) setShowTutorial(true);
  }, []);

  // Lazy AudioContext init — MUST be called from a user gesture (tap/click)
  // This is the iOS Safari fix: AudioContext created outside gesture = permanently suspended
  const initAudio = useCallback(async () => {
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      return true;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      deckARef.current = new DeckEngine(ctx);
      deckBRef.current = new DeckEngine(ctx);
      if (ctx.state === 'suspended') await ctx.resume();
      return true;
    } catch (e) {
      console.error('AudioContext init failed:', e);
      return false;
    }
  }, []);

  useEffect(() => {
    // Crossfader: 0 = all A, 0.5 = equal, 1 = all B
    if (deckARef.current) {
      const volA = Math.cos(crossfade * Math.PI / 2);
      deckARef.current.setVolume(volA);
    }
    if (deckBRef.current) {
      const volB = Math.sin(crossfade * Math.PI / 2);
      deckBRef.current.setVolume(volB);
    }
  }, [crossfade]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('ms-dj-tutorial', '1');
  };

  if (!mounted) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Disc3 size={48} className="text-amber-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-white pb-32">
      {showTutorial && <Tutorial onClose={closeTutorial} />}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/fan-zone" className="text-zinc-400 hover:text-white text-sm">&larr; Fan Zone</Link>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex items-center gap-2">
              <Disc3 size={20} className="text-amber-400" />
              <span className="font-bold text-lg tracking-tight">DJ Turntables</span>
            </div>
          </div>
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">How to Use</span>
          </button>
        </div>
      </div>

      {/* Quick Start Banner */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🎧</span>
          <div>
            <p className="text-sm text-white font-medium">Load a song on each deck, hit play, and slide the crossfader to blend!</p>
            <p className="text-xs text-zinc-400 mt-0.5">Drag the EQ knobs up/down to shape the sound. Double-click to reset.</p>
          </div>
        </div>
      </div>

      {/* Decks */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Deck
            label="DECK A"
            deckColor="blue"
            engine={deckARef}
            initAudio={initAudio}
            tracks={djTracks}
          />
          <Deck
            label="DECK B"
            deckColor="red"
            engine={deckBRef}
            initAudio={initAudio}
            tracks={djTracks}
          />
        </div>

        {/* Crossfader */}
        <div className="mt-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400 tracking-widest">A</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Crossfader</span>
            <span className="text-xs font-bold text-red-400 tracking-widest">B</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={crossfade}
            onChange={(e) => setCrossfade(parseFloat(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-blue-600/30 via-zinc-700 to-red-600/30 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setCrossfade(0.5)}
              className="text-[10px] text-zinc-500 hover:text-amber-400 transition"
            >
              Center
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🎵</div>
            <div className="text-xs text-zinc-400">Load different songs on each deck for the best blends</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🎚️</div>
            <div className="text-xs text-zinc-400">Match the speed of both decks for smoother transitions</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">🔊</div>
            <div className="text-xs text-zinc-400">Cut the bass on one deck while boosting it on the other</div>
          </div>
        </div>
      </div>

      {/* Custom CSS for vinyl spin animation */}
      <style jsx global>{`
        @keyframes spin-vinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-vinyl {
          animation: spin-vinyl 2s linear infinite;
        }
        /* Custom range thumb styling */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #000;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #000;
        }
      `}</style>
    </div>
  );
}
