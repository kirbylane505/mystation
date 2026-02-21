/**
 * KICKBACK LOUNGE — Dominoes Game UI (Premium)
 * Chain display + player hand + draw/pass + Web Audio sound effects
 * Quality level: Pool-game tier
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PLAYER_COLORS } from '@/lib/games/constants';

// ── Web Audio Sound Effects ──

function createAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch { return null; }
}

function playSlam(ctx) {
  if (!ctx) return;
  try {
    // Deep "slam" — low frequency thud like a domino hitting the table
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);

    // Click layer for impact
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(200, ctx.currentTime);
    click.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
    clickGain.gain.setValueAtTime(0.15, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(ctx.currentTime);
    click.stop(ctx.currentTime + 0.08);
  } catch {}
}

function playDraw(ctx) {
  if (!ctx) return;
  try {
    // Soft slide sound — drawing from boneyard
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playPass(ctx) {
  if (!ctx) return;
  try {
    // Dull thud — can't play
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

// ── Domino Dot Pattern ──

function DotPattern({ value, size = 'md' }) {
  const dotSizes = { sm: 3, md: 5, lg: 6, chain: 3 };
  const ds = dotSizes[size] || 5;
  const dotStyle = { width: ds, height: ds, borderRadius: '50%', backgroundColor: '#fff' };
  const emptyStyle = { width: ds, height: ds };

  const dot = <div style={dotStyle} />;
  const empty = <div style={emptyStyle} />;

  const patterns = {
    0: [empty, empty, empty, empty, empty, empty, empty, empty, empty],
    1: [empty, empty, empty, empty, dot, empty, empty, empty, empty],
    2: [empty, empty, dot, empty, empty, empty, dot, empty, empty],
    3: [empty, empty, dot, empty, dot, empty, dot, empty, empty],
    4: [dot, empty, dot, empty, empty, empty, dot, empty, dot],
    5: [dot, empty, dot, empty, dot, empty, dot, empty, dot],
    6: [dot, empty, dot, dot, empty, dot, dot, empty, dot],
  };

  const gap = size === 'chain' ? 1 : 2;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(3, ${ds}px)`,
      gap: `${gap}px`,
      padding: size === 'chain' ? 2 : 3,
    }}>
      {(patterns[value] || patterns[0]).map((el, i) => (
        <div key={i}>{el}</div>
      ))}
    </div>
  );
}

// ── Single Domino Tile (Hand) ──

function DominoTile({ tile, onClick, selected, disabled, playable }) {
  const isDouble = tile.a === tile.b;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group"
      style={{
        width: 56,
        height: 112,
        borderRadius: 10,
        border: selected
          ? '3px solid #facc15'
          : playable
          ? '2px solid rgba(250,204,21,0.4)'
          : '2px solid rgba(255,255,255,0.1)',
        background: selected
          ? 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)'
          : disabled
          ? 'rgba(255,255,255,0.02)'
          : 'linear-gradient(145deg, #1a1a2e 0%, #0f1629 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transform: selected
          ? 'scale(1.12) translateY(-12px)'
          : playable && !disabled
          ? 'scale(1)'
          : 'scale(0.95)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: selected
          ? '0 8px 24px rgba(250,204,21,0.3), 0 0 0 1px rgba(250,204,21,0.2)'
          : playable
          ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.transform = 'scale(1.08) translateY(-8px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.transform = playable ? 'scale(1)' : 'scale(0.95)';
        }
      }}
    >
      {/* Double indicator glow */}
      {isDouble && (
        <div style={{
          position: 'absolute',
          inset: -1,
          borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(250,204,21,0.1), transparent)',
          pointerEvents: 'none',
        }} />
      )}
      {/* Top half */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DotPattern value={tile.a} size="md" />
      </div>
      {/* Divider line */}
      <div style={{
        width: '70%',
        height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
      }} />
      {/* Bottom half */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DotPattern value={tile.b} size="md" />
      </div>
    </button>
  );
}

