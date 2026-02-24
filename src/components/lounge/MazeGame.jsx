/**
 * KICKBACK LOUNGE — Maze HQ Game
 * Dark neon theme with fog of war, trail breadcrumbs, pulsing goal beacon
 * Canvas-rendered maze with keyboard, D-pad, and swipe controls
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateMaze,
  initMaze,
  startMaze,
  movePlayer,
  getMazeResults,
} from '@/lib/games/maze';

// ============================================================
// CONSTANTS
// ============================================================
const BG_COLOR = '#0a0a0f';
const WALL_COLOR = '#00f0ff';
const WALL_GLOW_COLOR = 'rgba(0, 240, 255, 0.4)';
const PLAYER_COLOR = '#39ff14';
const PLAYER_GLOW = 'rgba(57, 255, 20, 0.5)';
const END_COLOR = '#ff00ff';
const END_GLOW = 'rgba(255, 0, 255, 0.6)';
const TRAIL_COLOR = 'rgba(0, 240, 255, 0.15)';
const FOG_COLOR = 'rgba(10, 10, 15, 0.92)';
const REVEALED_DIM = 'rgba(10, 10, 15, 0.6)';
const FOG_RADIUS = 3;
const WALL_THICKNESS = 2;

// Player colors for multiplayer
const MULTI_PLAYER_COLORS = [
  '#39ff14', // neon green
  '#ff6b35', // neon orange
  '#ff3864', // neon pink
  '#ffe600', // neon yellow
];

// ============================================================
// SOUND EFFECTS (Web Audio API)
// ============================================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playMoveSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) { /* audio not available */ }
}

function playWallBump() {
  try {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) { /* audio not available */ }
}

function playWinSound() {
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch (e) { /* audio not available */ }
}

function playTimerTick() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) { /* audio not available */ }
}

