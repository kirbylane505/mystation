/**
 * KICKBACK LOUNGE — 8-Ball Pool Game
 * Canvas-based 2-player billiards with physics
 * Drag from cue ball to aim & set power, release to shoot
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

// Table dimensions (internal canvas units)
const TW = 800;
const TH = 400;
const BORDER = 28;
const BALL_R = 9;
const POCKET_R = 18;
const FRICTION = 0.985;
const MIN_VEL = 0.08;
const MAX_POWER = 18;
const WALL_BOUNCE = 0.75;

// Pocket positions
const POCKETS = [
  { x: BORDER + 2, y: BORDER + 2 },
  { x: TW / 2, y: BORDER - 2 },
  { x: TW - BORDER - 2, y: BORDER + 2 },
  { x: BORDER + 2, y: TH - BORDER - 2 },
  { x: TW / 2, y: TH - BORDER + 2 },
  { x: TW - BORDER - 2, y: TH - BORDER - 2 },
];

// Ball colors
const BALL_COLORS = {
  0: '#FAFAFA',  // cue (white)
  1: '#F59E0B',  // yellow
  2: '#2563EB',  // blue
  3: '#DC2626',  // red
  4: '#7C3AED',  // purple
  5: '#EA580C',  // orange
  6: '#059669',  // green
  7: '#991B1B',  // maroon
  8: '#111827',  // black (8-ball)
  9: '#F59E0B',  // yellow stripe
  10: '#2563EB', // blue stripe
  11: '#DC2626', // red stripe
  12: '#7C3AED', // purple stripe
  13: '#EA580C', // orange stripe
  14: '#059669', // green stripe
  15: '#991B1B', // maroon stripe
};

const isStripe = (id) => id >= 9 && id <= 15;
const isSolid = (id) => id >= 1 && id <= 7;

// Standard 8-ball rack
const RACK_ORDER = [
  [1],
  [11, 2],
  [9, 8, 3],
  [12, 4, 10, 5],
  [13, 6, 15, 7, 14],
];

function createInitialBalls() {
  const balls = [];
  // Cue ball
  balls.push({ id: 0, x: TW * 0.25, y: TH / 2, vx: 0, vy: 0, pocketed: false });
  // Rack
  const rackX = TW * 0.68;
  const rackY = TH / 2;
  const rowDx = BALL_R * Math.sqrt(3) * 1.05;
  const colDy = BALL_R * 2.08;
  RACK_ORDER.forEach((row, ri) => {
    row.forEach((ballId, ci) => {
      balls.push({
        id: ballId,
        x: rackX + ri * rowDx,
        y: rackY + (ci - (row.length - 1) / 2) * colDy,
        vx: 0, vy: 0, pocketed: false,
      });
    });
  });
  return balls;
}

export default function PoolGame({ gameState, myPlayerId, onMove, players }) {
  const canvasRef = useRef(null);
  const ballsRef = useRef(createInitialBalls());
  const animRef = useRef(null);
  const [aiming, setAiming] = useState(false);
  const [aimStart, setAimStart] = useState(null);
  const [aimEnd, setAimEnd] = useState(null);
  const [shooting, setShooting] = useState(false);
  const [pocketedThisShot, setPocketedThisShot] = useState([]);
  const [message, setMessage] = useState('');
  const [localAssignments, setLocalAssignments] = useState({});
  const [localPocketedSolids, setLocalPocketedSolids] = useState([]);
  const [localPocketedStripes, setLocalPocketedStripes] = useState([]);
  const [cueBallInHand, setCueBallInHand] = useState(false);
  const [placingCue, setPlacingCue] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const scaleRef = useRef(1);

  // Sync from server game state
  useEffect(() => {
    if (!gameState?.balls) return;
    const serverBalls = gameState.balls.map(b => ({ ...b, vx: 0, vy: 0 }));
    ballsRef.current = serverBalls;
    setLocalAssignments(gameState.assignments || {});
    setLocalPocketedSolids(gameState.pocketedSolids || []);
    setLocalPocketedStripes(gameState.pocketedStripes || []);
    setCueBallInHand(gameState.cueBallInHand || false);
    setPlacingCue(gameState.cueBallInHand || false);
    if (gameState.phase === 'finished') {
      setGameOver(true);
      setWinner(gameState.winner);
    }
    if (gameState.lastShotFoul) {
      setMessage('Foul! Ball in hand for opponent.');
    } else if (gameState.lastPocketed?.length > 0) {
      setMessage(`Pocketed: ${gameState.lastPocketed.join(', ')}`);
    } else {
      setMessage('');
    }
  }, [gameState]);

  const isMyTurn = gameState && gameState.turnOrder?.[gameState.currentPlayerIndex] === myPlayerId;
  const currentPlayerName = gameState?.turnOrder?.[gameState.currentPlayerIndex];
  const myAssignment = localAssignments[myPlayerId];

  // Get canvas mouse position
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = TW / rect.width;
    const sy = TH / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
  }, []);

  // Mouse/touch handlers
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    if (!isMyTurn || shooting || gameOver) return;
    const pos = getCanvasPos(e);
    const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
    if (!cue) return;

    // If placing cue ball after scratch
    if (placingCue) {
      // Place cue ball at click position (must be in left quarter)
      const nx = Math.max(BORDER + BALL_R, Math.min(TW * 0.35, pos.x));
      const ny = Math.max(BORDER + BALL_R, Math.min(TH - BORDER - BALL_R, pos.y));
      cue.x = nx;
      cue.y = ny;
      cue.pocketed = false;
      setPlacingCue(false);
      setCueBallInHand(false);
      return;
    }

    // Start aiming from cue ball
    const dx = pos.x - cue.x;
    const dy = pos.y - cue.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 60) {
      setAiming(true);
      setAimStart({ x: cue.x, y: cue.y });
      setAimEnd(pos);
    }
  }, [isMyTurn, shooting, gameOver, getCanvasPos, placingCue]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    if (!aiming) return;
    setAimEnd(getCanvasPos(e));
  }, [aiming, getCanvasPos]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    if (!aiming || !aimStart || !aimEnd) {
      setAiming(false);
      return;
    }

    const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
    if (!cue) { setAiming(false); return; }

    // Calculate shot direction (opposite of drag) and power
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(dist / 15, MAX_POWER);

    if (power < 0.5) {
      setAiming(false);
      setAimStart(null);
      setAimEnd(null);
      return;
    }

    const angle = Math.atan2(dy, dx);
    cue.vx = Math.cos(angle) * power;
    cue.vy = Math.sin(angle) * power;

    setShooting(true);
    setPocketedThisShot([]);
    setAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [aiming, aimStart, aimEnd]);

  // Physics simulation
  useEffect(() => {
    if (!shooting) return;
    let pocketed = [];

    const step = () => {
      const balls = ballsRef.current;
      let anyMoving = false;

      // Move balls
      for (const b of balls) {
        if (b.pocketed) continue;
        b.x += b.vx;
        b.y += b.vy;

        // Wall collisions
        if (b.x - BALL_R < BORDER) { b.x = BORDER + BALL_R; b.vx = Math.abs(b.vx) * WALL_BOUNCE; }
        if (b.x + BALL_R > TW - BORDER) { b.x = TW - BORDER - BALL_R; b.vx = -Math.abs(b.vx) * WALL_BOUNCE; }
        if (b.y - BALL_R < BORDER) { b.y = BORDER + BALL_R; b.vy = Math.abs(b.vy) * WALL_BOUNCE; }
        if (b.y + BALL_R > TH - BORDER) { b.y = TH - BORDER - BALL_R; b.vy = -Math.abs(b.vy) * WALL_BOUNCE; }

        // Pocket detection
        for (const p of POCKETS) {
          const pdx = b.x - p.x;
          const pdy = b.y - p.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < POCKET_R) {
            b.pocketed = true;
            b.vx = 0;
            b.vy = 0;
            if (!pocketed.includes(b.id)) pocketed.push(b.id);
            break;
          }
        }

        // Friction
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        if (Math.abs(b.vx) < MIN_VEL && Math.abs(b.vy) < MIN_VEL) {
          b.vx = 0;
          b.vy = 0;
        } else {
          anyMoving = true;
        }
      }

      // Ball-ball collisions
      for (let i = 0; i < balls.length; i++) {
        if (balls[i].pocketed) continue;
        for (let j = i + 1; j < balls.length; j++) {
          if (balls[j].pocketed) continue;
          const b1 = balls[i];
          const b2 = balls[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = BALL_R * 2;

          if (dist < minDist && dist > 0) {
            // Elastic collision (equal mass)
            const nx = dx / dist;
            const ny = dy / dist;
            const dvx = b1.vx - b2.vx;
            const dvy = b1.vy - b2.vy;
            const dvn = dvx * nx + dvy * ny;
            if (dvn > 0) {
              b1.vx -= dvn * nx;
              b1.vy -= dvn * ny;
              b2.vx += dvn * nx;
              b2.vy += dvn * ny;
            }
            // Separate overlapping balls
            const overlap = minDist - dist;
            b1.x -= (overlap / 2) * nx;
            b1.y -= (overlap / 2) * ny;
            b2.x += (overlap / 2) * nx;
            b2.y += (overlap / 2) * ny;
            anyMoving = true;
          }
        }
      }

      if (anyMoving) {
        animRef.current = requestAnimationFrame(step);
      } else {
        // Shot complete — send results to server
        setShooting(false);
        setPocketedThisShot(pocketed);

        const cueScratch = pocketed.includes(0);
        const ballPositions = balls.map(b => ({
          id: b.id,
          x: Math.round(b.x * 100) / 100,
          y: Math.round(b.y * 100) / 100,
          pocketed: b.pocketed,
        }));

        if (onMove) {
          onMove('shot', {
            ballPositions,
            pocketedThisShot: pocketed,
            scratch: cueScratch,
          });
        }
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [shooting, onMove]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let renderFrame;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Table background
      ctx.fillStyle = '#0B3D0B';
      ctx.fillRect(0, 0, w, h);

      // Wood border
      ctx.fillStyle = '#5C3317';
      ctx.fillRect(0, 0, w, BORDER);
      ctx.fillRect(0, h - BORDER, w, BORDER);
      ctx.fillRect(0, 0, BORDER, h);
      ctx.fillRect(w - BORDER, 0, BORDER, h);

      // Inner rail shadow
      ctx.strokeStyle = '#3A7D3A';
      ctx.lineWidth = 2;
      ctx.strokeRect(BORDER, BORDER, w - BORDER * 2, h - BORDER * 2);

      // Felt texture
      ctx.fillStyle = '#0D6B0D';
      ctx.fillRect(BORDER, BORDER, w - BORDER * 2, h - BORDER * 2);

      // Center line (break line)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, BORDER);
      ctx.lineTo(w * 0.35, h - BORDER);
      ctx.stroke();
      ctx.setLineDash([]);

      // Diamonds on rail
      const diamondColor = 'rgba(255,255,255,0.2)';
      for (let i = 1; i < 4; i++) {
        // Top
        ctx.fillStyle = diamondColor;
        ctx.beginPath();
        ctx.arc(BORDER + (w - BORDER * 2) * i / 4, BORDER / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        // Bottom
        ctx.beginPath();
        ctx.arc(BORDER + (w - BORDER * 2) * i / 4, h - BORDER / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 1; i < 2; i++) {
        // Left
        ctx.beginPath();
        ctx.arc(BORDER / 2, BORDER + (h - BORDER * 2) * i / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        // Right
        ctx.beginPath();
        ctx.arc(w - BORDER / 2, BORDER + (h - BORDER * 2) * i / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pockets
      for (const p of POCKETS) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Cue ball placement zone
      if (placingCue && isMyTurn) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(BORDER, BORDER, TW * 0.35 - BORDER, TH - BORDER * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(BORDER, BORDER, TW * 0.35 - BORDER, TH - BORDER * 2);
        ctx.setLineDash([]);
      }

      // Balls
      const balls = ballsRef.current;
      for (const b of balls) {
        if (b.pocketed) continue;

        // Shadow
        ctx.beginPath();
        ctx.arc(b.x + 2, b.y + 2, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Ball body
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        const color = BALL_COLORS[b.id] || '#999';

        if (isStripe(b.id)) {
          // Stripe: white ball with colored band
          ctx.fillStyle = '#FAFAFA';
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = color;
          ctx.fillRect(b.x - BALL_R, b.y - BALL_R * 0.45, BALL_R * 2, BALL_R * 0.9);
          ctx.restore();
        } else {
          ctx.fillStyle = color;
          ctx.fill();
        }

        // Highlight
        ctx.beginPath();
        ctx.arc(b.x - BALL_R * 0.3, b.y - BALL_R * 0.3, BALL_R * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        // Ball number (except cue ball)
        if (b.id !== 0) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_R * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.font = `bold ${BALL_R * 0.7}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.id.toString(), b.x, b.y + 0.5);
        }

        // Outline
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Aiming guide
      if (aiming && aimStart && aimEnd) {
        const cue = balls.find(b => b.id === 0 && !b.pocketed);
        if (cue) {
          const dx = aimStart.x - aimEnd.x;
          const dy = aimStart.y - aimEnd.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const power = Math.min(dist / 15, MAX_POWER);
          const angle = Math.atan2(dy, dx);

          // Aim line (dotted)
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cue.x, cue.y);
          ctx.lineTo(cue.x + Math.cos(angle) * 250, cue.y + Math.sin(angle) * 250);
          ctx.stroke();
          ctx.setLineDash([]);

          // Cue stick (behind the ball in opposite direction)
          const stickLen = 200;
          const stickStart = 15;
          ctx.strokeStyle = '#C4A265';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(
            cue.x - Math.cos(angle) * (stickStart + power * 3),
            cue.y - Math.sin(angle) * (stickStart + power * 3)
          );
          ctx.lineTo(
            cue.x - Math.cos(angle) * (stickStart + power * 3 + stickLen),
            cue.y - Math.sin(angle) * (stickStart + power * 3 + stickLen)
          );
          ctx.stroke();
          // Cue tip
          ctx.strokeStyle = '#E8D5B7';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(
            cue.x - Math.cos(angle) * stickStart,
            cue.y - Math.sin(angle) * stickStart
          );
          ctx.lineTo(
            cue.x - Math.cos(angle) * (stickStart + power * 3),
            cue.y - Math.sin(angle) * (stickStart + power * 3)
          );
          ctx.stroke();

          // Power indicator
          const barX = 20;
          const barY = TH - 20;
          const barW = 120;
          const barH = 8;
          const pct = power / MAX_POWER;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(barX - 2, barY - barH - 2, barW + 4, barH + 4);
          ctx.fillStyle = pct < 0.4 ? '#22c55e' : pct < 0.7 ? '#eab308' : '#ef4444';
          ctx.fillRect(barX, barY - barH, barW * pct, barH);
          ctx.fillStyle = '#fff';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Power: ${Math.round(pct * 100)}%`, barX, barY - barH - 6);
        }
      }

      renderFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(renderFrame);
  }, [aiming, aimStart, aimEnd, shooting, placingCue, isMyTurn]);

  // Current player info
  const currentIdx = gameState?.currentPlayerIndex ?? 0;
  const p1 = gameState?.turnOrder?.[0];
  const p2 = gameState?.turnOrder?.[1];
  const p1Name = players?.find(p => p.user_id === p1)?.display_name || 'Player 1';
  const p2Name = players?.find(p => p.user_id === p2)?.display_name || 'Player 2';
  const p1Assignment = localAssignments[p1];
  const p2Assignment = localAssignments[p2];

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Player info bar */}
      <div className="flex items-center justify-between w-full max-w-[800px] px-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${currentIdx === 0 ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-white/5'}`}>
          <span className="text-white font-bold">{p1Name}</span>
          {p1Assignment && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${p1Assignment === 'solids' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {p1Assignment === 'solids' ? 'Solids (1-7)' : 'Stripes (9-15)'}
            </span>
          )}
          {currentIdx === 0 && <span className="text-blue-400 text-xs animate-pulse">Shooting</span>}
        </div>

        <div className="text-white/40 text-xs">VS</div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${currentIdx === 1 ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-white/5'}`}>
          <span className="text-white font-bold">{p2Name}</span>
          {p2Assignment && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${p2Assignment === 'solids' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-purple-500/20 text-purple-400'}`}>
              {p2Assignment === 'solids' ? 'Solids (1-7)' : 'Stripes (9-15)'}
            </span>
          )}
          {currentIdx === 1 && <span className="text-blue-400 text-xs animate-pulse">Shooting</span>}
        </div>
      </div>

      {/* Pool table canvas */}
      <div className="relative w-full max-w-[800px] aspect-[2/1] bg-black rounded-lg overflow-hidden border-2 border-amber-900/50 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={TW}
          height={TH}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Pocketed balls display */}
      <div className="flex items-center gap-4 w-full max-w-[800px] px-2">
        <div className="flex-1">
          <span className="text-white/40 text-xs block mb-1">Solids</span>
          <div className="flex gap-1.5">
            {[1,2,3,4,5,6,7].map(id => (
              <div key={id} className={`w-6 h-6 rounded-full border ${localPocketedSolids.includes(id) ? 'opacity-30' : ''}`}
                style={{ backgroundColor: BALL_COLORS[id], borderColor: 'rgba(255,255,255,0.2)' }}>
                <span className="flex items-center justify-center w-full h-full text-[8px] font-bold text-white drop-shadow">{id}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-white/20 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">8</span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-white/40 text-xs block mb-1">Stripes</span>
          <div className="flex gap-1.5 justify-end">
            {[9,10,11,12,13,14,15].map(id => (
              <div key={id} className={`w-6 h-6 rounded-full border relative overflow-hidden ${localPocketedStripes.includes(id) ? 'opacity-30' : ''}`}
                style={{ backgroundColor: '#FAFAFA', borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[40%]" style={{ backgroundColor: BALL_COLORS[id] }} />
                <span className="relative flex items-center justify-center w-full h-full text-[8px] font-bold text-gray-800">{id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center text-sm">
        {gameOver ? (
          <span className={`font-bold ${winner === myPlayerId ? 'text-green-400' : 'text-red-400'}`}>
            {winner === myPlayerId ? 'You Win!' : 'You Lose!'}
          </span>
        ) : placingCue && isMyTurn ? (
          <span className="text-yellow-400">Click in the left zone to place the cue ball</span>
        ) : isMyTurn ? (
          <span className="text-green-400">Your turn — drag from cue ball to aim & shoot</span>
        ) : (
          <span className="text-white/50">Waiting for opponent to shoot...</span>
        )}
        {message && !gameOver && <span className="text-white/40 ml-2">| {message}</span>}
      </div>
    </div>
  );
}
