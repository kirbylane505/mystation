/**
 * KICKBACK LOUNGE — Arcade Pool (Solo Mode)
 * 30 progressive levels: Rookie -> Street -> Hustler -> Pro
 * Shares physics with multiplayer PoolGame via poolPhysics.js
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Star, Lock, RotateCcw, ChevronRight, Trophy } from 'lucide-react';
import {
  TW, TH, BORDER, CUSHION, BALL_R, POCKET_R, MAX_POWER,
  BALL_COLORS, isStripe, POCKETS, createInitialBalls, stepPhysics,
} from '@/lib/games/poolPhysics';
import {
  TIER_INFO, getTier, AIM_GUIDE_CONFIG, POCKET_SCALE,
  LEVELS, getStars, loadArcadeProgress, saveArcadeProgress,
} from '@/lib/games/arcadeLevels';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

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

function playLevelComplete() {
  try {
    const ctx = getAudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.5);
    });
  } catch (e) { /* audio not available */ }
}

// ============================================================
// MODULE-SCOPE EFFECT ARRAYS
// ============================================================
const pocketFlashes = [];
const pocketDrops = [];
const trailParticles = [];
const sparks = [];

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

  // Cloth weave texture (diagonal cross-hatch)
  ctx.strokeStyle = 'rgba(0,0,0,0.02)';
  ctx.lineWidth = 0.5;
  const feltLeft = BORDER + CUSHION;
  const feltTop = BORDER + CUSHION;
  const feltRight = w - BORDER - CUSHION;
  const feltBottom = h - BORDER - CUSHION;
  ctx.save();
  ctx.beginPath();
  ctx.rect(feltLeft, feltTop, feltRight - feltLeft, feltBottom - feltTop);
  ctx.clip();
  for (let i = -feltBottom; i < feltRight; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, feltTop);
    ctx.lineTo(i + (feltBottom - feltTop), feltBottom);
    ctx.stroke();
  }
  for (let i = feltLeft; i < feltRight + feltBottom; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, feltTop);
    ctx.lineTo(i - (feltBottom - feltTop), feltBottom);
    ctx.stroke();
  }
  ctx.restore();

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
  const topDiamonds = [0.125, 0.25, 0.375, 0.625, 0.75, 0.875];
  for (const pct of topDiamonds) {
    const dx = BORDER + (w - BORDER * 2) * pct;
    drawDiamond(ctx, dx, BORDER / 2, diamondSize);
  }
  for (const pct of topDiamonds) {
    const dx = BORDER + (w - BORDER * 2) * pct;
    drawDiamond(ctx, dx, h - BORDER / 2, diamondSize);
  }
  const sideDiamonds = [0.25, 0.5, 0.75];
  for (const pct of sideDiamonds) {
    const dy = BORDER + (h - BORDER * 2) * pct;
    drawDiamond(ctx, BORDER / 2, dy, diamondSize);
  }
  for (const pct of sideDiamonds) {
    const dy = BORDER + (h - BORDER * 2) * pct;
    drawDiamond(ctx, w - BORDER / 2, dy, diamondSize);
  }

  // Pockets with depth
  for (const p of POCKETS) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    const pocketGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, POCKET_R);
    pocketGrad.addColorStop(0, '#000000');
    pocketGrad.addColorStop(0.7, '#0A0A0A');
    pocketGrad.addColorStop(1, '#1A1A1A');
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
    ctx.fillStyle = pocketGrad;
    ctx.fill();
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
    ctx.fillStyle = '#F0EDE6';
    ctx.fill();
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
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
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

  // Subtle equator line
  if (id !== 0) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }

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

  // Main shaft
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

  // Ferrule
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

  // Leather tip
  const tx = cue.x - Math.cos(angle) * (tipOffset + pullBack - 2);
  const ty = cue.y - Math.sin(angle) * (tipOffset + pullBack - 2);
  ctx.beginPath();
  ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#3B6DB5';
  ctx.fill();

  // Butt wrap
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