// ============================================================
// COMPONENT
// ============================================================
export default function MazeGame({ gameState: externalState, myPlayerId, onMove }) {
  // Local state for solo play (when no external gameState)
  const [localState, setLocalState] = useState(null);
  const [selectedSize, setSelectedSize] = useState('medium');
  const [timeLeft, setTimeLeft] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [wallBumpDir, setWallBumpDir] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const touchStartRef = useRef(null);
  const revealedCellsRef = useRef(new Set());
  const isSolo = !externalState;
  const state = isSolo ? localState : externalState;
  const playerId = myPlayerId || 'solo_player';

  // Detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Initialize solo game
  const initSoloGame = useCallback((size) => {
    const newState = initMaze([playerId], size);
    revealedCellsRef.current = new Set();
    revealedCellsRef.current.add(`${newState.maze.start.x},${newState.maze.start.y}`);
    setLocalState(newState);
    setShowResults(false);
    setTimeLeft(newState.timeLimit);
  }, [playerId]);

  // Start the game
  const startGame = useCallback(() => {
    if (!state || state.phase !== 'ready') return;
    if (isSolo) {
      setLocalState(prev => startMaze(prev));
    }
  }, [state, isSolo]);

  // Handle move
  const handleMove = useCallback((direction) => {
    if (!state || state.phase !== 'playing') return;

    if (isSolo) {
      setLocalState(prev => {
        if (!prev || prev.phase !== 'playing') return prev;
        const result = movePlayer(prev, playerId, direction);
        if (result.valid) {
          playMoveSound();
          // Update revealed cells
          const p = result.state.players[playerId];
          if (p) {
            const { x, y } = p;
            const maze = result.state.maze;
            for (let dy = -FOG_RADIUS; dy <= FOG_RADIUS; dy++) {
              for (let dx = -FOG_RADIUS; dx <= FOG_RADIUS; dx++) {
                const cx = x + dx;
                const cy = y + dy;
                if (cx >= 0 && cx < maze.width && cy >= 0 && cy < maze.height) {
                  const dist = Math.abs(dx) + Math.abs(dy);
                  if (dist <= FOG_RADIUS) {
                    revealedCellsRef.current.add(`${cx},${cy}`);
                  }
                }
              }
            }
          }
          if (result.moveDetails?.reachedEnd) {
            playWinSound();
          }
          return result.state;
        } else {
          if (result.error === 'Wall blocks this path') {
            playWallBump();
            setWallBumpDir(direction);
            setTimeout(() => setWallBumpDir(null), 150);
          }
          return prev;
        }
      });
    } else if (onMove) {
      onMove(direction);
    }
  }, [state, isSolo, playerId, onMove]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        W: 'up',
        S: 'down',
        A: 'left',
        D: 'right',
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Swipe detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        handleMove(dy > 0 ? 'down' : 'up');
      }
      touchStartRef.current = null;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove]);

  // Timer countdown
  useEffect(() => {
    if (!state || state.phase !== 'playing' || !state.startTime) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - state.startTime) / 1000;
      const remaining = Math.max(0, state.timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));

      // Tick sound in last 10 seconds
      if (remaining <= 10 && remaining > 0 && Math.ceil(remaining) !== Math.ceil(remaining + 0.1)) {
        playTimerTick();
      }

      if (remaining <= 0) {
        if (isSolo) {
          setLocalState(prev => prev ? { ...prev, phase: 'finished' } : prev);
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state?.phase, state?.startTime, state?.timeLimit, isSolo]);

  // Show results when game ends
  useEffect(() => {
    if (state?.phase === 'finished' && !showResults) {
      setTimeout(() => setShowResults(true), 500);
    }
  }, [state?.phase, showResults]);

  // Pulse animation for goal and player
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame++;
      setPulsePhase(frame * 0.05);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ============================================================
  // CANVAS RENDERING
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !state || !state.maze) return;

    const ctx = canvas.getContext('2d');
    const maze = state.maze;
    const { width: mw, height: mh } = maze;

    // Size canvas to container
    const rect = container.getBoundingClientRect();
    const maxW = rect.width;
    const maxH = rect.height || 500;

    const cellSize = Math.floor(Math.min(maxW / mw, maxH / mh));
    const canvasW = cellSize * mw;
    const canvasH = cellSize * mh;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const player = state.players[playerId];
    const px = player ? player.x : 0;
    const py = player ? player.y : 0;

    // Build visibility set (manhattan distance from player)
    const visibleNow = new Set();
    if (state.phase === 'playing' || state.phase === 'ready') {
      for (let dy = -FOG_RADIUS; dy <= FOG_RADIUS; dy++) {
        for (let dx = -FOG_RADIUS; dx <= FOG_RADIUS; dx++) {
          const cx = px + dx;
          const cy = py + dy;
          if (cx >= 0 && cx < mw && cy >= 0 && cy < mh) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist <= FOG_RADIUS) {
              visibleNow.add(`${cx},${cy}`);
              revealedCellsRef.current.add(`${cx},${cy}`);
            }
          }
        }
      }
    }

    // When game is finished, reveal everything
    const isFinished = state.phase === 'finished';

    // Draw cells, walls, and fog
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const cell = maze.cells[y][x];
        const cx = x * cellSize;
        const cy = y * cellSize;
        const key = `${x},${y}`;
        const isVisible = isFinished || visibleNow.has(key);
        const wasRevealed = revealedCellsRef.current.has(key);

        // Draw cell background
        if (isVisible) {
          // Fully visible — dark floor
          ctx.fillStyle = '#0d0d18';
          ctx.fillRect(cx, cy, cellSize, cellSize);
        } else if (wasRevealed) {
          // Previously revealed — dim
          ctx.fillStyle = '#0b0b12';
          ctx.fillRect(cx, cy, cellSize, cellSize);
          // Dim fog overlay
          ctx.fillStyle = REVEALED_DIM;
          ctx.fillRect(cx, cy, cellSize, cellSize);
        } else {
          // Fog of war — hidden
          ctx.fillStyle = BG_COLOR;
          ctx.fillRect(cx, cy, cellSize, cellSize);
          continue; // Don't draw walls for hidden cells
        }

        // Draw walls with glow
        ctx.strokeStyle = WALL_COLOR;
        ctx.lineWidth = WALL_THICKNESS;
        ctx.shadowColor = isVisible ? WALL_GLOW_COLOR : 'rgba(0, 240, 255, 0.15)';
        ctx.shadowBlur = isVisible ? 6 : 2;

        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + cellSize, cy);
          ctx.stroke();
        }
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(cx + cellSize, cy);
          ctx.lineTo(cx + cellSize, cy + cellSize);
          ctx.stroke();
        }
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(cx, cy + cellSize);
          ctx.lineTo(cx + cellSize, cy + cellSize);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx, cy + cellSize);
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }
    }

    // Draw trail breadcrumbs for the player
    if (player && player.visited) {
      for (const [vx, vy] of player.visited) {
        const key = `${vx},${vy}`;
        if (!isFinished && !visibleNow.has(key) && !revealedCellsRef.current.has(key)) continue;
        const dotX = vx * cellSize + cellSize / 2;
        const dotY = vy * cellSize + cellSize / 2;
        const dotR = Math.max(2, cellSize * 0.12);
        ctx.fillStyle = TRAIL_COLOR;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw end goal — pulsing magenta beacon
    const endKey = `${maze.end.x},${maze.end.y}`;
    const endVisible = isFinished || visibleNow.has(endKey) || revealedCellsRef.current.has(endKey);
    if (endVisible) {
      const ex = maze.end.x * cellSize + cellSize / 2;
      const ey = maze.end.y * cellSize + cellSize / 2;
      const endPulse = 0.6 + Math.sin(pulsePhase * 2) * 0.4;
      const endR = cellSize * 0.35 * endPulse;

      // Outer glow
      const grd = ctx.createRadialGradient(ex, ey, 0, ex, ey, cellSize * 0.6);
      grd.addColorStop(0, `rgba(255, 0, 255, ${0.3 * endPulse})`);
      grd.addColorStop(1, 'rgba(255, 0, 255, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(ex, ey, cellSize * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.shadowColor = END_GLOW;
      ctx.shadowBlur = 12;
      ctx.fillStyle = END_COLOR;
      ctx.beginPath();
      ctx.arc(ex, ey, endR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Star/diamond marker
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(10, cellSize * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2726', ex, ey);
    }

    // Draw other players (multiplayer)
    if (state.playerOrder) {
      state.playerOrder.forEach((pid, idx) => {
        if (pid === playerId) return; // draw self last
        const otherPlayer = state.players[pid];
        if (!otherPlayer) return;
        const opx = otherPlayer.x * cellSize + cellSize / 2;
        const opy = otherPlayer.y * cellSize + cellSize / 2;
        const opKey = `${otherPlayer.x},${otherPlayer.y}`;
        if (!isFinished && !visibleNow.has(opKey)) return; // only show if in your vision

        const color = MULTI_PLAYER_COLORS[idx % MULTI_PLAYER_COLORS.length];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(opx, opy, cellSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    // Draw player — pulsing neon green circle
    if (player && !player.finished) {
      const playerPulse = 0.85 + Math.sin(pulsePhase * 3) * 0.15;
      const ppx = px * cellSize + cellSize / 2;
      const ppy = py * cellSize + cellSize / 2;
      const pr = cellSize * 0.3 * playerPulse;

      // Bump shake offset
      let shakeX = 0, shakeY = 0;
      if (wallBumpDir) {
        const shakeAmt = cellSize * 0.08;
        if (wallBumpDir === 'up') shakeY = -shakeAmt;
        if (wallBumpDir === 'down') shakeY = shakeAmt;
        if (wallBumpDir === 'left') shakeX = -shakeAmt;
        if (wallBumpDir === 'right') shakeX = shakeAmt;
      }

      // Glow
      ctx.shadowColor = PLAYER_GLOW;
      ctx.shadowBlur = 15;
      ctx.fillStyle = PLAYER_COLOR;
      ctx.beginPath();
      ctx.arc(ppx + shakeX, ppy + shakeY, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Inner bright core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ppx + shakeX, ppy + shakeY, pr * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (player && player.finished) {
      // Show checkmark at end position
      const ppx = px * cellSize + cellSize / 2;
      const ppy = py * cellSize + cellSize / 2;
      ctx.fillStyle = PLAYER_COLOR;
      ctx.font = `bold ${Math.max(12, cellSize * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = PLAYER_GLOW;
      ctx.shadowBlur = 10;
      ctx.fillText('\u2713', ppx, ppy);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    // Outer border glow
    ctx.strokeStyle = WALL_COLOR;
    ctx.lineWidth = 3;
    ctx.shadowColor = WALL_GLOW_COLOR;
    ctx.shadowBlur = 8;
    ctx.strokeRect(0, 0, canvasW, canvasH);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

  }, [state, playerId, pulsePhase, wallBumpDir]);

  // ============================================================
  // RENDER
  // ============================================================

  // Format time mm:ss
  const formatTime = (seconds) => {
    if (seconds == null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Results data
  const results = state?.phase === 'finished' ? getMazeResults(state) : null;
  const myResult = results?.find(r => r.playerId === playerId);

  // Pre-game: size selector
  if (!state) {
    return (
      <div className="w-full flex flex-col items-center gap-6 py-8">
        <h2 className="text-2xl font-bold text-white">Maze HQ</h2>
        <p className="text-white/50 text-sm text-center max-w-md">
          Navigate through the neon maze to reach the exit.
          Fog of war reveals the path as you explore.
        </p>

        <div className="flex gap-3">
          {['small', 'medium', 'large'].map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                selectedSize === size
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              {size === 'small' ? 'Small (15x15)' : size === 'medium' ? 'Medium (25x25)' : 'Large (35x35)'}
            </button>
          ))}
        </div>

        <div className="text-white/30 text-xs">
          Time: {selectedSize === 'small' ? '60s' : selectedSize === 'medium' ? '120s' : '180s'}
        </div>

        <button
          onClick={() => initSoloGame(selectedSize)}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40"
        >
          Generate Maze
        </button>
      </div>
    );
  }

  // Ready phase — maze generated, waiting to start
  if (state.phase === 'ready') {
    return (
      <div className="w-full flex flex-col items-center gap-6 py-8">
        <h2 className="text-2xl font-bold text-white">Maze HQ</h2>
        <p className="text-white/40 text-sm">
          {state.size === 'small' ? '15x15' : state.size === 'medium' ? '25x25' : '35x35'} maze generated.
          Time limit: {formatTime(state.timeLimit)}
        </p>

        <div
          ref={containerRef}
          className="w-full max-w-[600px] aspect-square"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <button
          onClick={startGame}
          className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-400/40 animate-pulse"
        >
          Start!
        </button>
      </div>
    );
  }

  // Win / Time's Up screen
  if (showResults && state.phase === 'finished') {
    return (
      <div className="w-full flex flex-col items-center gap-6 py-6">
        <div className="text-center">
          {myResult?.finished ? (
            <>
              <div className="text-5xl mb-3">&#127942;</div>
              <h2 className="text-3xl font-bold text-green-400 mb-1">Maze Cleared!</h2>
              <p className="text-white/50 text-sm">You found the exit</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">&#9200;</div>
              <h2 className="text-3xl font-bold text-red-400 mb-1">Time&apos;s Up!</h2>
              <p className="text-white/50 text-sm">The maze defeated you this time</p>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-cyan-400">
              {myResult?.finished ? formatTime(Math.floor((myResult.finishTime || 0) / 1000)) : '--:--'}
            </div>
            <div className="text-white/40 text-xs mt-1">Time</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-cyan-400">
              {myResult?.moves || 0}
            </div>
            <div className="text-white/40 text-xs mt-1">Moves</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-yellow-400">
              {myResult?.score || 0}
            </div>
            <div className="text-white/40 text-xs mt-1">Score</div>
          </div>
        </div>

        {/* Results table (multiplayer) */}
        {results && results.length > 1 && (
          <div className="w-full max-w-sm">
            <h3 className="text-white/60 text-sm font-semibold mb-2">Results</h3>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={r.playerId}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    r.playerId === playerId
                      ? 'bg-cyan-500/10 border-cyan-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-5">#{i + 1}</span>
                    <span className="text-white text-sm font-medium">
                      {r.playerId === playerId ? 'You' : `Player ${i + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {r.finished ? (
                      <>
                        <span className="text-white/60">{formatTime(Math.floor(r.finishTime / 1000))}</span>
                        <span className="text-white/40">{r.moves} moves</span>
                        <span className="text-yellow-400 font-bold">{r.score}</span>
                      </>
                    ) : (
                      <span className="text-red-400/60">DNF</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revealed maze view */}
        <div
          ref={containerRef}
          className="w-full max-w-[500px] aspect-square"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl opacity-60"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <button
          onClick={() => {
            setLocalState(null);
            setShowResults(false);
            setTimeLeft(null);
            revealedCellsRef.current = new Set();
          }}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30"
        >
          Play Again
        </button>
      </div>
    );
  }

  // Active game
  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Top bar — Timer + Moves */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            timeLeft !== null && timeLeft <= 10
              ? 'bg-red-500/20 border border-red-500/40'
              : 'bg-white/5 border border-white/10'
          }`}>
            <span className="text-xs text-white/40">TIME</span>
            <span className={`font-mono font-bold text-sm ${
              timeLeft !== null && timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-400'
            }`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Move counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-xs text-white/40">MOVES</span>
            <span className="font-mono font-bold text-sm text-white">
              {state.players[playerId]?.moves || 0}
            </span>
          </div>
        </div>

        {/* Size badge */}
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-white/40">
            {state.size === 'small' ? '15x15' : state.size === 'medium' ? '25x25' : '35x35'}
          </span>
        </div>
      </div>

      {/* Maze canvas */}
      <div
        ref={containerRef}
        className="w-full flex-1"
        style={{ maxWidth: '600px', aspectRatio: '1 / 1' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-xl"
          style={{ imageRendering: 'pixelated', touchAction: 'none' }}
        />
      </div>

      {/* D-pad for touch devices */}
      {isTouchDevice && (
        <div className="relative w-40 h-40 mt-2 select-none">
          {/* Up */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMove('up'); }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl bg-white/10 active:bg-cyan-500/30 border border-white/20 flex items-center justify-center text-white/70 active:text-cyan-400 transition-colors"
            aria-label="Move up"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 4l6 8H4z" />
            </svg>
          </button>
          {/* Down */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMove('down'); }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl bg-white/10 active:bg-cyan-500/30 border border-white/20 flex items-center justify-center text-white/70 active:text-cyan-400 transition-colors"
            aria-label="Move down"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 16l6-8H4z" />
            </svg>
          </button>
          {/* Left */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMove('left'); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white/10 active:bg-cyan-500/30 border border-white/20 flex items-center justify-center text-white/70 active:text-cyan-400 transition-colors"
            aria-label="Move left"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 10l8-6v12z" />
            </svg>
          </button>
          {/* Right */}
          <button
            onTouchStart={(e) => { e.preventDefault(); handleMove('right'); }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white/10 active:bg-cyan-500/30 border border-white/20 flex items-center justify-center text-white/70 active:text-cyan-400 transition-colors"
            aria-label="Move right"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M16 10l-8 6V4z" />
            </svg>
          </button>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 border border-white/10" />
        </div>
      )}

      {/* Controls hint (desktop) */}
      {!isTouchDevice && (
        <div className="text-white/20 text-xs text-center mt-1">
          Arrow keys or WASD to move
        </div>
      )}
    </div>
  );
}
