/**
 * KICKBACK LOUNGE — 8-Ball Pool Game
 * REAL pool experience — large table, 3D balls, proper physics
 * Drag from cue ball to aim & set power, release to shoot
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

// ============================================================
// TABLE & PHYSICS CONSTANTS
// ============================================================
const TW = 1200;
const TH = 600;
const BORDER = 40;
const CUSHION = 8;
const BALL_R = 13;
const POCKET_R = 22;
const FRICTION = 0.988;
const MIN_VEL = 0.06;
const MAX_POWER = 22;
const WALL_BOUNCE = 0.7;
const BALL_BOUNCE = 0.96;

// Corner pockets slightly inside, side pockets centered
const POCKETS = [
  { x: BORDER + 6, y: BORDER + 6 },                  // top-left
  { x: TW / 2, y: BORDER - 4 },                       // top-center
  { x: TW - BORDER - 6, y: BORDER + 6 },              // top-right
  { x: BORDER + 6, y: TH - BORDER - 6 },              // bottom-left
  { x: TW / 2, y: TH - BORDER + 4 },                  // bottom-center
  { x: TW - BORDER - 6, y: TH - BORDER - 6 },         // bottom-right
];

// Ball colors (official billiards)
const BALL_COLORS = {
  0: '#F8F8F0',   // cue — ivory white
  1: '#F5C518',   // 1 — yellow
  2: '#1A3FC7',   // 2 — blue
  3: '#D4261D',   // 3 — red
  4: '#5B2C8E',   // 4 — purple
  5: '#E87511',   // 5 — orange
  6: '#1B8C4B',   // 6 — green
  7: '#8B1A1A',   // 7 — maroon
  8: '#111111',   // 8 — black
  9: '#F5C518',   // 9 — yellow stripe
  10: '#1A3FC7',  // 10 — blue stripe
  11: '#D4261D',  // 11 — red stripe
  12: '#5B2C8E',  // 12 — purple stripe
  13: '#E87511',  // 13 — orange stripe
  14: '#1B8C4B',  // 14 — green stripe
  15: '#8B1A1A',  // 15 — maroon stripe
};

const isStripe = (id) => id >= 9 && id <= 15;
const isSolid = (id) => id >= 1 && id <= 7;

// ============================================================
// SOUND EFFECTS (Web Audio API — no dependencies)
// ============================================================
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playBallClick(velocity) {
  try {
    const ctx = getAudioCtx();
    const vol = Math.min(velocity / 15, 1) * 0.3;
    if (vol < 0.02) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) { /* audio not available */ }
}

function playCushionBounce(velocity) {
  try {
    const ctx = getAudioCtx();
    const vol = Math.min(velocity / 12, 1) * 0.2;
    if (vol < 0.02) return;
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) { /* audio not available */ }
}

function playPocketDrop() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    // Secondary thud
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.value = 120;
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    }, 50);
  } catch (e) { /* audio not available */ }
}

function playCueStrike(power) {
  try {
    const ctx = getAudioCtx();
    const vol = Math.min(power / MAX_POWER, 1) * 0.35;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  } catch (e) { /* audio not available */ }
}

// Pocket flash effects
const pocketFlashes = [];

const RACK_ORDER = [
  [1],
  [11, 2],
  [9, 8, 3],
  [12, 4, 10, 5],
  [13, 6, 15, 7, 14],
];

function createInitialBalls() {
  const balls = [];
  balls.push({ id: 0, x: TW * 0.25, y: TH / 2, vx: 0, vy: 0, pocketed: false });
  const rackX = TW * 0.72;
  const rackY = TH / 2;
  const spacing = BALL_R * 2.06;
  const rowDx = spacing * Math.sqrt(3) / 2;
  RACK_ORDER.forEach((row, ri) => {
    row.forEach((ballId, ci) => {
      balls.push({
        id: ballId,
        x: rackX + ri * rowDx,
        y: rackY + (ci - (row.length - 1) / 2) * spacing,
        vx: 0, vy: 0, pocketed: false,
      });
    });
  });
  return balls;
}

// ============================================================
// RENDERING HELPERS
// ============================================================