function drawAimLine(ctx, cue, angle, balls, guideConfig) {
  if (!guideConfig.showTrajectory) return;
  const maxLen = guideConfig.length;
  const stepSize = 2;
  let gx = cue.x;
  let gy = cue.y;
  const dx = Math.cos(angle) * stepSize;
  const dy = Math.sin(angle) * stepSize;

  let hitPoint = null;
  let hitBall = null;
  for (let i = 0; i < maxLen / stepSize; i++) {
    gx += dx;
    gy += dy;
    if (gx - BALL_R < BORDER + CUSHION || gx + BALL_R > TW - BORDER - CUSHION ||
        gy - BALL_R < BORDER + CUSHION || gy + BALL_R > TH - BORDER - CUSHION) {
      hitPoint = { x: gx, y: gy };
      break;
    }
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

  if (hitPoint) {
    ctx.beginPath();
    ctx.arc(hitPoint.x, hitPoint.y, BALL_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (hitBall && hitPoint && guideConfig.showBallPrediction) {
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

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(barX - 4, barY - barH - 8, barW + 8, barH + 24, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, barY - barH, barW, barH, 4);
  ctx.fill();

  const colors = pct < 0.35 ? '#22c55e' : pct < 0.65 ? '#eab308' : '#ef4444';
  ctx.fillStyle = colors;
  ctx.beginPath();
  ctx.roundRect(barX, barY - barH, barW * pct, barH, 4);
  ctx.fill();

  ctx.shadowColor = colors;
  ctx.shadowBlur = 8;
  ctx.fillStyle = colors;
  ctx.beginPath();
  ctx.roundRect(barX, barY - barH, barW * pct, barH, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`POWER ${Math.round(pct * 100)}%`, barX, barY + 4);
}

// ============================================================
// FEEDBACK TEXT
// ============================================================
const FEEDBACK_LOW = ['NICE!', 'GOOD SHOT!', 'SWEET!'];
const FEEDBACK_MID = ['GREAT!', 'ON FIRE!', 'UNSTOPPABLE!'];
const FEEDBACK_HIGH = ['INCREDIBLE!', 'LEGENDARY!', 'PERFECT!'];

function pickFeedback(consecutive) {
  if (consecutive >= 4) return { text: FEEDBACK_HIGH[Math.floor(Math.random() * FEEDBACK_HIGH.length)], color: '#ef4444' };
  if (consecutive >= 2) return { text: FEEDBACK_MID[Math.floor(Math.random() * FEEDBACK_MID.length)], color: '#f59e0b' };
  return { text: FEEDBACK_LOW[Math.floor(Math.random() * FEEDBACK_LOW.length)], color: '#22c55e' };
}

// ============================================================
// CONFETTI PARTICLE SYSTEM
// ============================================================
function createConfetti() {
  const particles = [];
  const confettiColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#eab308'];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: 150 + Math.random() * 200,
      y: 80 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 4 + 2),
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
    });
  }
  return particles;
}