// ── Chain Tile (Horizontal on table) ──

function ChainTile({ tile, isLast, animateIn }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 36,
        borderRadius: 6,
        border: isLast ? '2px solid rgba(250,204,21,0.5)' : '1px solid rgba(255,255,255,0.15)',
        background: isLast
          ? 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(30,30,60,0.9))'
          : 'linear-gradient(135deg, rgba(26,26,46,0.9), rgba(15,22,41,0.9))',
        boxShadow: isLast
          ? '0 0 12px rgba(250,204,21,0.15)'
          : '0 2px 6px rgba(0,0,0,0.3)',
        animation: animateIn ? 'dominoSlam 0.3s ease-out' : 'none',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 28,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <DotPattern value={tile.a} size="chain" />
      </div>
      <div style={{
        width: 1,
        height: '60%',
        background: 'rgba(255,255,255,0.2)',
      }} />
      <div style={{
        width: 28,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <DotPattern value={tile.b} size="chain" />
      </div>
    </div>
  );
}

// ── Main Dominoes Game Component ──

export default function DominoesGame({ gameState, myPlayerId, onMove, players }) {
  const [selectedTile, setSelectedTile] = useState(null);
  const audioCtxRef = useRef(null);
  const prevChainLenRef = useRef(0);

  // Initialize audio context on first interaction
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

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const currentPlayerName = players?.find(p => p.user_id === gameState.currentPlayerId)?.display_name || 'Player';
  const myHand = gameState.myHand || [];
  const chain = gameState.chain || [];
  const isFirstMove = chain.length === 0;

  // Check what tiles are playable
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
      playSlam(audioCtxRef.current);
      onMove('play', { tileId: tile.id, end: 'right' });
      setSelectedTile(null);
      return;
    }

    const matchesLeft = tile.a === gameState.leftEnd || tile.b === gameState.leftEnd;
    const matchesRight = tile.a === gameState.rightEnd || tile.b === gameState.rightEnd;

    if (matchesLeft && matchesRight && gameState.leftEnd !== gameState.rightEnd) {
      setSelectedTile(selectedTile?.id === tile.id ? null : tile);
    } else if (matchesLeft) {
      playSlam(audioCtxRef.current);
      onMove('play', { tileId: tile.id, end: 'left' });
      setSelectedTile(null);
    } else {
      playSlam(audioCtxRef.current);
      onMove('play', { tileId: tile.id, end: 'right' });
      setSelectedTile(null);
    }
  };

  const handlePlayEnd = (end) => {
    ensureAudio();
    if (selectedTile) {
      playSlam(audioCtxRef.current);
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

  // My pip count
  const myPipCount = myHand.reduce((sum, t) => sum + t.a + t.b, 0);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* CSS for domino slam animation */}
      <style>{`
        @keyframes dominoSlam {
          0% { transform: scale(0.5) translateY(-20px); opacity: 0; }
          60% { transform: scale(1.1) translateY(2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(250,204,21,0.2); }
          50% { box-shadow: 0 0 20px rgba(250,204,21,0.4); }
        }
      `}</style>

      {/* Turn indicator */}
      <div className="text-center">
        {isMyTurn ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <p className="text-yellow-400 font-bold text-lg">Your Turn!</p>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          </div>
        ) : (
          <p className="text-white/50 text-sm">
            Waiting for <span className="text-white font-medium">{currentPlayerName}</span>...
          </p>
        )}
      </div>

      {/* Player info bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {gameState.playerOrder.map((pid, idx) => {
          const player = players?.find(p => p.user_id === pid);
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const count = pid === myPlayerId ? myHand.length : (gameState.handCounts[pid] || 0);
          const isCurrent = pid === gameState.currentPlayerId;
          const isMe = pid === myPlayerId;

          return (
            <div
              key={pid}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
              style={{
                background: isCurrent
                  ? 'rgba(250,204,21,0.08)'
                  : 'rgba(255,255,255,0.03)',
                border: isCurrent
                  ? '1px solid rgba(250,204,21,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
                animation: isCurrent ? 'pulseGlow 2s infinite' : 'none',
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className={`text-sm font-medium ${isMe ? 'text-blue-400' : 'text-white/70'}`}>
                {isMe ? 'You' : (player?.display_name || 'Player')}
              </span>
              <span className="text-white/30 text-xs">{count} tiles</span>
            </div>
          );
        })}
        {/* Boneyard counter */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}>
          <span className="text-purple-400/70 text-xs font-medium">
            Boneyard: {gameState.boneyardCount}
          </span>
        </div>
      </div>

      {/* Chain display — the table */}
      <div
        className="w-full rounded-2xl py-6 px-4 overflow-x-auto"
        style={{
          background: 'linear-gradient(145deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
          border: '2px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
          minHeight: 80,
        }}
      >
        <div className="flex items-center justify-center gap-1.5 min-w-min">
          {chain.length === 0 ? (
            <div className="text-white/15 text-sm italic py-4">
              Play the first domino to start the chain...
            </div>
          ) : (
            <>
              {/* Left end value */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#60a5fa',
                  flexShrink: 0,
                }}
              >
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

              {/* Right end value */}
              <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34d399',
                  flexShrink: 0,
                }}
              >
                {gameState.rightEnd}
              </div>
            </>
          )}
        </div>
      </div>

      {/* End picker overlay */}
      {selectedTile && (
        <div className="flex items-center gap-3 p-4 rounded-2xl" style={{
          background: 'rgba(250,204,21,0.05)',
          border: '1px solid rgba(250,204,21,0.2)',
        }}>
          <span className="text-white/60 text-sm">
            [{selectedTile.a}|{selectedTile.b}] matches both ends:
          </span>
          <button
            onClick={() => handlePlayEnd('left')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#60a5fa',
            }}
          >
            Left ({gameState.leftEnd})
          </button>
          <button
            onClick={() => handlePlayEnd('right')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#34d399',
            }}
          >
            Right ({gameState.rightEnd})
          </button>
          <button
            onClick={() => setSelectedTile(null)}
            className="px-3 py-2.5 rounded-xl text-white/30 text-xs hover:text-white/60 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* My hand */}
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 mb-3">
          <p className="text-white/30 text-xs">Your Hand</p>
          <span className="text-white/20 text-xs">|</span>
          <p className="text-white/25 text-xs">{myHand.length} tiles</p>
          <span className="text-white/20 text-xs">|</span>
          <p className="text-white/25 text-xs">{myPipCount} pips</p>
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

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        {canDraw && (
          <button
            onClick={handleDraw}
            className="px-8 py-3.5 rounded-2xl font-black text-base transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
            }}
          >
            Draw from Boneyard
          </button>
        )}
        {canPass && (
          <button
            onClick={handlePass}
            className="px-8 py-3.5 rounded-2xl font-bold text-base transition-all hover:scale-105"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
            }}
          >
            Pass
          </button>
        )}
        {isMyTurn && playableTileIds.size > 0 && !selectedTile && (
          <p className="text-yellow-400/40 text-xs animate-pulse">Click a highlighted tile to play</p>
        )}
        {!isMyTurn && (
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
            Waiting...
          </div>
        )}
      </div>

      {/* Last play info */}
      {gameState.lastPlay && (
        <div className="text-center text-xs text-white/30">
          {gameState.lastPlay.action === 'play' && gameState.lastPlay.tile && (
            <p>
              Last play: [{gameState.lastPlay.tile.a}|{gameState.lastPlay.tile.b}] on {gameState.lastPlay.end} end
            </p>
          )}
          {gameState.lastPlay.action === 'draw' && (
            <p className="text-purple-400/50">Drew from boneyard</p>
          )}
          {gameState.lastPlay.action === 'pass' && (
            <p className="text-red-400/50">Passed (no playable tiles)</p>
          )}
        </div>
      )}
    </div>
  );
}
