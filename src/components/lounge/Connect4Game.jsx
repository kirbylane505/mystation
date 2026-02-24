/**
 * KICKBACK LOUNGE — Connect 4 (Premium Edition)
 * EA Sports-tier visuals: 3D board, glossy discs, sound FX, win particles
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const ROWS = 6;
const COLS = 7;
const CELL = 52; // cell size in px
const GAP = 6;

// ============================================================
// WEB AUDIO — Sound Effects
// ============================================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playDropSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    // Deep thud — disc hitting board
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    // Click layer
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(800, ctx.currentTime);
    click.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    clickGain.gain.setValueAtTime(0.15, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(ctx.currentTime);
    click.stop(ctx.currentTime + 0.08);
  } catch {}
}

function playWinSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  } catch {}
}

// ============================================================
// PARTICLE SYSTEM — Win Celebration
// ============================================================
function WinParticles({ active }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * 2;
    const H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const colors = ['#ef4444', '#facc15', '#3b82f6', '#22c55e', '#f97316', '#a855f7'];
    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: (canvas.offsetWidth) / 2 + (Math.random() - 0.5) * 100,
      y: (canvas.offsetHeight) / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 10 - 4,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: Math.random() * 0.015 + 0.008,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    }));

    function animate() {
      ctx.clearRect(0, 0, W / 2, H / 2);
      let alive = false;
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.life -= p.decay;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        // Confetti shape
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive) animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ============================================================
// 3D GLOSSY DISC — SVG-rendered with radial gradients
// ============================================================
function Disc({ color, glow, isWin, isLast, size = CELL - 8 }) {
  const isRed = color === 'red';
  const baseColor = isRed ? '#dc2626' : '#eab308';
  const lightColor = isRed ? '#fca5a5' : '#fef08a';
  const midColor = isRed ? '#ef4444' : '#facc15';
  const darkColor = isRed ? '#991b1b' : '#a16207';
  const glowColor = isRed ? 'rgba(239,68,68,0.6)' : 'rgba(250,204,21,0.6)';
  const id = isRed ? 'disc-red' : 'disc-yellow';

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={isWin ? 'animate-c4-win' : isLast ? 'animate-c4-drop' : ''}>
      {/* Glow behind disc */}
      {(isWin || glow) && (
        <circle cx="22" cy="22" r="21" fill="none" stroke={glowColor} strokeWidth="3" opacity="0.8">
          {isWin && <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />}
        </circle>
      )}
      {/* Shadow */}
      <ellipse cx="23" cy="24" rx="18" ry="18" fill="rgba(0,0,0,0.3)" />
      {/* Main disc body */}
      <circle cx="22" cy="22" r="18" fill={`url(#${id}-grad)`} />
      {/* Highlight — top-left gloss */}
      <ellipse cx="16" cy="16" rx="10" ry="8" fill={`url(#${id}-gloss)`} />
      {/* Rim light */}
      <circle cx="22" cy="22" r="17" fill="none" stroke={lightColor} strokeWidth="0.5" opacity="0.3" />
      {/* Inner ring for depth */}
      <circle cx="22" cy="22" r="14" fill="none" stroke={darkColor} strokeWidth="0.3" opacity="0.4" />
      <defs>
        <radialGradient id={`${id}-grad`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={lightColor} />
          <stop offset="40%" stopColor={midColor} />
          <stop offset="100%" stopColor={darkColor} />
        </radialGradient>
        <radialGradient id={`${id}-gloss`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ============================================================
// BOARD SLOT — Empty hole with 3D depth
// ============================================================
function EmptySlot({ size = CELL - 8, isHover }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      {/* Hole shadow — creates depth */}
      <circle cx="22" cy="22" r="18" fill="rgba(0,0,0,0.5)" />
      <circle cx="22" cy="22" r="16" fill="rgba(5,15,40,0.9)" />
      {/* Inner ring for bevel */}
      <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <circle cx="22" cy="22" r="15.5" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      {/* Hover highlight */}
      {isHover && (
        <circle cx="22" cy="22" r="16" fill="rgba(255,255,255,0.08)">
          <animate attributeName="opacity" values="0.05;0.12;0.05" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Connect4Game({ gameState, myPlayerId, onMove, players }) {
  const [hoverCol, setHoverCol] = useState(null);
  const [dropping, setDropping] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const prevPhaseRef = useRef(gameState?.phase);

  const { board, playerOrder, currentTurn, phase, winner, winLine, lastMove, moveCount } = gameState;

  const myIndex = playerOrder.indexOf(myPlayerId);
  const isMyTurn = phase === 'playing' && playerOrder[currentTurn] === myPlayerId;
  const opponentId = playerOrder.find(id => id !== myPlayerId);
  const opponentName = players?.find(p => p.user_id === opponentId)?.display_name
    || (opponentId === 'ai_opponent' ? 'CPU' : 'Opponent');
  const myName = players?.find(p => p.user_id === myPlayerId)?.display_name || 'You';
  const currentPlayerIsMe = playerOrder[currentTurn] === myPlayerId;

  // Sound + particles on win
  useEffect(() => {
    if (phase === 'finished' && prevPhaseRef.current !== 'finished') {
      playWinSound();
      setShowWin(true);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  // Sound on drop
  useEffect(() => {
    if (lastMove && moveCount > 0) {
      playDropSound();
    }
  }, [moveCount, lastMove]);

  const handleDrop = useCallback((col) => {
    if (!isMyTurn || dropping || phase !== 'playing') return;
    if (board[0][col] !== null) return;
    setDropping(true);
    onMove('drop', { col });
    setTimeout(() => setDropping(false), 500);
  }, [isMyTurn, dropping, phase, board, onMove]);

  const isWinCell = (r, c) => {
    if (!winLine) return false;
    return winLine.some(cell => cell.r === r && cell.c === c);
  };

  // Board dimensions
  const boardW = COLS * (CELL + GAP) + GAP;
  const boardH = ROWS * (CELL + GAP) + GAP;

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* ── SCOREBOARD ── */}
      <div className="flex items-center justify-between w-full max-w-md mb-5 px-2">
        {/* Player 1 (You) */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
          currentPlayerIsMe && phase === 'playing'
            ? 'bg-red-500/15 border border-red-500/30 shadow-lg shadow-red-500/10'
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className="relative">
            <Disc color="red" size={28} />
            {currentPlayerIsMe && phase === 'playing' && (
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{myName}</div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider">
              {myIndex === 0 ? 'Red' : 'Yellow'}
            </div>
          </div>
        </div>

        {/* VS / Status */}
        <div className="text-center px-3">
          {phase === 'playing' ? (
            <div className="flex flex-col items-center">
              <span className="text-white/20 text-xs font-bold uppercase tracking-widest">VS</span>
              <span className="text-white/50 text-[10px] mt-0.5">Move {moveCount + 1}</span>
            </div>
          ) : phase === 'finished' && winner ? (
            <div className="flex flex-col items-center">
              <span className="text-yellow-400 text-lg">&#x1F3C6;</span>
              <span className="text-yellow-400 text-xs font-bold">
                {winner === myPlayerId ? 'YOU WIN' : 'DEFEATED'}
              </span>
            </div>
          ) : (
            <span className="text-white/40 text-sm font-bold">DRAW</span>
          )}
        </div>

        {/* Player 2 (Opponent) */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
          !currentPlayerIsMe && phase === 'playing'
            ? 'bg-yellow-500/15 border border-yellow-500/30 shadow-lg shadow-yellow-500/10'
            : 'bg-white/5 border border-white/10'
        }`}>
          <div className="relative">
            <Disc color="yellow" size={28} />
            {!currentPlayerIsMe && phase === 'playing' && (
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{opponentName}</div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider">
              {myIndex === 0 ? 'Yellow' : 'Red'}
            </div>
          </div>
        </div>
      </div>

      {/* ── TURN INDICATOR ── */}
      <div className="mb-3 h-7 flex items-center">
        {phase === 'playing' && (
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            isMyTurn
              ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-300 border border-red-500/20'
              : 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 text-yellow-300 border border-yellow-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-red-400' : 'bg-yellow-400'} animate-pulse`} />
            {isMyTurn ? 'Your turn — drop a disc!' : `${opponentName} is thinking...`}
          </div>
        )}
      </div>

      {/* ── BOARD AREA ── */}
      <div className="relative">
        <WinParticles active={showWin} />

        {/* Ghost disc preview above board */}
        <div className="h-12 flex items-end justify-center mb-1" style={{ width: boardW }}>
          {hoverCol !== null && isMyTurn && board[0][hoverCol] === null && (
            <div
              className="transition-all duration-150 ease-out opacity-50"
              style={{
                marginLeft: GAP + hoverCol * (CELL + GAP) + (CELL - 36) / 2,
                position: 'absolute',
              }}
            >
              <Disc color={myIndex === 0 ? 'red' : 'yellow'} size={36} />
            </div>
          )}
        </div>

        {/* ── THE BOARD ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: boardW,
            height: boardH,
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 40%, #172554 100%)',
            boxShadow: `
              0 12px 40px rgba(0,0,0,0.5),
              0 4px 12px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -2px 0 rgba(0,0,0,0.2)
            `,
          }}
        >
          {/* Board texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 58px, rgba(255,255,255,0.02) 58px, rgba(255,255,255,0.02) 59px)',
            }}
          />

          {/* Column hit areas — invisible clickable zones */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: COLS }, (_, c) => (
              <button
                key={`col-${c}`}
                onClick={() => handleDrop(c)}
                onMouseEnter={() => setHoverCol(c)}
                onMouseLeave={() => setHoverCol(null)}
                onTouchStart={() => { setHoverCol(c); handleDrop(c); }}
                disabled={!isMyTurn || board[0][c] !== null}
                className={`h-full w-full z-[5] transition-colors duration-200 ${
                  isMyTurn && board[0][c] === null
                    ? 'cursor-pointer hover:bg-white/[0.04]'
                    : 'cursor-default'
                }`}
                style={{
                  background: hoverCol === c && isMyTurn && board[0][c] === null
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 60%)'
                    : 'transparent',
                }}
                aria-label={`Drop in column ${c + 1}`}
              />
            ))}
          </div>

          {/* Discs + Holes */}
          <div className="relative z-[2] p-0" style={{ padding: GAP }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
                gap: GAP,
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isWin = isWinCell(r, c);
                  const isLast = lastMove && lastMove.row === r && lastMove.col === c;
                  const isHover = hoverCol === c && isMyTurn && board[0][c] === null;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="flex items-center justify-center"
                      style={{ width: CELL, height: CELL }}
                    >
                      {cell !== null ? (
                        <Disc
                          color={cell === 0 ? 'red' : 'yellow'}
                          isWin={isWin}
                          isLast={isLast}
                          size={CELL - 8}
                        />
                      ) : (
                        <EmptySlot size={CELL - 8} isHover={isHover} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Board side bevels */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-black/30 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-white/10 via-transparent to-black/20" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-white/10 via-transparent to-black/20" />
        </div>

        {/* Board stand / base */}
        <div
          className="mx-auto rounded-b-xl"
          style={{
            width: boardW - 20,
            height: 10,
            background: 'linear-gradient(180deg, #1e3a8a 0%, #0f1d42 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      {/* ── COLUMN NUMBERS ── */}
      <div className="flex mt-2" style={{ width: boardW }}>
        {Array.from({ length: COLS }, (_, c) => (
          <div
            key={`num-${c}`}
            className={`text-center text-xs font-mono transition-colors ${
              hoverCol === c ? 'text-white/60' : 'text-white/20'
            }`}
            style={{ width: CELL + GAP, marginLeft: c === 0 ? GAP / 2 : 0 }}
          >
            {c + 1}
          </div>
        ))}
      </div>

      {/* ── ANIMATIONS ── */}
      <style jsx global>{`
        @keyframes c4-drop {
          0% { transform: translateY(-300px); opacity: 0; }
          50% { transform: translateY(6px); opacity: 1; }
          70% { transform: translateY(-3px); }
          85% { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
        @keyframes c4-win {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.12); filter: brightness(1.3); }
        }
        .animate-c4-drop {
          animation: c4-drop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .animate-c4-win {
          animation: c4-win 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
