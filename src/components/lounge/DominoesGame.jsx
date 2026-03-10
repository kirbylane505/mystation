/**
 * KICKBACK LOUNGE — Dominoes Game UI (8K PREMIUM)
 * "Real dominoes at grandma's kitchen table"
 * Warm wood table, ivory bone tiles, realistic dots, slam animations
 * Web Audio bone-on-wood sound effects
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PLAYER_COLORS } from '@/lib/games/constants';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

// ═══════════════════════════════════════════════════
// COLORS & THEME — Grandma's Kitchen Table
// ═══════════════════════════════════════════════════
const WOOD_DARK = '#5c3a1e';
const WOOD_MID = '#7a4f2b';
const WOOD_LIGHT = '#96663a';
const WOOD_HIGHLIGHT = '#b8824e';
const IVORY = '#f5f0e1';
const IVORY_DARK = '#e8dcc8';
const IVORY_SHADOW = '#d4c5a9';
const DOT_COLOR = '#1a1209';
const GOLD_WARM = '#d4a23a';
const GOLD_GLOW = '#f0c55e';
const GREEN_FELT = '#2d5a3a';

// ═══════════════════════════════════════════════════
// WEB AUDIO — Bone-on-Wood Sound Effects
// ═══════════════════════════════════════════════════

function createAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch { return null; }
}

function playSlam(ctx) {
  if (!ctx) return;
  try {
    // Deep table thud — heavy bone hitting solid wood
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);

    // Bone crack/click — ivory impact
    const crack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(800, ctx.currentTime);
    crack.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.03);
    crackGain.gain.setValueAtTime(0.12, ctx.currentTime);
    crackGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    crack.connect(crackGain);
    crackGain.connect(ctx.destination);
    crack.start(ctx.currentTime);
    crack.stop(ctx.currentTime + 0.06);

    // Wood resonance
    const res = ctx.createOscillator();
    const resGain = ctx.createGain();
    res.type = 'sine';
    res.frequency.setValueAtTime(150, ctx.currentTime + 0.02);
    res.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
    resGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.02);
    resGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    res.connect(resGain);
    resGain.connect(ctx.destination);
    res.start(ctx.currentTime + 0.02);
    res.stop(ctx.currentTime + 0.35);
  } catch {}
}

function playDoubleSlam(ctx) {
  if (!ctx) return;
  try {
    // Extra loud slam for doubles — bone crashing down
    playSlam(ctx);
    // Extra bass thump
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(50, ctx.currentTime);
    bass.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.3);
    bassGain.gain.setValueAtTime(0.35, ctx.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(ctx.currentTime);
    bass.stop(ctx.currentTime + 0.4);
  } catch {}
}

function playDraw(ctx) {
  if (!ctx) return;
  try {
    // Tiles sliding across wood — scraping sound
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.08;
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
  } catch {}
}

function playPass(ctx) {
  if (!ctx) return;
  try {
    // Soft knock — knuckle tap on table
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

function playWin(ctx) {
  if (!ctx) return;
  try {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch {}
}

// ═══════════════════════════════════════════════════
// REALISTIC DOT PATTERN — Ivory tile with inset dots
// ═══════════════════════════════════════════════════

function RealisticDots({ value, size = 'hand' }) {
  // Dot positions in a 3x3 grid (0-8), mapped to standard domino pip layouts
  const layouts = {
    0: [],
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const dims = {
    hand: { cell: 10, dot: 6, gap: 2, pad: 3 },
    chain: { cell: 6, dot: 3.5, gap: 1, pad: 2 },
    mini: { cell: 4, dot: 2.5, gap: 1, pad: 1 },
  };

  const d = dims[size] || dims.hand;
  const positions = layouts[value] || [];
  const totalSize = d.cell * 3 + d.gap * 2 + d.pad * 2;

  return (
    <div style={{
      width: totalSize,
      height: totalSize,
      position: 'relative',
    }}>
      {positions.map((pos) => {
        const row = Math.floor(pos / 3);
        const col = pos % 3;
        const x = d.pad + col * (d.cell + d.gap) + (d.cell - d.dot) / 2;
        const y = d.pad + row * (d.cell + d.gap) + (d.cell - d.dot) / 2;

        return (
          <div
            key={pos}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: d.dot,
              height: d.dot,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${DOT_COLOR}, #302010)`,
              boxShadow: size === 'hand'
                ? `inset 0 1px 2px rgba(0,0,0,0.6), 0 0.5px 0 rgba(255,255,255,0.15)`
                : `inset 0 0.5px 1px rgba(0,0,0,0.5)`,
            }}
          />
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DOMINO TILE — Hand (Standing, Ivory Bone)
// ═══════════════════════════════════════════════════

function DominoTile({ tile, onClick, selected, disabled, playable }) {
  const isDouble = tile.a === tile.b;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group"
      style={{
        width: 60,
        height: 120,
        borderRadius: 8,
        border: 'none',
        background: selected
          ? `linear-gradient(165deg, #fff8e8 0%, ${IVORY} 30%, ${IVORY_DARK} 70%, ${IVORY_SHADOW} 100%)`
          : disabled
          ? `linear-gradient(165deg, ${IVORY_SHADOW} 0%, #c8b89a 100%)`
          : `linear-gradient(165deg, #fffdf5 0%, ${IVORY} 25%, ${IVORY_DARK} 75%, ${IVORY_SHADOW} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transform: selected
          ? 'scale(1.15) translateY(-16px) rotateX(5deg)'
          : playable && !disabled
          ? 'scale(1.02) translateY(-2px)'
          : 'scale(0.95)',
        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: selected
          ? `0 12px 32px rgba(0,0,0,0.5), 0 0 0 3px ${GOLD_WARM}, 0 0 20px rgba(212,162,58,0.3), inset 0 1px 0 rgba(255,255,255,0.8)`
          : playable
          ? `0 6px 20px rgba(0,0,0,0.4), 0 0 0 2px rgba(212,162,58,0.5), inset 0 1px 0 rgba(255,255,255,0.6)`
          : `0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)`,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.transform = 'scale(1.1) translateY(-10px)';
          e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.45), 0 0 0 2px ${GOLD_WARM}, inset 0 1px 0 rgba(255,255,255,0.7)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.transform = playable ? 'scale(1.02) translateY(-2px)' : 'scale(0.95)';
          e.currentTarget.style.boxShadow = playable
            ? `0 6px 20px rgba(0,0,0,0.4), 0 0 0 2px rgba(212,162,58,0.5), inset 0 1px 0 rgba(255,255,255,0.6)`
            : `0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)`;
        }
      }}
    >
      {/* Beveled edge highlight */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.3)',
        borderBottom: '1px solid rgba(0,0,0,0.15)',
        borderRight: '1px solid rgba(0,0,0,0.1)',
        pointerEvents: 'none',
      }} />

      {/* Double indicator — gold shimmer */}
      {isDouble && !disabled && (
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 9,
          background: `linear-gradient(135deg, rgba(212,162,58,0.15), transparent 40%, transparent 60%, rgba(212,162,58,0.1))`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Top half */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RealisticDots value={tile.a} size="hand" />
      </div>

      {/* Center divider — engraved line */}
      <div style={{
        width: '75%',
        height: 2,
        background: `linear-gradient(90deg, transparent, ${IVORY_SHADOW}, rgba(139,109,74,0.5), ${IVORY_SHADOW}, transparent)`,
        borderRadius: 1,
        boxShadow: '0 1px 0 rgba(255,255,255,0.3)',
      }} />

      {/* Bottom half */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RealisticDots value={tile.b} size="hand" />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════
// CHAIN TILE — Flat on the table (Horizontal Bone)
// ═══════════════════════════════════════════════════

function ChainTile({ tile, isLast, animateIn }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 32,
        borderRadius: 4,
        background: isLast
          ? `linear-gradient(165deg, #fffdf5 0%, ${IVORY} 40%, ${IVORY_DARK} 100%)`
          : `linear-gradient(165deg, ${IVORY} 0%, ${IVORY_DARK} 60%, ${IVORY_SHADOW} 100%)`,
        boxShadow: isLast
          ? `0 3px 12px rgba(0,0,0,0.4), 0 0 8px rgba(212,162,58,0.3), inset 0 1px 0 rgba(255,255,255,0.5)`
          : `0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)`,
        border: isLast
          ? `1.5px solid ${GOLD_WARM}`
          : '1px solid rgba(180,160,130,0.4)',
        animation: animateIn ? 'dominoSlam 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Bevel */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 4,
        border: '0.5px solid rgba(255,255,255,0.25)',
        borderBottom: '0.5px solid rgba(0,0,0,0.1)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 24,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <RealisticDots value={tile.a} size="chain" />
      </div>
      <div style={{
        width: 1,
        height: '55%',
        background: `linear-gradient(180deg, transparent, rgba(139,109,74,0.4), transparent)`,
      }} />
      <div style={{
        width: 24,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <RealisticDots value={tile.b} size="chain" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BONEYARD PILE — Stacked tiles visual
// ═══════════════════════════════════════════════════

function BoneyardPile({ count }) {
  if (count <= 0) return null;
  const layers = Math.min(count, 5);

  return (
    <div style={{ position: 'relative', width: 40, height: 28 }}>
      {Array.from({ length: layers }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i * 1.5,
            top: (layers - 1 - i) * 2,
            width: 30,
            height: 18,
            borderRadius: 3,
            background: `linear-gradient(165deg, ${IVORY_DARK}, ${IVORY_SHADOW})`,
            border: '0.5px solid rgba(180,160,130,0.3)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      ))}
      <div style={{
        position: 'absolute',
        bottom: -16,
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontSize: 10,
        fontWeight: 700,
        color: IVORY_SHADOW,
        letterSpacing: '0.05em',
      }}>
        {count}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN DOMINOES GAME COMPONENT
// ═══════════════════════════════════════════════════

export default function DominoesGame({ gameState, myPlayerId, onMove, players }) {
  const { showGuide, closeGuide } = useAutoShowGuide('dominoes');
  const [selectedTile, setSelectedTile] = useState(null);
  const audioCtxRef = useRef(null);
  const prevChainLenRef = useRef(0);
  const prevPhaseRef = useRef(null);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  // Play slam sound when chain grows
  useEffect(() => {
    const chainLen = gameState?.chain?.length || 0;
    if (chainLen > prevChainLenRef.current && prevChainLenRef.current > 0) {
      playSlam(audioCtxRef.current);
    }
    prevChainLenRef.current = chainLen;
  }, [gameState?.chain?.length]);

  // Play win sound
  useEffect(() => {
    if (gameState?.phase === 'finished' && prevPhaseRef.current === 'playing') {
      playWin(audioCtxRef.current);
    }
    prevPhaseRef.current = gameState?.phase;
  }, [gameState?.phase]);

  // AI auto-play — send ai_move to server (server has full state + AI hand)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'playing') return;
    const currentPid = gameState.currentPlayerId;
    if (!currentPid?.startsWith?.('ai_')) return;

    const timer = setTimeout(() => {
      if (onMove) onMove('ai_move', {});
    }, 800 + Math.random() * 700);
    return () => clearTimeout(timer);
  }, [gameState?.currentPlayerId, gameState?.turnCount, gameState?.phase, onMove]);

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const isBotTurn = gameState.currentPlayerId?.startsWith?.('ai_');
  const currentPlayerName = isBotTurn ? 'CPU'
    : (players?.find(p => p.user_id === gameState.currentPlayerId)?.display_name || 'Player');
  const myHand = gameState.myHand || [];
  const chain = gameState.chain || [];
  const isFirstMove = chain.length === 0;

  // Check playable tiles
  const playableTileIds = new Set();
  if (isMyTurn) {
    for (const tile of myHand) {
      if (isFirstMove) {
        playableTileIds.add(tile.id);
      } else if (
        tile.a === gameState.leftEnd || tile.b === gameState.leftEnd ||
        tile.a === gameState.rightEnd || tile.b === gameState.rightEnd
      ) {
        playableTileIds.add(tile.id);
      }
    }
  }

  const canDraw = isMyTurn && playableTileIds.size === 0 && gameState.boneyardCount > 0;
  const canPass = isMyTurn && playableTileIds.size === 0 && gameState.boneyardCount === 0;

  const handleTileClick = (tile) => {
    ensureAudio();
    if (!isMyTurn || !playableTileIds.has(tile.id)) return;

    if (isFirstMove) {
      const isDoub = tile.a === tile.b;
      isDoub ? playDoubleSlam(audioCtxRef.current) : playSlam(audioCtxRef.current);
      onMove('play', { tileId: tile.id, end: 'right' });
      setSelectedTile(null);
      return;
    }

    const matchesLeft = tile.a === gameState.leftEnd || tile.b === gameState.leftEnd;
    const matchesRight = tile.a === gameState.rightEnd || tile.b === gameState.rightEnd;

    if (matchesLeft && matchesRight && gameState.leftEnd !== gameState.rightEnd) {
      setSelectedTile(selectedTile?.id === tile.id ? null : tile);
    } else if (matchesLeft) {
      tile.a === tile.b ? playDoubleSlam(audioCtxRef.current) : playSlam(audioCtxRef.current);
      onMove('play', { tileId: tile.id, end: 'left' });
      setSelectedTile(null);
    } else {
      tile.a === tile.b ? playDoubleSlam(audioCtxRef.current) : playSlam(audioCtxRef.current);
      onMove('play', { tileId: tile.id, end: 'right' });
      setSelectedTile(null);
    }
  };

  const handlePlayEnd = (end) => {
    ensureAudio();
    if (selectedTile) {
      selectedTile.a === selectedTile.b ? playDoubleSlam(audioCtxRef.current) : playSlam(audioCtxRef.current);
      onMove('play', { tileId: selectedTile.id, end });
      setSelectedTile(null);
    }
  };

  const handleDraw = () => {
    ensureAudio();
    playDraw(audioCtxRef.current);
    onMove('draw');
  };

  const handlePass = () => {
    ensureAudio();
    playPass(audioCtxRef.current);
    onMove('pass');
  };

  const myPipCount = myHand.reduce((sum, t) => sum + t.a + t.b, 0);

  return (
    <div
      className="w-full flex flex-col items-center gap-4 relative"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(255,200,100,0.06), transparent 70%),
          linear-gradient(180deg, #0d0d0d 0%, #1a1108 100%)
        `,
        borderRadius: 20,
        padding: '20px 16px',
      }}
    >
      {showGuide && <HowToPlayModal gameId="dominoes" isOpen={showGuide} onClose={closeGuide} />}
      <HelpButton gameId="dominoes" className="absolute top-3 right-3 z-10" />

      {/* Animations */}
      <style>{`
        @keyframes dominoSlam {
          0% { transform: scale(0.3) translateY(-30px) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.15) translateY(3px) rotate(1deg); }
          70% { transform: scale(0.97) translateY(-1px) rotate(0deg); }
          100% { transform: scale(1) translateY(0) rotate(0deg); opacity: 1; }
        }
        @keyframes tableShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
        }
        @keyframes turnPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(212,162,58,0.2); }
          50% { box-shadow: 0 0 20px rgba(212,162,58,0.4); }
        }
        @keyframes warmGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      {/* ── Turn Indicator ── */}
      <div className="text-center">
        {isMyTurn ? (
          <div className="flex items-center gap-3">
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: GOLD_WARM,
              animation: 'warmGlow 1.5s ease-in-out infinite',
              boxShadow: `0 0 8px ${GOLD_WARM}`,
            }} />
            <p style={{
              color: GOLD_WARM,
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: '-0.02em',
              textShadow: `0 0 20px rgba(212,162,58,0.3)`,
            }}>
              Your Turn
            </p>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: GOLD_WARM,
              animation: 'warmGlow 1.5s ease-in-out infinite 0.75s',
              boxShadow: `0 0 8px ${GOLD_WARM}`,
            }} />
          </div>
        ) : (
          <p style={{ color: 'rgba(245,240,225,0.4)', fontSize: 13 }}>
            Waiting for <span style={{ color: IVORY, fontWeight: 600 }}>{currentPlayerName}</span>...
          </p>
        )}
      </div>

      {/* ── Player Info Bar ── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {gameState.playerOrder.map((pid, idx) => {
          const player = players?.find(p => p.user_id === pid);
          const count = pid === myPlayerId ? myHand.length : (gameState.handCounts[pid] || 0);
          const isCurrent = pid === gameState.currentPlayerId;
          const isMe = pid === myPlayerId;

          return (
            <div
              key={pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 12,
                background: isCurrent
                  ? `rgba(212,162,58,0.1)`
                  : 'rgba(245,240,225,0.03)',
                border: isCurrent
                  ? `1px solid rgba(212,162,58,0.35)`
                  : '1px solid rgba(245,240,225,0.06)',
                animation: isCurrent ? 'turnPulse 2s infinite' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Domino-style player marker */}
              <div style={{
                width: 10, height: 18, borderRadius: 2,
                background: `linear-gradient(165deg, ${IVORY}, ${IVORY_SHADOW})`,
                border: `1.5px solid ${PLAYER_COLORS[idx % PLAYER_COLORS.length]}`,
                boxShadow: `0 1px 3px rgba(0,0,0,0.3)`,
              }} />
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: isMe ? GOLD_WARM : 'rgba(245,240,225,0.6)',
              }}>
                {isMe ? 'You' : (player?.display_name || (pid.startsWith('ai_') ? 'CPU' : 'Player'))}
              </span>
              <span style={{
                fontSize: 11,
                color: 'rgba(245,240,225,0.25)',
                fontWeight: 500,
              }}>
                {count}
              </span>
            </div>
          );
        })}

        {/* Boneyard */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 12,
          background: 'rgba(93,62,35,0.12)',
          border: '1px solid rgba(93,62,35,0.25)',
        }}>
          <BoneyardPile count={gameState.boneyardCount} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: WOOD_HIGHLIGHT,
            marginLeft: gameState.boneyardCount > 0 ? 8 : 0,
          }}>
            Boneyard
          </span>
        </div>
      </div>

      {/* ── THE TABLE — Wood grain surface with chain ── */}
      <div
        className="w-full overflow-x-auto"
        style={{
          borderRadius: 16,
          padding: '24px 16px',
          minHeight: 90,
          background: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              rgba(0,0,0,0.03) 40px,
              rgba(0,0,0,0.03) 41px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 97px,
              rgba(0,0,0,0.05) 97px,
              rgba(0,0,0,0.05) 98px
            ),
            linear-gradient(175deg,
              ${WOOD_LIGHT} 0%,
              ${WOOD_MID} 25%,
              ${WOOD_DARK} 50%,
              ${WOOD_MID} 75%,
              ${WOOD_LIGHT} 100%
            )
          `,
          border: `3px solid ${WOOD_DARK}`,
          boxShadow: `
            inset 0 2px 8px rgba(0,0,0,0.3),
            inset 0 -2px 8px rgba(0,0,0,0.2),
            0 4px 20px rgba(0,0,0,0.4),
            0 0 0 1px rgba(255,200,100,0.05)
          `,
          position: 'relative',
        }}
      >
        {/* Warm overhead light effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '40%',
          background: 'radial-gradient(ellipse, rgba(255,200,100,0.08), transparent)',
          pointerEvents: 'none',
        }} />

        <div className="flex items-center justify-center gap-1 min-w-min">
          {chain.length === 0 ? (
            <div style={{
              color: 'rgba(245,240,225,0.2)',
              fontSize: 14,
              fontStyle: 'italic',
              padding: '16px 0',
              fontFamily: 'Georgia, serif',
            }}>
              Play the first bone to start...
            </div>
          ) : (
            <>
              {/* Left end marker */}
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900,
                background: `rgba(59,130,246,0.15)`,
                border: `1.5px solid rgba(59,130,246,0.4)`,
                color: '#60a5fa',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}>
                {gameState.leftEnd}
              </div>

              {chain.map((tile, i) => (
                <ChainTile
                  key={`${tile.id}-${i}`}
                  tile={tile}
                  isLast={i === chain.length - 1 && gameState.lastPlay?.action === 'play'}
                  animateIn={i === chain.length - 1}
                />
              ))}

              {/* Right end marker */}
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900,
                background: `rgba(16,185,129,0.15)`,
                border: `1.5px solid rgba(16,185,129,0.4)`,
                color: '#34d399',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}>
                {gameState.rightEnd}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── End Picker (when tile matches both ends) ── */}
      {selectedTile && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          borderRadius: 16,
          background: `rgba(212,162,58,0.06)`,
          border: `1px solid rgba(212,162,58,0.2)`,
        }}>
          <span style={{ color: 'rgba(245,240,225,0.5)', fontSize: 13, fontWeight: 500 }}>
            [{selectedTile.a}|{selectedTile.b}] plays both ends:
          </span>
          <button
            onClick={() => handlePlayEnd('left')}
            style={{
              padding: '8px 20px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              background: 'rgba(59,130,246,0.12)',
              border: '1.5px solid rgba(59,130,246,0.35)',
              color: '#60a5fa',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Left ({gameState.leftEnd})
          </button>
          <button
            onClick={() => handlePlayEnd('right')}
            style={{
              padding: '8px 20px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 800,
              background: 'rgba(16,185,129,0.12)',
              border: '1.5px solid rgba(16,185,129,0.35)',
              color: '#34d399',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Right ({gameState.rightEnd})
          </button>
          <button
            onClick={() => setSelectedTile(null)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              fontSize: 11,
              color: 'rgba(245,240,225,0.3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── MY HAND ── */}
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{
            width: 20, height: 1,
            background: `linear-gradient(90deg, transparent, rgba(212,162,58,0.3))`,
          }} />
          <p style={{
            color: 'rgba(245,240,225,0.3)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Your Hand
          </p>
          <span style={{ color: 'rgba(245,240,225,0.15)', fontSize: 11 }}>|</span>
          <p style={{ color: 'rgba(245,240,225,0.2)', fontSize: 11, fontWeight: 500 }}>
            {myHand.length} bones
          </p>
          <span style={{ color: 'rgba(245,240,225,0.15)', fontSize: 11 }}>|</span>
          <p style={{ color: 'rgba(245,240,225,0.2)', fontSize: 11, fontWeight: 500 }}>
            {myPipCount} pips
          </p>
          <div style={{
            width: 20, height: 1,
            background: `linear-gradient(90deg, rgba(212,162,58,0.3), transparent)`,
          }} />
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {myHand.map((tile) => {
            const isPlayable = playableTileIds.has(tile.id);
            const isSelected = selectedTile?.id === tile.id;

            return (
              <DominoTile
                key={tile.id}
                tile={tile}
                onClick={() => handleTileClick(tile)}
                selected={isSelected}
                disabled={!isMyTurn || !isPlayable}
                playable={isPlayable && isMyTurn}
              />
            );
          })}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex items-center gap-4">
        {canDraw && (
          <button
            onClick={handleDraw}
            style={{
              padding: '12px 28px',
              borderRadius: 16,
              fontWeight: 900,
              fontSize: 14,
              background: `linear-gradient(135deg, ${WOOD_MID}, ${WOOD_DARK})`,
              color: IVORY,
              border: `2px solid ${WOOD_HIGHLIGHT}`,
              boxShadow: `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`;
            }}
          >
            Draw from Boneyard
          </button>
        )}
        {canPass && (
          <button
            onClick={handlePass}
            style={{
              padding: '12px 28px',
              borderRadius: 16,
              fontWeight: 800,
              fontSize: 14,
              background: 'rgba(220,80,60,0.08)',
              color: '#f87171',
              border: '1.5px solid rgba(220,80,60,0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Pass
          </button>
        )}
        {isMyTurn && playableTileIds.size > 0 && !selectedTile && (
          <p style={{
            color: `rgba(212,162,58,0.4)`,
            fontSize: 12,
            animation: 'warmGlow 2s ease-in-out infinite',
          }}>
            Tap a highlighted bone to play
          </p>
        )}
        {!isMyTurn && !isBotTurn && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(245,240,225,0.2)',
            fontSize: 12,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(245,240,225,0.2)',
              animation: 'warmGlow 1.5s ease-in-out infinite',
            }} />
            Waiting...
          </div>
        )}
        {isBotTurn && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(245,240,225,0.25)',
            fontSize: 12,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(212,162,58,0.4)',
              animation: 'warmGlow 1s ease-in-out infinite',
            }} />
            CPU thinking...
          </div>
        )}
      </div>

      {/* ── Last Play Info ── */}
      {gameState.lastPlay && (
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'rgba(245,240,225,0.25)',
          fontStyle: 'italic',
        }}>
          {gameState.lastPlay.action === 'play' && gameState.lastPlay.tile && (
            <p>
              Last: [{gameState.lastPlay.tile.a}|{gameState.lastPlay.tile.b}] on {gameState.lastPlay.end}
            </p>
          )}
          {gameState.lastPlay.action === 'draw' && (
            <p style={{ color: WOOD_HIGHLIGHT }}>Drew from boneyard</p>
          )}
          {gameState.lastPlay.action === 'pass' && (
            <p style={{ color: '#f87171' }}>Passed</p>
          )}
        </div>
      )}
    </div>
  );
}