function drawTable(ctx) {
  const w = TW, h = TH;

  // Outer frame (dark wood)
  const outerGrad = ctx.createLinearGradient(0, 0, 0, h);
  outerGrad.addColorStop(0, '#3E2415');
  outerGrad.addColorStop(0.3, '#5C3A1E');
  outerGrad.addColorStop(0.5, '#6B4226');
  outerGrad.addColorStop(0.7, '#5C3A1E');
  outerGrad.addColorStop(1, '#3E2415');
  ctx.fillStyle = outerGrad;
  ctx.fillRect(0, 0, w, h);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < w; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 3, h);
    ctx.stroke();
  }

  // Inner border highlight (gold inlay)
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  ctx.strokeRect(BORDER - 4, BORDER - 4, w - (BORDER - 4) * 2, h - (BORDER - 4) * 2);
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 1;
  ctx.strokeRect(BORDER - 2, BORDER - 2, w - (BORDER - 2) * 2, h - (BORDER - 2) * 2);

  // Cushion bumpers (dark green rubber)
  ctx.fillStyle = '#1B5E20';
  ctx.fillRect(BORDER, BORDER, w - BORDER * 2, CUSHION);
  ctx.fillRect(BORDER, h - BORDER - CUSHION, w - BORDER * 2, CUSHION);
  ctx.fillRect(BORDER, BORDER, CUSHION, h - BORDER * 2);
  ctx.fillRect(w - BORDER - CUSHION, BORDER, CUSHION, h - BORDER * 2);

  // Felt surface (rich tournament green with subtle gradient)
  const feltGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.6);
  feltGrad.addColorStop(0, '#1B7A3D');
  feltGrad.addColorStop(1, '#14612E');
  ctx.fillStyle = feltGrad;
  ctx.fillRect(BORDER + CUSHION, BORDER + CUSHION, w - (BORDER + CUSHION) * 2, h - (BORDER + CUSHION) * 2);

  // Felt texture (subtle noise pattern)
  ctx.fillStyle = 'rgba(0,0,0,0.015)';
  for (let x = BORDER + CUSHION; x < w - BORDER - CUSHION; x += 4) {
    for (let y = BORDER + CUSHION; y < h - BORDER - CUSHION; y += 4) {
      if (Math.random() < 0.3) {
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // Head string (break line)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(TW * 0.28, BORDER + CUSHION);
  ctx.lineTo(TW * 0.28, TH - BORDER - CUSHION);
  ctx.stroke();
  ctx.setLineDash([]);

  // Foot spot
  ctx.beginPath();
  ctx.arc(TW * 0.72, TH / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  // Head spot
  ctx.beginPath();
  ctx.arc(TW * 0.28, TH / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  // Diamond sights on rails
  const diamondSize = 4;
  ctx.fillStyle = '#C9A84C';
  // Top rail diamonds
  const topDiamonds = [0.125, 0.25, 0.375, 0.625, 0.75, 0.875];
  for (const pct of topDiamonds) {
    const dx = BORDER + (w - BORDER * 2) * pct;
    drawDiamond(ctx, dx, BORDER / 2, diamondSize);
  }
  // Bottom rail diamonds
  for (const pct of topDiamonds) {
    const dx = BORDER + (w - BORDER * 2) * pct;
    drawDiamond(ctx, dx, h - BORDER / 2, diamondSize);
  }
  // Left rail diamonds
  const sideDiamonds = [0.25, 0.5, 0.75];
  for (const pct of sideDiamonds) {
    const dy = BORDER + (h - BORDER * 2) * pct;
    drawDiamond(ctx, BORDER / 2, dy, diamondSize);
  }
  // Right rail diamonds
  for (const pct of sideDiamonds) {
    const dy = BORDER + (h - BORDER * 2) * pct;
    drawDiamond(ctx, w - BORDER / 2, dy, diamondSize);
  }

  // Pockets with depth
  for (const p of POCKETS) {
    // Outer shadow
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();

    // Pocket hole
    const pocketGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, POCKET_R);
    pocketGrad.addColorStop(0, '#000000');
    pocketGrad.addColorStop(0.7, '#0A0A0A');
    pocketGrad.addColorStop(1, '#1A1A1A');
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
    ctx.fillStyle = pocketGrad;
    ctx.fill();

    // Chrome rim
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R + 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x - 2, p.y - 2, POCKET_R + 1, Math.PI * 1.2, Math.PI * 1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawDiamond(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.6, y);
  ctx.closePath();
  ctx.fill();
}

function drawBall(ctx, b) {
  if (b.pocketed) return;
  const { x, y, id } = b;
  const r = BALL_R;
  const color = BALL_COLORS[id] || '#999';

  // Drop shadow
  ctx.beginPath();
  ctx.arc(x + 1.5, y + 2.5, r + 1, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  // Ball base
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);

  if (isStripe(id)) {
    // White base
    ctx.fillStyle = '#F0EDE6';
    ctx.fill();
    // Colored band
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.8);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }

  // 3D sphere gradient overlay
  const sphereGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  sphereGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
  sphereGrad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
  sphereGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = sphereGrad;
  ctx.fill();

  // Number circle & text (not on cue ball)
  if (id !== 0) {
    // White number circle
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // Number
    ctx.fillStyle = '#111';
    ctx.font = `bold ${r * 0.65}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(id.toString(), x, y + 0.5);
  }

  // Specular highlight (top-left)
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  // Edge highlight
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawCueStick(ctx, cue, angle, power) {
  const stickLen = 280;
  const tipOffset = BALL_R + 4;
  const pullBack = power * 4;

  // Cue stick body (tapered)
  const startX = cue.x - Math.cos(angle) * (tipOffset + pullBack);
  const startY = cue.y - Math.sin(angle) * (tipOffset + pullBack);
  const endX = cue.x - Math.cos(angle) * (tipOffset + pullBack + stickLen);
  const endY = cue.y - Math.sin(angle) * (tipOffset + pullBack + stickLen);

  // Stick shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(startX + 2, startY + 3);
  ctx.lineTo(endX + 2, endY + 3);
  ctx.stroke();

  // Main shaft (maple wood gradient)
  ctx.strokeStyle = '#E8C878';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Wood grain stripe
  ctx.strokeStyle = '#D4A84C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Ferrule (white band near tip)
  const ferruleLen = 12;
  const fx = cue.x - Math.cos(angle) * (tipOffset + pullBack);
  const fy = cue.y - Math.sin(angle) * (tipOffset + pullBack);
  const fx2 = cue.x - Math.cos(angle) * (tipOffset + pullBack + ferruleLen);
  const fy2 = cue.y - Math.sin(angle) * (tipOffset + pullBack + ferruleLen);
  ctx.strokeStyle = '#F5F0E0';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx2, fy2);
  ctx.stroke();

  // Leather tip (blue chalk)
  const tx = cue.x - Math.cos(angle) * (tipOffset + pullBack - 2);
  const ty = cue.y - Math.sin(angle) * (tipOffset + pullBack - 2);
  ctx.beginPath();
  ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#3B6DB5';
  ctx.fill();

  // Butt wrap (dark grip)
  const wrapStart = stickLen * 0.6;
  const wrapEnd = stickLen * 0.85;
  const ws1x = cue.x - Math.cos(angle) * (tipOffset + pullBack + wrapStart);
  const ws1y = cue.y - Math.sin(angle) * (tipOffset + pullBack + wrapStart);
  const ws2x = cue.x - Math.cos(angle) * (tipOffset + pullBack + wrapEnd);
  const ws2y = cue.y - Math.sin(angle) * (tipOffset + pullBack + wrapEnd);
  ctx.strokeStyle = '#2C1810';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(ws1x, ws1y);
  ctx.lineTo(ws2x, ws2y);
  ctx.stroke();

  // Butt cap
  ctx.beginPath();
  ctx.arc(endX, endY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#1A0F08';
  ctx.fill();
}

function drawAimLine(ctx, cue, angle, balls) {
  // Ghost ball trajectory
  const maxLen = 800;
  const stepSize = 2;
  let gx = cue.x;
  let gy = cue.y;
  const dx = Math.cos(angle) * stepSize;
  const dy = Math.sin(angle) * stepSize;

  // Find first collision point
  let hitPoint = null;
  let hitBall = null;
  for (let i = 0; i < maxLen / stepSize; i++) {
    gx += dx;
    gy += dy;

    // Check wall hit
    if (gx - BALL_R < BORDER + CUSHION || gx + BALL_R > TW - BORDER - CUSHION ||
        gy - BALL_R < BORDER + CUSHION || gy + BALL_R > TH - BORDER - CUSHION) {
      hitPoint = { x: gx, y: gy };
      break;
    }

    // Check ball hit
    for (const b of balls) {
      if (b.id === 0 || b.pocketed) continue;
      const bDist = Math.sqrt((gx - b.x) ** 2 + (gy - b.y) ** 2);
      if (bDist < BALL_R * 2) {
        hitPoint = { x: gx, y: gy };
        hitBall = b;
        break;
      }
    }
    if (hitPoint) break;
  }

  // Draw dotted aim line
  ctx.setLineDash([3, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cue.x, cue.y);
  if (hitPoint) {
    ctx.lineTo(hitPoint.x, hitPoint.y);
  } else {
    ctx.lineTo(cue.x + Math.cos(angle) * maxLen, cue.y + Math.sin(angle) * maxLen);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Ghost ball at hit point
  if (hitPoint) {
    ctx.beginPath();
    ctx.arc(hitPoint.x, hitPoint.y, BALL_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // If hitting a ball, show predicted direction
  if (hitBall && hitPoint) {
    const nx = (hitBall.x - hitPoint.x);
    const ny = (hitBall.y - hitPoint.y);
    const nd = Math.sqrt(nx * nx + ny * ny) || 1;
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'rgba(255,200,50,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hitBall.x, hitBall.y);
    ctx.lineTo(hitBall.x + (nx / nd) * 100, hitBall.y + (ny / nd) * 100);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawPowerBar(ctx, power) {
  const pct = power / MAX_POWER;
  const barW = 180;
  const barH = 12;
  const barX = 30;
  const barY = TH - 30;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(barX - 4, barY - barH - 8, barW + 8, barH + 24, 6);
  ctx.fill();

  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY - barH, barW, barH, 4);
  ctx.fill();

  // Fill
  const colors = pct < 0.35 ? '#22c55e' : pct < 0.65 ? '#eab308' : '#ef4444';
  ctx.fillStyle = colors;
  ctx.beginPath();
  ctx.roundRect(barX, barY - barH, barW * pct, barH, 4);
  ctx.fill();

  // Glow
  ctx.shadowColor = colors;
  ctx.shadowBlur = 8;
  ctx.fillStyle = colors;
  ctx.beginPath();
  ctx.roundRect(barX, barY - barH, barW * pct, barH, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`POWER ${Math.round(pct * 100)}%`, barX, barY + 4);
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PoolGame({ gameState, myPlayerId, onMove, players }) {
  const canvasRef = useRef(null);
  const ballsRef = useRef(createInitialBalls());
  const animRef = useRef(null);
  const tableImageRef = useRef(null);
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

  // Pre-render the static table to an offscreen canvas (performance)
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = TW;
    offscreen.height = TH;
    const ctx = offscreen.getContext('2d');
    drawTable(ctx);
    tableImageRef.current = offscreen;
  }, []);

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
      setMessage('Scratch! Ball in hand.');
    } else if (gameState.lastPocketed?.length > 0) {
      setMessage(`Pocketed: ${gameState.lastPocketed.join(', ')}`);
    } else {
      setMessage('');
    }
  }, [gameState]);

  const currentTurnPlayer = gameState?.turnOrder?.[gameState?.currentPlayerIndex];
  const isAiOpponent = currentTurnPlayer?.startsWith?.('ai_');
  const isMyTurn = gameState && (currentTurnPlayer === myPlayerId || isAiOpponent);

  // AI auto-shot — when it's the bot's turn, calculate and fire after delay
  useEffect(() => {
    if (!isAiOpponent || shooting || !gameState || gameState.phase !== 'playing') return;
    const timer = setTimeout(async () => {
      const { calculateAiShot } = await import('@/lib/games/pool');
      const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
      if (!cue) return;
      const shot = calculateAiShot(gameState);
      cue.vx = Math.cos(shot.angle) * shot.power;
      cue.vy = Math.sin(shot.angle) * shot.power;
      playCueStrike(shot.power);
      setShooting(true);
      setPocketedThisShot([]);
    }, 1200 + Math.random() * 800); // 1.2-2s thinking delay
    return () => clearTimeout(timer);
  }, [isAiOpponent, shooting, gameState]);

  // Canvas mouse position
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

  // Pointer handlers
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    if (!isMyTurn || shooting || gameOver) return;
    const pos = getCanvasPos(e);
    const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
    if (!cue) return;

    if (placingCue) {
      const playArea = BORDER + CUSHION + BALL_R;
      const maxX = TW * 0.28;
      const nx = Math.max(playArea, Math.min(maxX, pos.x));
      const ny = Math.max(playArea, Math.min(TH - playArea, pos.y));
      // Check no overlap with other balls
      const overlap = ballsRef.current.some(b => b.id !== 0 && !b.pocketed &&
        Math.sqrt((b.x - nx) ** 2 + (b.y - ny) ** 2) < BALL_R * 2.2);
      if (!overlap) {
        cue.x = nx;
        cue.y = ny;
        cue.pocketed = false;
        setPlacingCue(false);
        setCueBallInHand(false);
      }
      return;
    }

    const dx = pos.x - cue.x;
    const dy = pos.y - cue.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 80) {
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
    if (!aiming || !aimStart || !aimEnd) { setAiming(false); return; }
    const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
    if (!cue) { setAiming(false); return; }

    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(dist / 12, MAX_POWER);

    if (power < 0.8) {
      setAiming(false);
      setAimStart(null);
      setAimEnd(null);
      return;
    }

    const angle = Math.atan2(dy, dx);
    cue.vx = Math.cos(angle) * power;
    cue.vy = Math.sin(angle) * power;

    playCueStrike(power);
    setShooting(true);
    setPocketedThisShot([]);
    setAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [aiming, aimStart, aimEnd]);

  // Physics loop
  useEffect(() => {
    if (!shooting) return;
    let pocketed = [];

    const step = () => {
      const balls = ballsRef.current;
      let anyMoving = false;
      const inner = BORDER + CUSHION;
      const SUB_STEPS = 3;

      for (let sub = 0; sub < SUB_STEPS; sub++) {
      for (const b of balls) {
        if (b.pocketed) continue;
        b.x += b.vx / SUB_STEPS;
        b.y += b.vy / SUB_STEPS;

        // Wall collisions with cushion bounce + sound
        if (b.x - BALL_R < inner) { if (sub === 0) playCushionBounce(Math.abs(b.vx)); b.x = inner + BALL_R; b.vx = Math.abs(b.vx) * WALL_BOUNCE; }
        if (b.x + BALL_R > TW - inner) { if (sub === 0) playCushionBounce(Math.abs(b.vx)); b.x = TW - inner - BALL_R; b.vx = -Math.abs(b.vx) * WALL_BOUNCE; }
        if (b.y - BALL_R < inner) { if (sub === 0) playCushionBounce(Math.abs(b.vy)); b.y = inner + BALL_R; b.vy = Math.abs(b.vy) * WALL_BOUNCE; }
        if (b.y + BALL_R > TH - inner) { if (sub === 0) playCushionBounce(Math.abs(b.vy)); b.y = TH - inner - BALL_R; b.vy = -Math.abs(b.vy) * WALL_BOUNCE; }

        // Pocket detection
        for (const p of POCKETS) {
          const pdx = b.x - p.x;
          const pdy = b.y - p.y;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < POCKET_R) {
            b.pocketed = true;
            b.vx = 0;
            b.vy = 0;
            playPocketDrop();
            pocketFlashes.push({ x: p.x, y: p.y, alpha: 1.0, radius: POCKET_R });
            if (!pocketed.includes(b.id)) pocketed.push(b.id);
            break;
          }
        }

      }

      // Ball-ball collisions (elastic) — inside sub-step for accuracy
      for (let i = 0; i < balls.length; i++) {
        if (balls[i].pocketed) continue;
        for (let j = i + 1; j < balls.length; j++) {
          if (balls[j].pocketed) continue;
          const b1 = balls[i], b2 = balls[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = BALL_R * 2;

          if (dist < minDist && dist > 0.01) {
            const nx = dx / dist;
            const ny = dy / dist;
            const dvx = b1.vx - b2.vx;
            const dvy = b1.vy - b2.vy;
            const dvn = dvx * nx + dvy * ny;
            if (dvn > 0) {
              if (sub === 0) playBallClick(dvn);
              b1.vx -= dvn * nx * BALL_BOUNCE;
              b1.vy -= dvn * ny * BALL_BOUNCE;
              b2.vx += dvn * nx * BALL_BOUNCE;
              b2.vy += dvn * ny * BALL_BOUNCE;
            }
            const overlap = minDist - dist;
            b1.x -= (overlap / 2) * nx;
            b1.y -= (overlap / 2) * ny;
            b2.x += (overlap / 2) * nx;
            b2.y += (overlap / 2) * ny;
          }
        }
      }
      } // end sub-step loop

      // Friction (applied once per frame, not per sub-step)
      for (const b of balls) {
        if (b.pocketed) continue;
        b.vx *= FRICTION;
        b.vy *= FRICTION;
        if (Math.abs(b.vx) < MIN_VEL && Math.abs(b.vy) < MIN_VEL) {
          b.vx = 0;
          b.vy = 0;
        } else {
          anyMoving = true;
        }
      }

      if (anyMoving) {
        animRef.current = requestAnimationFrame(step);
      } else {
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
          onMove('shot', { ballPositions, pocketedThisShot: pocketed, scratch: cueScratch });
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
    let frame;

    const render = () => {
      // Draw pre-rendered table
      if (tableImageRef.current) {
        ctx.drawImage(tableImageRef.current, 0, 0);
      } else {
        drawTable(ctx);
      }

      // Cue ball placement zone highlight
      if (placingCue && isMyTurn) {
        ctx.fillStyle = 'rgba(100,200,255,0.06)';
        const inner = BORDER + CUSHION;
        ctx.fillRect(inner, inner, TW * 0.28 - inner, TH - inner * 2);
        ctx.strokeStyle = 'rgba(100,200,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(inner, inner, TW * 0.28 - inner, TH - inner * 2);
        ctx.setLineDash([]);
      }

      // Pocket flash effects (animate and draw)
      for (let i = pocketFlashes.length - 1; i >= 0; i--) {
        const f = pocketFlashes[i];
        f.alpha -= 0.03;
        f.radius += 1.5;
        if (f.alpha <= 0) {
          pocketFlashes.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        flashGrad.addColorStop(0, `rgba(255,215,0,${f.alpha * 0.6})`);
        flashGrad.addColorStop(0.5, `rgba(255,180,0,${f.alpha * 0.3})`);
        flashGrad.addColorStop(1, `rgba(255,100,0,0)`);
        ctx.fillStyle = flashGrad;
        ctx.fill();
      }

      // Balls (draw in order for proper layering)
      const balls = ballsRef.current;
      const sorted = [...balls].sort((a, b) => a.y - b.y);
      for (const b of sorted) {
        drawBall(ctx, b);
      }

      // Aiming visuals
      if (aiming && aimStart && aimEnd) {
        const cue = balls.find(b => b.id === 0 && !b.pocketed);
        if (cue) {
          const dx = aimStart.x - aimEnd.x;
          const dy = aimStart.y - aimEnd.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const power = Math.min(dist / 12, MAX_POWER);
          const angle = Math.atan2(dy, dx);

          drawAimLine(ctx, cue, angle, balls);
          drawCueStick(ctx, cue, angle, power);
          drawPowerBar(ctx, power);
        }
      }

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, [aiming, aimStart, aimEnd, shooting, placingCue, isMyTurn]);

  // Player info
  const currentIdx = gameState?.currentPlayerIndex ?? 0;
  const p1 = gameState?.turnOrder?.[0];
  const p2 = gameState?.turnOrder?.[1];
  const p1Name = players?.find(p => p.user_id === p1)?.display_name || (p1 === 'ai_opponent' ? 'Practice Bot' : 'Player 1');
  const p2Name = players?.find(p => p.user_id === p2)?.display_name || (p2 === 'ai_opponent' ? 'Practice Bot' : 'Player 2');
  const p1Assign = localAssignments[p1];
  const p2Assign = localAssignments[p2];

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full max-w-[900px] px-2">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
          currentIdx === 0 ? 'bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border border-white/5'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${currentIdx === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-white font-bold">{p1Name}</span>
          {p1Assign && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              p1Assign === 'solids' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}>{p1Assign === 'solids' ? 'SOLIDS' : 'STRIPES'}</span>
          )}
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/30 font-medium tracking-widest">8-BALL</span>
          <span className="text-white/20 text-lg font-bold">VS</span>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
          currentIdx === 1 ? 'bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border border-white/5'
        }`}>
          <span className="text-white font-bold">{p2Name}</span>
          {p2Assign && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              p2Assign === 'solids' ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
            }`}>{p2Assign === 'solids' ? 'SOLIDS' : 'STRIPES'}</span>
          )}
          <div className={`w-2.5 h-2.5 rounded-full ${currentIdx === 1 ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
        </div>
      </div>

      {/* Pool table */}
      <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-amber-900/30">
        <canvas
          ref={canvasRef}
          width={TW}
          height={TH}
          className="w-full h-full"
          style={{ cursor: placingCue && isMyTurn ? 'copy' : aiming ? 'none' : isMyTurn ? 'crosshair' : 'default', touchAction: 'none' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Ball rack display */}
      <div className="flex items-center gap-6 w-full max-w-[900px] px-3 py-2 bg-white/[0.03] rounded-xl border border-white/5">
        <div className="flex-1">
          <span className="text-[10px] text-white/30 font-medium tracking-wider block mb-1.5">SOLIDS</span>
          <div className="flex gap-1.5">
            {[1,2,3,4,5,6,7].map(id => {
              const gone = localPocketedSolids.includes(id);
              return (
                <div key={id} className={`w-7 h-7 rounded-full border border-white/10 flex items-center justify-center transition-all ${gone ? 'opacity-20 scale-75' : 'shadow-md'}`}
                  style={{ backgroundColor: gone ? '#333' : BALL_COLORS[id] }}>
                  <span className="text-[9px] font-bold text-white drop-shadow-sm">{id}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full bg-gray-900 border-2 border-white/20 flex items-center justify-center shadow-lg">
            <span className="text-xs font-bold text-white">8</span>
          </div>
        </div>

        <div className="flex-1 text-right">
          <span className="text-[10px] text-white/30 font-medium tracking-wider block mb-1.5">STRIPES</span>
          <div className="flex gap-1.5 justify-end">
            {[9,10,11,12,13,14,15].map(id => {
              const gone = localPocketedStripes.includes(id);
              return (
                <div key={id} className={`w-7 h-7 rounded-full border border-white/10 relative overflow-hidden flex items-center justify-center transition-all ${gone ? 'opacity-20 scale-75' : 'shadow-md'}`}
                  style={{ backgroundColor: gone ? '#333' : '#F0EDE6' }}>
                  {!gone && <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[35%]" style={{ backgroundColor: BALL_COLORS[id] }} />}
                  <span className="relative text-[9px] font-bold text-gray-800 drop-shadow-sm">{id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center text-sm px-4 py-2 rounded-lg bg-white/[0.02]">
        {gameOver ? (
          <span className={`font-bold text-base ${winner === myPlayerId ? 'text-emerald-400' : 'text-red-400'}`}>
            {winner === myPlayerId ? 'You Win!' : 'You Lose!'}
          </span>
        ) : placingCue && isMyTurn ? (
          <span className="text-cyan-400">Click in the shaded zone to place the cue ball</span>
        ) : isMyTurn ? (
          <span className="text-emerald-400">Your shot — drag back from cue ball to aim, release to shoot</span>
        ) : (
          <span className="text-white/40">Opponent&apos;s turn...</span>
        )}
        {message && !gameOver && <span className="text-white/30 ml-2 text-xs">| {message}</span>}
      </div>
    </div>
  );
}