// ============================================================
// ERROR BOUNDARY WRAPPER (temporary debug)
// ============================================================
import { Component } from 'react';
class ArcadePoolErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ArcadePool CRASH:', error, info?.componentStack); }
  render() {
    if (this.state.error) {
      const errMsg = typeof this.state.error?.message === 'string' ? this.state.error.message : String(this.state.error);
      const errStack = typeof this.state.error?.stack === 'string' ? this.state.error.stack : '';
      return (
        <div className="p-8 text-center">
          <h2 className="text-red-400 text-xl font-bold mb-4">Arcade Pool Error</h2>
          <pre className="text-white/60 text-xs text-left bg-black/50 p-4 rounded-xl overflow-auto max-h-64 whitespace-pre-wrap">
            {errMsg}{'\n'}{errStack}
          </pre>
          <button onClick={() => { this.setState({ error: null }); this.props.onBack?.(); }}
            className="mt-4 px-6 py-2 bg-blue-500 rounded-xl text-white font-bold">Back to Lounge</button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default function ArcadePoolGameWrapper(props) {
  return <ArcadePoolErrorBoundary onBack={props.onBack}><ArcadePoolGameInner {...props} /></ArcadePoolErrorBoundary>;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
function ArcadePoolGameInner({ onBack }) {
  const { showGuide, closeGuide } = useAutoShowGuide('arcadePool');
  const [screen, setScreen] = useState('select');
  const [progress, setProgress] = useState({});
  const [selectedTier, setSelectedTier] = useState('rookie');
  const [currentLevel, setCurrentLevel] = useState(null);
  const [shotCount, setShotCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [aiming, setAiming] = useState(false);
  const [aimStart, setAimStart] = useState(null);
  const [aimEnd, setAimEnd] = useState(null);
  const [shooting, setShooting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failMessage, setFailMessage] = useState('');
  const [earnedStars, setEarnedStars] = useState(0);
  const [performanceText, setPerformanceText] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [starAnimStep, setStarAnimStep] = useState(0);

  const canvasRef = useRef(null);
  const ballsRef = useRef([]);
  const animRef = useRef(null);
  const tableImageRef = useRef(null);
  const timerRef = useRef(null);
  const consecutiveRef = useRef(0);
  const shotPocketedRef = useRef(false);
  const comboHitRef = useRef(false);
  const levelRef = useRef(null);
  const shotCountRef = useRef(0);
  const timeLeftRef = useRef(0);
  const feedbackTimerRef = useRef(null);
  const pocketedInPocketRef = useRef([]);

  // Load progress on mount
  useEffect(() => {
    setProgress(loadArcadeProgress());
  }, []);

  // Pre-render table offscreen
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = TW;
    offscreen.height = TH;
    const offCtx = offscreen.getContext('2d');
    drawTable(offCtx);
    tableImageRef.current = offscreen;
  }, []);

  // Tier unlocking: a tier is unlocked if every level in the previous tier has >= 1 star
  const isTierUnlocked = useCallback((tier) => {
    if (tier === 'rookie') return true;
    const tiers = ['rookie', 'street', 'hustler', 'pro'];
    const prevIdx = tiers.indexOf(tier) - 1;
    if (prevIdx < 0) return true;
    const prevTier = tiers[prevIdx];
    const info = TIER_INFO[prevTier];
    for (let n = info.range[0]; n <= info.range[1]; n++) {
      if (!progress[n] || progress[n].stars < 1) return false;
    }
    return true;
  }, [progress]);

  const isLevelUnlocked = useCallback((num) => {
    if (num === 1) return true;
    return progress[num - 1] && progress[num - 1].stars >= 1;
  }, [progress]);

  const totalStars = Object.values(progress).reduce((s, p) => s + (p.stars || 0), 0);

  // Start a level
  const startLevel = useCallback((levelNum) => {
    const level = LEVELS[levelNum - 1];
    if (!level) return;
    setCurrentLevel(level);
    levelRef.current = level;
    setShotCount(0);
    shotCountRef.current = 0;
    setFailed(false);
    setFailMessage('');
    setFeedback(null);
    consecutiveRef.current = 0;
    shotPocketedRef.current = false;
    comboHitRef.current = false;
    pocketedInPocketRef.current = [];

    // Clear effect arrays
    pocketFlashes.length = 0;
    pocketDrops.length = 0;
    trailParticles.length = 0;
    sparks.length = 0;

    // Setup balls
    const nonCueBalls = level.balls.filter(id => id !== 0);
    ballsRef.current = createInitialBalls(nonCueBalls);

    if (level.type === 'time') {
      setTimeLeft(level.timeLimit);
      timeLeftRef.current = level.timeLimit;
    } else {
      setTimeLeft(0);
      timeLeftRef.current = 0;
    }

    setScreen('playing');
  }, []);

  // Timer for time-based levels
  useEffect(() => {
    if (screen !== 'playing') return;
    const level = levelRef.current;
    if (!level || level.type !== 'time') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 0) {
          clearInterval(timerRef.current);
          setFailed(true);
          setFailMessage("Time's up!");
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, currentLevel]);

  // Canvas coordinate transform
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

  // Check win condition
  const checkWin = useCallback(() => {
    const level = levelRef.current;
    if (!level) return false;
    const balls = ballsRef.current;

    if (level.type === 'trick') {
      const entry = pocketedInPocketRef.current.find(e => e.ballId === level.targetBall);
      if (entry) {
        const tp = POCKETS[level.targetPocket];
        const dx = entry.pocketX - tp.x;
        const dy = entry.pocketY - tp.y;
        return Math.sqrt(dx * dx + dy * dy) < POCKET_R * 2;
      }
      return false;
    }

    if (level.type === 'combo') {
      if (!comboHitRef.current) return false;
      return balls.filter(b => b.id !== 0 && !b.pocketed).length === 0;
    }

    // clear / time: all non-cue balls pocketed
    return balls.filter(b => b.id !== 0 && !b.pocketed).length === 0;
  }, []);

  // Complete level handler
  const completeLevel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const level = levelRef.current;
    if (!level) return;

    let metric;
    let perfText;
    if (level.type === 'time') {
      metric = timeLeftRef.current;
      perfText = `${metric} seconds remaining`;
    } else {
      metric = shotCountRef.current;
      perfText = `Cleared in ${metric} shots`;
    }

    const stars = getStars(level.num, metric);
    setEarnedStars(stars);
    setPerformanceText(perfText);
    setStarAnimStep(0);

    // Save progress (keep best)
    const updated = { ...progress };
    const prev = updated[level.num];
    if (!prev || stars > prev.stars) {
      updated[level.num] = { stars, bestShots: metric };
    } else if (prev && level.type !== 'time' && metric < prev.bestShots) {
      updated[level.num] = { ...prev, bestShots: metric };
    } else if (prev && level.type === 'time' && metric > prev.bestShots) {
      updated[level.num] = { ...prev, bestShots: metric };
    }
    setProgress(updated);
    saveArcadeProgress(updated);

    playLevelComplete();
    setConfetti(createConfetti());
    setScreen('complete');
  }, [progress]);

  // Pointer handlers for aiming
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    if (shooting || failed) return;
    const pos = getCanvasPos(e);
    const cue = ballsRef.current.find(b => b.id === 0 && !b.pocketed);
    if (!cue) return;

    const dx = pos.x - cue.x;
    const dy = pos.y - cue.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 80) {
      setAiming(true);
      setAimStart({ x: cue.x, y: cue.y });
      setAimEnd(pos);
    }
  }, [shooting, failed, getCanvasPos]);

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
    shotPocketedRef.current = false;
    setAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [aiming, aimStart, aimEnd]);

  // Physics loop
  useEffect(() => {
    if (!shooting) return;
    const level = levelRef.current;
    if (!level) return;
    const tier = getTier(level.num);
    const pocketRadius = POCKET_R * POCKET_SCALE[tier];
    let pocketedThisShot = [];

    const step = () => {
      const balls = ballsRef.current;

      const anyMoving = stepPhysics(balls, {
        pocketRadius,
        onBallCollision: (vel) => playBallClick(vel),
        onWallCollision: (vel) => playCushionBounce(vel),
        onPocket: (b, p) => {
          playPocketDrop();
          pocketFlashes.push({ x: p.x, y: p.y, alpha: 1.0, radius: pocketRadius });
          pocketDrops.push({ x: b.x, y: b.y, scale: 1.0, alpha: 1.0, color: BALL_COLORS[b.id] || '#999' });
          if (!pocketedThisShot.includes(b.id)) {
            pocketedThisShot.push(b.id);
          }
          pocketedInPocketRef.current.push({ ballId: b.id, pocketX: p.x, pocketY: p.y });
        },
      });

      // Trail particles from fast balls
      for (const b of balls) {
        if (b.pocketed) continue;
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 3) {
          trailParticles.push({ x: b.x, y: b.y, alpha: Math.min(speed / 15, 0.4) });
        }
      }
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        trailParticles[i].alpha -= 0.03;
        if (trailParticles[i].alpha <= 0) trailParticles.splice(i, 1);
      }

      // Impact sparks
      if (anyMoving) {
        for (let i = 0; i < balls.length; i++) {
          if (balls[i].pocketed) continue;
          const b1 = balls[i];
          const s1 = Math.sqrt(b1.vx * b1.vx + b1.vy * b1.vy);
          if (s1 < 6) continue;
          for (let j = i + 1; j < balls.length; j++) {
            if (balls[j].pocketed) continue;
            const b2 = balls[j];
            const bDx = b2.x - b1.x;
            const bDy = b2.y - b1.y;
            const dist = Math.sqrt(bDx * bDx + bDy * bDy);
            if (dist < BALL_R * 2.5) {
              const s2 = Math.sqrt(b2.vx * b2.vx + b2.vy * b2.vy);
              if (s1 + s2 > 12) {
                const mx = (b1.x + b2.x) / 2;
                const my = (b1.y + b2.y) / 2;
                for (let k = 0; k < 4; k++) {
                  sparks.push({
                    x: mx, y: my,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    alpha: 0.8,
                  });
                }
              }
            }
          }
        }
      }

      if (anyMoving) {
        animRef.current = requestAnimationFrame(step);
      } else {
        // Shot finished
        setShooting(false);

        const nonCuePocketed = pocketedThisShot.filter(id => id !== 0);
        const cueScratch = pocketedThisShot.includes(0);

        // Increment shot counter
        const newShotCount = shotCountRef.current + 1;
        shotCountRef.current = newShotCount;
        setShotCount(newShotCount);

        // Combo detection
        if (level.type === 'combo' && nonCuePocketed.length >= level.comboTarget) {
          comboHitRef.current = true;
        }

        // Feedback popup
        if (nonCuePocketed.length > 0) {
          consecutiveRef.current += nonCuePocketed.length;
          shotPocketedRef.current = true;
          const fb = pickFeedback(consecutiveRef.current);
          setFeedback(fb);
          if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
          feedbackTimerRef.current = setTimeout(() => setFeedback(null), 1200);
        } else {
          consecutiveRef.current = 0;
          shotPocketedRef.current = false;
        }

        // Handle cue scratch
        if (cueScratch) {
          const cue = balls.find(b => b.id === 0);
          if (cue) {
            cue.pocketed = false;
            cue.x = TW * 0.25;
            cue.y = TH / 2;
            cue.vx = 0;
            cue.vy = 0;
            let attempts = 0;
            while (attempts < 20) {
              const overlap = balls.some(b => b.id !== 0 && !b.pocketed &&
                Math.sqrt((b.x - cue.x) ** 2 + (b.y - cue.y) ** 2) < BALL_R * 2.5);
              if (!overlap) break;
              cue.y += BALL_R * 3;
              if (cue.y > TH - BORDER - CUSHION - BALL_R) {
                cue.y = BORDER + CUSHION + BALL_R;
              }
              attempts++;
            }
          }
        }

        // Check win
        if (checkWin()) {
          completeLevel();
          return;
        }

        // Check fail for shot-limited levels
        if (level.type === 'clear' || level.type === 'trick' || level.type === 'combo') {
          if (newShotCount >= level.shotLimit) {
            setFailed(true);
            setFailMessage('Out of shots!');
          }
        }
      }
    };

    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [shooting, checkWin, completeLevel]);

  // Render loop
  useEffect(() => {
    if (screen !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const level = levelRef.current;
    if (!level) return;
    const tier = getTier(level.num);
    const guideConfig = AIM_GUIDE_CONFIG[tier];
    let frame;

    const render = () => {
      if (tableImageRef.current) {
        ctx.drawImage(tableImageRef.current, 0, 0);
      } else {
        drawTable(ctx);
      }

      // Draw scaled pockets overlay if scale differs from base
      const scale = POCKET_SCALE[tier];
      if (Math.abs(scale - 1.0) > 0.01) {
        const scaledR = POCKET_R * scale;
        for (const p of POCKETS) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, scaledR + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fill();
          const pocketGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, scaledR);
          pocketGrad.addColorStop(0, '#000000');
          pocketGrad.addColorStop(0.7, '#0A0A0A');
          pocketGrad.addColorStop(1, '#1A1A1A');
          ctx.beginPath();
          ctx.arc(p.x, p.y, scaledR, 0, Math.PI * 2);
          ctx.fillStyle = pocketGrad;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, p.y, scaledR + 1, 0, Math.PI * 2);
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Highlight target pocket for trick levels
      if (level.type === 'trick' && level.targetPocket !== undefined) {
        const tp = POCKETS[level.targetPocket];
        const pulse = 0.3 + Math.sin(Date.now() / 300) * 0.2;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, POCKET_R * scale + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,215,0,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, POCKET_R * scale + 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,0,${pulse * 0.15})`;
        ctx.fill();
      }

      // Pocket flash effects
      for (let i = pocketFlashes.length - 1; i >= 0; i--) {
        const f = pocketFlashes[i];
        f.alpha -= 0.03;
        f.radius += 1.5;
        if (f.alpha <= 0) { pocketFlashes.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        const flashGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        flashGrad.addColorStop(0, `rgba(255,215,0,${f.alpha * 0.6})`);
        flashGrad.addColorStop(0.5, `rgba(255,180,0,${f.alpha * 0.3})`);
        flashGrad.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = flashGrad;
        ctx.fill();
      }

      // Pocket drop animations
      for (let i = pocketDrops.length - 1; i >= 0; i--) {
        const d = pocketDrops[i];
        d.scale -= 0.04;
        d.alpha -= 0.05;
        if (d.alpha <= 0) { pocketDrops.splice(i, 1); continue; }
        ctx.globalAlpha = d.alpha;
        ctx.beginPath();
        ctx.arc(d.x, d.y, BALL_R * d.scale, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Shot trails
      for (const p of trailParticles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      }

      // Impact sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.06;
        if (s.alpha <= 0) { sparks.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,100,${s.alpha})`;
        ctx.fill();
      }

      // Balls (y-sorted for layering)
      const balls = ballsRef.current;
      const sorted = [...balls].sort((a, b) => a.y - b.y);
      for (const b of sorted) {
        // Highlight target ball for trick levels
        if (level.type === 'trick' && b.id === level.targetBall && !b.pocketed) {
          const pulse = 0.4 + Math.sin(Date.now() / 250) * 0.3;
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_R + 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,215,0,${pulse})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        drawBall(ctx, b);
      }

      // Aiming visuals
      if (aiming && aimStart && aimEnd) {
        const cue = balls.find(b => b.id === 0 && !b.pocketed);
        if (cue) {
          const adx = aimStart.x - aimEnd.x;
          const ady = aimStart.y - aimEnd.y;
          const dist = Math.sqrt(adx * adx + ady * ady);
          const power = Math.min(dist / 12, MAX_POWER);
          const angle = Math.atan2(ady, adx);

          drawAimLine(ctx, cue, angle, balls, guideConfig);
          drawCueStick(ctx, cue, angle, power);
          drawPowerBar(ctx, power);
        }
      }

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, [screen, aiming, aimStart, aimEnd, shooting, currentLevel]);

  // Star animation on complete screen
  useEffect(() => {
    if (screen !== 'complete') return;
    if (starAnimStep >= earnedStars) return;
    const timer = setTimeout(() => {
      setStarAnimStep(prev => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [screen, starAnimStep, earnedStars]);

  // Confetti animation
  useEffect(() => {
    if (screen !== 'complete' || confetti.length === 0) return;
    const interval = setInterval(() => {
      setConfetti(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          rotation: p.rotation + p.rotSpeed,
          alpha: p.alpha - 0.008,
        })).filter(p => p.alpha > 0);
        if (next.length === 0) clearInterval(interval);
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [screen, confetti.length > 0]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // ================================================================
  // RENDER: LEVEL SELECT
  // ================================================================
  if (screen === 'select') {
    const tiers = ['rookie', 'street', 'hustler', 'pro'];

    return (
      <div className="w-full max-w-4xl mx-auto px-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
            <Star size={16} fill="currentColor" />
            <span>{totalStars}/90</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-4">ARCADE POOL</h2>

        {/* Tier Tabs */}
        <div className="flex gap-1 mb-5 bg-white/[0.03] rounded-xl p-1 border border-white/5">
          {tiers.map(tier => {
            const info = TIER_INFO[tier];
            const unlocked = isTierUnlocked(tier);
            const active = selectedTier === tier;
            return (
              <button
                key={tier}
                onClick={() => unlocked && setSelectedTier(tier)}
                disabled={!unlocked}
                className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  active
                    ? 'text-white shadow-lg'
                    : unlocked
                      ? 'text-white/40 hover:text-white/70'
                      : 'text-white/15 cursor-not-allowed'
                }`}
                style={active ? { backgroundColor: info.color + '30', borderBottom: `2px solid ${info.color}` } : {}}
              >
                <span className="flex items-center justify-center gap-1.5">
                  {!unlocked && <Lock size={11} />}
                  {info.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {LEVELS.filter(l => getTier(l.num) === selectedTier).map(level => {
            const unlocked = isLevelUnlocked(level.num);
            const saved = progress[level.num];
            const stars = saved?.stars || 0;
            const info = TIER_INFO[selectedTier];

            return (
              <button
                key={level.num}
                onClick={() => unlocked && startLevel(level.num)}
                disabled={!unlocked}
                className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                  unlocked
                    ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-white/[0.01] border-white/5 cursor-not-allowed opacity-40'
                }`}
              >
                {/* Level number badge */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-1.5"
                  style={{ backgroundColor: unlocked ? info.color + '25' : '#333', color: unlocked ? info.color : '#555' }}
                >
                  {unlocked ? level.num : <Lock size={14} />}
                </div>

                {/* Level name */}
                <span className="text-white text-xs font-semibold mb-1 text-center leading-tight">{level.name}</span>

                {/* Type badge */}
                <span className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                  {level.type}
                </span>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(s => (
                    <Star
                      key={s}
                      size={13}
                      className={s <= stars ? 'text-amber-400' : 'text-white/10'}
                      fill={s <= stars ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ================================================================
  // RENDER: PLAYING
  // ================================================================
  if (screen === 'playing' && currentLevel) {
    const level = currentLevel;
    const tier = getTier(level.num);
    const info = TIER_INFO[tier];
    const showShotCounter = level.type === 'clear' || level.type === 'trick' || level.type === 'combo';
    const showTimer = level.type === 'time';

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="w-full flex flex-col items-center gap-2 relative">
        {showGuide && <HowToPlayModal gameId="arcadePool" isOpen={showGuide} onClose={closeGuide} />}
        <HelpButton gameId="arcadePool" className="absolute top-2 right-2 z-10" />
        {/* HUD */}
        <div className="flex items-center justify-between w-full max-w-[900px] px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setScreen('select');
              }}
              className="flex items-center gap-1 text-white/50 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-white font-bold text-sm">{level.name}</span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
              style={{ backgroundColor: info.color + '25', color: info.color }}
            >
              {info.name}
            </span>
          </div>

          <div className="text-right">
            {showShotCounter && (
              <span className="text-white font-mono text-sm">
                Shots: <span className={shotCount >= level.shotLimit - 2 ? 'text-red-400 font-bold' : 'text-white'}>
                  {shotCount}
                </span>
                <span className="text-white/30">/{level.shotLimit}</span>
              </span>
            )}
            {showTimer && (
              <span className={`font-mono text-lg font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-white/30 text-xs text-center max-w-[600px]">{level.description}</p>

        {/* Pool table canvas */}
        <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-amber-900/30">
          <canvas
            ref={canvasRef}
            width={TW}
            height={TH}
            className="w-full h-full"
            style={{ cursor: aiming ? 'none' : 'crosshair', touchAction: 'none' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />

          {/* Feedback popup */}
          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-[fadeInUp_0.3s_ease-out]">
              <span
                className="text-4xl md:text-5xl font-black drop-shadow-2xl"
                style={{ color: feedback.color, textShadow: `0 0 30px ${feedback.color}40` }}
              >
                {feedback.text}
              </span>
            </div>
          )}

          {/* Fail overlay */}
          {failed && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-10">
              <span className="text-red-400 text-3xl font-black">{failMessage}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => startLevel(level.num)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-all"
                >
                  <RotateCcw size={16} />
                  Try Again
                </button>
                <button
                  onClick={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setScreen('select');
                  }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 font-semibold transition-all"
                >
                  Level Select
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trick/combo hints */}
        {level.type === 'trick' && (
          <div className="text-amber-400/60 text-xs text-center">
            Pocket the {level.targetBall}-ball into the highlighted pocket
          </div>
        )}
        {level.type === 'combo' && (
          <div className="text-amber-400/60 text-xs text-center">
            Pocket {level.comboTarget}+ balls in a single shot, then clear the rest
            {comboHitRef.current && <span className="text-emerald-400 ml-2">Combo done! Clear remaining balls.</span>}
          </div>
        )}
      </div>
    );
  }

  // ================================================================
  // RENDER: LEVEL COMPLETE
  // ================================================================
  if (screen === 'complete' && currentLevel) {
    const level = currentLevel;
    const tier = getTier(level.num);
    const info = TIER_INFO[tier];
    const nextLevel = LEVELS[level.num]; // 0-indexed array, level.num is 1-indexed

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 py-8 relative">
        {/* Confetti */}
        {confetti.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((p, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size * 0.6,
                  backgroundColor: p.color,
                  opacity: p.alpha,
                  transform: `rotate(${p.rotation}deg)`,
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        )}

        {/* Trophy */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: info.color + '20' }}
        >
          <Trophy size={32} style={{ color: info.color }} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-white text-2xl font-black mb-1">LEVEL COMPLETE!</h3>
          <span className="text-white/40 text-sm">{level.name}</span>
        </div>

        {/* Stars with animation */}
        <div className="flex gap-3 my-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="transition-all duration-300"
              style={{
                transform: s <= starAnimStep ? 'scale(1)' : 'scale(0)',
                opacity: s <= starAnimStep ? 1 : 0,
                transitionDelay: `${(s - 1) * 0.15}s`,
              }}
            >
              <Star
                size={40}
                className={s <= earnedStars ? 'text-amber-400' : 'text-white/10'}
                fill={s <= earnedStars ? 'currentColor' : 'none'}
                strokeWidth={s <= earnedStars ? 0 : 1}
              />
            </div>
          ))}
        </div>

        {/* Performance text */}
        <span className="text-white/50 text-sm">{performanceText}</span>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          {nextLevel && (
            <button
              onClick={() => startLevel(nextLevel.num)}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-bold text-white transition-all hover:brightness-110"
              style={{ backgroundColor: info.color }}
            >
              Next Level
              <ChevronRight size={18} />
            </button>
          )}
          <div className="flex gap-2.5">
            <button
              onClick={() => startLevel(level.num)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-white font-semibold transition-all text-sm"
            >
              <RotateCcw size={15} />
              Retry
            </button>
            <button
              onClick={() => setScreen('select')}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 font-semibold transition-all text-sm"
            >
              Level Select
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
