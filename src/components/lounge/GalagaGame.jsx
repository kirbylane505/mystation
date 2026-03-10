/**
 * GALAGA STATION — 8K Premium Arcade Shooter
 * Canvas-rendered, 60fps, Web Audio SFX, space/cosmic theme
 * Detailed ship graphics, particle effects, nebula background
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createGalagaState,
  updateGalaga,
  playerShoot,
  movePlayer,
  getGalagaResults,
  ENEMY_TYPES,
  POWERUP_TYPES,
} from '@/lib/games/galaga';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════
const BG_COLOR = '#020108';
const STAR_LAYERS = 4;
const STAR_COUNT = [120, 80, 50, 25];
const STAR_SPEEDS = [0.008, 0.018, 0.035, 0.06];
const STAR_COLORS = [
  ['#ffffff', '#aaccff', '#88aaff'],
  ['#ffffff', '#ffddaa', '#ffcccc'],
  ['#ffffff', '#aaffcc', '#ccccff'],
  ['#ffffff', '#ffaacc', '#aaddff'],
];
const FIRE_COOLDOWN = 160;
const RAPID_FIRE_COOLDOWN = 80;

// Nebula colors
const NEBULA_COLORS = [
  { x: 0.2, y: 0.3, r: 0.35, color: 'rgba(30, 0, 80, 0.08)' },
  { x: 0.7, y: 0.6, r: 0.4, color: 'rgba(0, 40, 80, 0.06)' },
  { x: 0.5, y: 0.15, r: 0.25, color: 'rgba(60, 0, 40, 0.05)' },
  { x: 0.85, y: 0.85, r: 0.3, color: 'rgba(0, 60, 60, 0.04)' },
];

// ═══════════════════════════════════════════════════
// WEB AUDIO SFX (layered on top of MyStation music)
// ═══════════════════════════════════════════════════
let audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  return audioCtx;
}

function sfxShoot() {
  const ctx = getAudio(); if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1100, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.03);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.05);
}

function sfxExplosion(big = false) {
  const ctx = getAudio(); if (!ctx) return;
  const dur = big ? 0.35 : 0.12;
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * (big ? 0.35 : 0.18)));
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(big ? 800 : 2000, ctx.currentTime);
  src.buffer = buf;
  gain.gain.setValueAtTime(big ? 0.1 : 0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
  src.start();
}

function sfxPowerup() {
  const ctx = getAudio(); if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
    gain.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.12);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.06);
    osc.stop(ctx.currentTime + i * 0.06 + 0.12);
  });
}

function sfxDeath() {
  const ctx = getAudio(); if (!ctx) return;
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc2.type = 'square';
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
  osc2.frequency.setValueAtTime(300, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc2.start();
  osc.stop(ctx.currentTime + 0.4); osc2.stop(ctx.currentTime + 0.4);
}

function sfxWave() {
  const ctx = getAudio(); if (!ctx) return;
  [392, 494, 587, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.2);
  });
}

function sfxHit() {
  const ctx = getAudio(); if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.06);
}

// ═══════════════════════════════════════════════════
// STAR FIELD (pre-generated, parallax, colored)
// ═══════════════════════════════════════════════════
function generateStars() {
  const layers = [];
  for (let l = 0; l < STAR_LAYERS; l++) {
    const stars = [];
    const colors = STAR_COLORS[l];
    for (let i = 0; i < STAR_COUNT[l]; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.3 + l * 0.4 + Math.random() * 0.6,
        brightness: 0.15 + l * 0.15 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2,
      });
    }
    layers.push(stars);
  }
  return layers;
}

// ═══════════════════════════════════════════════════
// PREMIUM DRAWING FUNCTIONS
// ═══════════════════════════════════════════════════

function drawShip(ctx, px, py, W, H, state) {
  const pl = state.player;
  const blink = pl.invincible && Math.floor(state.elapsed / 100) % 3 === 0;
  if (blink) return;

  const scale = Math.min(W, H) / 500;
  const s = Math.max(1, scale);

  // Engine flames (dual)
  const flicker = 0.7 + Math.random() * 0.3;
  const flameLen = 18 * s * flicker;

  // Left engine flame
  const lgL = ctx.createLinearGradient(px - 5 * s, py + 8 * s, px - 5 * s, py + 8 * s + flameLen);
  lgL.addColorStop(0, 'rgba(0, 200, 255, 0.9)');
  lgL.addColorStop(0.3, 'rgba(100, 150, 255, 0.6)');
  lgL.addColorStop(0.7, 'rgba(150, 50, 255, 0.3)');
  lgL.addColorStop(1, 'rgba(150, 50, 255, 0)');
  ctx.fillStyle = lgL;
  ctx.beginPath();
  ctx.moveTo(px - 8 * s, py + 8 * s);
  ctx.lineTo(px - 5 * s, py + 8 * s + flameLen);
  ctx.lineTo(px - 2 * s, py + 8 * s);
  ctx.fill();

  // Right engine flame
  const lgR = ctx.createLinearGradient(px + 5 * s, py + 8 * s, px + 5 * s, py + 8 * s + flameLen);
  lgR.addColorStop(0, 'rgba(0, 200, 255, 0.9)');
  lgR.addColorStop(0.3, 'rgba(100, 150, 255, 0.6)');
  lgR.addColorStop(0.7, 'rgba(150, 50, 255, 0.3)');
  lgR.addColorStop(1, 'rgba(150, 50, 255, 0)');
  ctx.fillStyle = lgR;
  ctx.beginPath();
  ctx.moveTo(px + 2 * s, py + 8 * s);
  ctx.lineTo(px + 5 * s, py + 8 * s + flameLen);
  ctx.lineTo(px + 8 * s, py + 8 * s);
  ctx.fill();

  // Engine glow
  ctx.shadowColor = '#00aaff';
  ctx.shadowBlur = 20 * s;

  // Ship hull (detailed arrow shape)
  ctx.fillStyle = '#c8e0ff';
  ctx.beginPath();
  // Nose
  ctx.moveTo(px, py - 16 * s);
  // Right wing
  ctx.lineTo(px + 4 * s, py - 8 * s);
  ctx.lineTo(px + 14 * s, py + 6 * s);
  ctx.lineTo(px + 16 * s, py + 10 * s);
  ctx.lineTo(px + 10 * s, py + 8 * s);
  // Right body
  ctx.lineTo(px + 6 * s, py + 8 * s);
  // Bottom
  ctx.lineTo(px + 3 * s, py + 4 * s);
  ctx.lineTo(px - 3 * s, py + 4 * s);
  // Left body
  ctx.lineTo(px - 6 * s, py + 8 * s);
  ctx.lineTo(px - 10 * s, py + 8 * s);
  // Left wing
  ctx.lineTo(px - 16 * s, py + 10 * s);
  ctx.lineTo(px - 14 * s, py + 6 * s);
  ctx.lineTo(px - 4 * s, py - 8 * s);
  ctx.closePath();
  ctx.fill();

  // Wing accent lines
  ctx.strokeStyle = '#5090ff';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(px + 5 * s, py - 4 * s);
  ctx.lineTo(px + 13 * s, py + 7 * s);
  ctx.moveTo(px - 5 * s, py - 4 * s);
  ctx.lineTo(px - 13 * s, py + 7 * s);
  ctx.stroke();

  // Cockpit (glowing)
  const cockpitGrad = ctx.createRadialGradient(px, py - 6 * s, 0, px, py - 6 * s, 5 * s);
  cockpitGrad.addColorStop(0, '#80ffff');
  cockpitGrad.addColorStop(0.5, '#0088ff');
  cockpitGrad.addColorStop(1, '#004488');
  ctx.fillStyle = cockpitGrad;
  ctx.beginPath();
  ctx.ellipse(px, py - 6 * s, 3 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Shield bubble (pulsing)
  if (pl.shield) {
    const pulse = 0.8 + Math.sin(state.elapsed / 200) * 0.2;
    ctx.strokeStyle = `rgba(57, 255, 20, ${0.3 * pulse})`;
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(px, py - 2 * s, 22 * s * pulse, 0, Math.PI * 2);
    ctx.stroke();
    // Inner glow
    ctx.strokeStyle = `rgba(57, 255, 20, ${0.15 * pulse})`;
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(px, py - 2 * s, 20 * s * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(ctx, e, W, H, elapsed) {
  const et = ENEMY_TYPES[e.type];
  const ex = e.x * W;
  const ey = e.y * H;
  const sz = et.size * (Math.min(W, H) / 500);
  const flash = e.hitFlash > 0;

  // Glow
  ctx.shadowColor = flash ? '#fff' : et.color;
  ctx.shadowBlur = flash ? 20 : 10;

  const fillColor = flash ? '#ffffff' : et.color;
  const accentColor = flash ? '#cccccc' : et.accent;

  ctx.fillStyle = fillColor;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;

  if (e.type === 'grunt') {
    // Diamond with inner detail
    ctx.beginPath();
    ctx.moveTo(ex, ey - sz);
    ctx.lineTo(ex + sz * 0.75, ey);
    ctx.lineTo(ex, ey + sz * 0.8);
    ctx.lineTo(ex - sz * 0.75, ey);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner eye
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(ex, ey - sz * 0.1, sz * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'swooper') {
    // Curved wing shape
    ctx.beginPath();
    ctx.moveTo(ex, ey - sz);
    ctx.quadraticCurveTo(ex + sz * 1.2, ey - sz * 0.3, ex + sz * 0.8, ey + sz * 0.6);
    ctx.lineTo(ex + sz * 0.2, ey + sz * 0.3);
    ctx.lineTo(ex, ey + sz * 0.5);
    ctx.lineTo(ex - sz * 0.2, ey + sz * 0.3);
    ctx.lineTo(ex - sz * 0.8, ey + sz * 0.6);
    ctx.quadraticCurveTo(ex - sz * 1.2, ey - sz * 0.3, ex, ey - sz);
    ctx.fill();
    ctx.stroke();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex - sz * 0.25, ey - sz * 0.15, sz * 0.12, 0, Math.PI * 2);
    ctx.arc(ex + sz * 0.25, ey - sz * 0.15, sz * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.type === 'tank') {
    // Hexagonal armor
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](ex + Math.cos(a) * sz, ey + Math.sin(a) * sz);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner hex
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](ex + Math.cos(a) * sz * 0.5, ey + Math.sin(a) * sz * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    // Armor lines
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const a1 = (Math.PI / 3) * i - Math.PI / 6;
      const a2 = a1 + Math.PI;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(a1) * sz * 0.5, ey + Math.sin(a1) * sz * 0.5);
      ctx.lineTo(ex + Math.cos(a2) * sz * 0.5, ey + Math.sin(a2) * sz * 0.5);
      ctx.stroke();
    }
  } else if (e.type === 'bomber') {
    // Square with turret
    const rot = elapsed / 800 + e.animOffset;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(Math.sin(rot) * 0.15);
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(-sz * 0.7, -sz * 0.7, sz * 1.4, sz * 1.4);
    ctx.fill();
    ctx.stroke();
    // Cross pattern
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.7); ctx.lineTo(0, sz * 0.7);
    ctx.moveTo(-sz * 0.7, 0); ctx.lineTo(sz * 0.7, 0);
    ctx.stroke();
    // Turret
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(0, sz * 0.4, sz * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (e.type === 'boss') {
    // Massive star/crown shape with pulsing
    const pulse = 1 + Math.sin(elapsed / 300) * 0.05;
    const bsz = sz * pulse;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? bsz : bsz * 0.55;
      const method = i === 0 ? 'moveTo' : 'lineTo';
      ctx[method](ex + Math.cos(a) * r, ey + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner glow circle
    const bossGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, bsz * 0.5);
    bossGrad.addColorStop(0, 'rgba(255, 255, 200, 0.5)');
    bossGrad.addColorStop(1, 'rgba(255, 200, 0, 0)');
    ctx.fillStyle = bossGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, bsz * 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Crown jewels
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(ex, ey - bsz * 0.2, bsz * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3333ff';
    ctx.beginPath();
    ctx.arc(ex - bsz * 0.2, ey + bsz * 0.1, bsz * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#33ff33';
    ctx.beginPath();
    ctx.arc(ex + bsz * 0.2, ey + bsz * 0.1, bsz * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;

  // HP bar for multi-hit enemies
  if (et.hp > 1 && e.maxHp) {
    const hpPct = e.hp / e.maxHp;
    const barW = sz * 2;
    const barH = 3;
    const barY = ey + sz + 6;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(ex - barW / 2, barY, barW, barH);
    // Color gradient based on HP
    const hpColor = hpPct > 0.5 ? et.color : hpPct > 0.25 ? '#ff8800' : '#ff2222';
    ctx.fillStyle = hpColor;
    ctx.fillRect(ex - barW / 2, barY, barW * hpPct, barH);
  }
}

function drawGame(ctx, canvas, state, stars, dt) {
  const W = canvas.width;
  const H = canvas.height;

  // Screen shake
  let shakeX = 0, shakeY = 0;
  if (state.shakeTimer > 0) {
    const intensity = state.shakeTimer / 500;
    shakeX = (Math.random() - 0.5) * 6 * intensity;
    shakeY = (Math.random() - 0.5) * 6 * intensity;
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  // ─── Background ───
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(-10, -10, W + 20, H + 20);

  // Nebula clouds (subtle)
  NEBULA_COLORS.forEach(n => {
    const grad = ctx.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * W);
    grad.addColorStop(0, n.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });

  // ─── Stars (with twinkle) ───
  stars.forEach((layer, l) => {
    layer.forEach(star => {
      star.y += STAR_SPEEDS[l] * dt / 16;
      if (star.y > 1) star.y -= 1;
      star.twinkle += star.twinkleSpeed * dt / 1000;
      const twinkleAlpha = 0.5 + Math.sin(star.twinkle) * 0.5;
      const alpha = star.brightness * twinkleAlpha;
      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(star.x * W, star.y * H, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright stars get a cross flare
      if (l >= 2 && star.size > 1) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillRect(star.x * W - star.size * 2, star.y * H - 0.3, star.size * 4, 0.6);
        ctx.fillRect(star.x * W - 0.3, star.y * H - star.size * 2, 0.6, star.size * 4);
      }
    });
  });
  ctx.globalAlpha = 1;

  // ─── Enemies ───
  state.enemies.forEach(e => {
    drawEnemy(ctx, e, W, H, state.elapsed);
  });

  // ─── Power-ups (pulsing, detailed) ───
  state.powerups.forEach(p => {
    const pu = POWERUP_TYPES[p.type];
    const px = p.x * W;
    const py = p.y * H;
    const pulse = 1 + Math.sin(state.elapsed / 200) * 0.15;
    const r = 10 * pulse;

    // Outer glow
    ctx.shadowColor = pu.color;
    ctx.shadowBlur = 18;
    // Ring
    ctx.strokeStyle = pu.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();
    // Fill
    ctx.fillStyle = pu.color + '40';
    ctx.fill();
    ctx.shadowBlur = 0;
    // Icon
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(10 * pulse)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pu.icon, px, py + 1);
  });

  // ─── Player bullets (glowing beams) ───
  state.bullets.forEach(b => {
    const bx = b.x * W;
    const by = b.y * H;
    // Trail
    const trailGrad = ctx.createLinearGradient(bx, by + 10, bx, by - 4);
    trailGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    trailGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
    trailGrad.addColorStop(1, 'rgba(200, 240, 255, 0.9)');
    ctx.fillStyle = trailGrad;
    ctx.fillRect(bx - 1.5, by - 4, 3, 14);
    // Core
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx - 1, by - 4, 2, 8);
    ctx.shadowBlur = 0;
  });

  // ─── Enemy bullets (red orbs) ───
  state.enemyBullets.forEach(b => {
    const bx = b.x * W;
    const by = b.y * H;
    ctx.shadowColor = '#ff3864';
    ctx.shadowBlur = 10;
    // Outer
    ctx.fillStyle = '#ff3864';
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
    // Inner core
    ctx.fillStyle = '#ffaacc';
    ctx.beginPath();
    ctx.arc(bx, by, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // ─── Particles (circles, sparks, debris) ───
  state.particles.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    const px = p.x * W;
    const py = p.y * H;

    if (p.type === 'spark') {
      // Line spark
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - p.vx * 3000, py - p.vy * 3000);
      ctx.stroke();
    } else if (p.type === 'debris') {
      // Rotating square debris
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(p.rotation || 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    } else {
      // Circle particle with glow
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  // ─── Score Popups (floating text) ───
  state.scorePopups.forEach(p => {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.font = `bold ${Math.round(12 + (1 - alpha) * 4)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.text, p.x * W, p.y * H);
  });
  ctx.globalAlpha = 1;

  // ─── Player ship ───
  if (state.phase !== 'gameover') {
    drawShip(ctx, state.player.x * W, state.player.y * H, W, H, state);
  }

  // ─── Nuke flash ───
  if (state.nukeFlash > 0) {
    ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * (state.nukeFlash / 400)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ═══════════════════════════════════════
  // HUD — Premium styled
  // ═══════════════════════════════════════
  ctx.shadowBlur = 0;

  // Score (top left, large)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE`, 14, 10);
  ctx.font = 'bold 24px system-ui';
  ctx.fillStyle = '#00f0ff';
  ctx.fillText(state.player.score.toLocaleString(), 14, 30);

  // Wave (top center)
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px system-ui';
  ctx.fillText('WAVE', W / 2, 10);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px system-ui';
  ctx.fillText(state.wave, W / 2, 24);

  // Lives (top right — ship icons)
  for (let i = 0; i < state.player.lives; i++) {
    const lx = W - 20 - i * 20;
    const ly = 22;
    ctx.fillStyle = '#00c8ff';
    ctx.beginPath();
    ctx.moveTo(lx, ly - 7);
    ctx.lineTo(lx + 6, ly + 5);
    ctx.lineTo(lx + 2, ly + 3);
    ctx.lineTo(lx - 2, ly + 3);
    ctx.lineTo(lx - 6, ly + 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText('LIVES', W - 14, 10);

  // Combo indicator
  if (state.player.combo > 1) {
    const comboAlpha = Math.min(1, state.player.comboTimer / 500);
    ctx.textAlign = 'center';
    ctx.globalAlpha = comboAlpha;
    ctx.fillStyle = state.player.combo >= 5 ? '#ffd700' : '#ff6bef';
    ctx.font = `bold ${16 + state.player.combo}px system-ui`;
    ctx.fillText(`${state.player.combo}x COMBO`, W / 2, 55);
    ctx.globalAlpha = 1;
  }

  // Active power-ups (left side, styled)
  let puY = 62;
  const puFont = 'bold 11px system-ui';
  if (state.player.shield) {
    ctx.fillStyle = '#39ff14';
    ctx.font = puFont;
    ctx.textAlign = 'left';
    ctx.fillText('[ SHIELD ]', 14, puY);
    puY += 18;
  }
  if (state.player.rapidFire) {
    const remaining = Math.max(0, (state.player.rapidFireEnd - state.elapsed) / 1000);
    ctx.fillStyle = '#00f0ff';
    ctx.font = puFont;
    ctx.textAlign = 'left';
    ctx.fillText(`[ RAPID FIRE ${remaining.toFixed(1)}s ]`, 14, puY);
    puY += 18;
  }
  if (state.player.spreadShot) {
    const remaining = Math.max(0, (state.player.spreadShotEnd - state.elapsed) / 1000);
    ctx.fillStyle = '#ff00ff';
    ctx.font = puFont;
    ctx.textAlign = 'left';
    ctx.fillText(`[ SPREAD ${remaining.toFixed(1)}s ]`, 14, puY);
  }

  // Wave transition announcement
  if (state.waveTransition) {
    const progress = 1 - state.waveTransitionTimer / 2500;
    const fadeIn = Math.min(1, progress * 4);
    const fadeOut = Math.min(1, (1 - progress) * 4);
    const alpha = Math.min(fadeIn, fadeOut);
    ctx.globalAlpha = alpha;
    // Dark band
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, H / 2 - 40, W, 80);
    // Text
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`WAVE ${state.wave + 1}`, W / 2, H / 2 - 8);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px system-ui';
    ctx.fillText('GET READY', W / 2, H / 2 + 18);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export default function GalagaGame({ onBack, gameState: externalState, myPlayerId, onMove }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const starsRef = useRef(null);
  const keysRef = useRef({});
  const lastFireRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const touchRef = useRef({ active: false, x: 0 });
  const prevScoreRef = useRef(0);
  const prevLivesRef = useRef(5);
  const prevWaveRef = useRef(1);
  const prevEnemyCountRef = useRef(0);

  const { showGuide, closeGuide } = useAutoShowGuide('galaga');
  const [phase, setPhase] = useState('ready');
  const [finalScore, setFinalScore] = useState(0);
  const [finalWave, setFinalWave] = useState(1);
  const [finalCombo, setFinalCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Load high score
  useEffect(() => {
    try {
      const hs = parseInt(localStorage.getItem('galaga-highscore') || '0', 10);
      setHighScore(hs);
    } catch { /* */ }
  }, []);

  // Init stars once
  useEffect(() => {
    if (!starsRef.current) starsRef.current = generateStars();
  }, []);

  // Resize canvas (DPR-aware)
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    stateRef.current = createGalagaState('solo');
    stateRef.current.phase = 'playing';
    stateRef.current.startTime = performance.now();
    prevScoreRef.current = 0;
    prevLivesRef.current = 5;
    prevWaveRef.current = 1;
    prevEnemyCountRef.current = 0;
    setPhase('playing');
    sfxWave();
    getAudio();
  }, []);

  // Main game loop
  useEffect(() => {
    if (phase !== 'playing') return;

    const loop = (timestamp) => {
      if (!stateRef.current || stateRef.current.phase !== 'playing') {
        if (stateRef.current?.phase === 'gameover') {
          const results = getGalagaResults(stateRef.current);
          setFinalScore(results.score);
          setFinalWave(results.wave);
          setFinalCombo(results.maxCombo);
          setPhase('gameover');
          sfxDeath();
          try {
            const prev = parseInt(localStorage.getItem('galaga-highscore') || '0', 10);
            if (results.score > prev) {
              localStorage.setItem('galaga-highscore', String(results.score));
              setHighScore(results.score);
            }
          } catch { /* */ }
          // Report score to room if in multiplayer
          if (onMove) {
            try { onMove('gameover', { score: results.score }); } catch { /* */ }
          }
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }

      const dt = lastTimeRef.current ? Math.min(timestamp - lastTimeRef.current, 33) : 16;
      lastTimeRef.current = timestamp;

      // ─── Input ───
      const keys = keysRef.current;
      const moveSpeed = 0.0006;
      if (keys['ArrowLeft'] || keys['a']) {
        stateRef.current = movePlayer(stateRef.current, -moveSpeed * dt);
      }
      if (keys['ArrowRight'] || keys['d']) {
        stateRef.current = movePlayer(stateRef.current, moveSpeed * dt);
      }

      // Touch move
      if (touchRef.current.active && canvas) {
        const rect = canvas.getBoundingClientRect();
        const targetX = (touchRef.current.x - rect.left) / rect.width;
        const dx = targetX - stateRef.current.player.x;
        stateRef.current = movePlayer(stateRef.current, dx * 0.15);
      }

      // Auto-fire
      const fireKey = keys[' '] || keys['ArrowUp'] || keys['w'] || touchRef.current.active;
      const cooldown = stateRef.current.player.rapidFire ? RAPID_FIRE_COOLDOWN : FIRE_COOLDOWN;
      if (fireKey && timestamp - lastFireRef.current > cooldown) {
        stateRef.current = playerShoot(stateRef.current);
        lastFireRef.current = timestamp;
        sfxShoot();
      }

      // Update
      stateRef.current = updateGalaga(stateRef.current, dt, canvas.width, canvas.height);

      // ─── SFX triggers ───
      const currentEnemyCount = stateRef.current.enemies.length;
      if (currentEnemyCount < prevEnemyCountRef.current) {
        const diff = prevEnemyCountRef.current - currentEnemyCount;
        if (diff > 0) sfxExplosion(diff > 3);
      }
      prevEnemyCountRef.current = currentEnemyCount;

      if (stateRef.current.player.lives < prevLivesRef.current) {
        sfxDeath();
      }
      prevLivesRef.current = stateRef.current.player.lives;

      if (stateRef.current.wave > prevWaveRef.current) {
        sfxWave();
      }
      prevWaveRef.current = stateRef.current.wave;

      // Powerup pickup SFX
      if (stateRef.current.player.score > prevScoreRef.current) {
        const jump = stateRef.current.player.score - prevScoreRef.current;
        if (jump > 800) sfxPowerup();
      }
      prevScoreRef.current = stateRef.current.player.score;

      // ─── Draw ───
      const c = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      c.save();
      c.scale(1 / dpr, 1 / dpr);
      drawGame(c, { width: canvas.width / dpr, height: canvas.height / dpr }, stateRef.current, starsRef.current, dt);
      c.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, onMove]);

  // Keyboard
  useEffect(() => {
    const down = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w'].includes(e.key)) {
        e.preventDefault();
        keysRef.current[e.key] = true;
      }
    };
    const up = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const start = (e) => {
      e.preventDefault();
      const t = e.touches[0];
      touchRef.current = { active: true, x: t.clientX };
    };
    const move = (e) => {
      if (!touchRef.current.active) return;
      e.preventDefault();
      touchRef.current.x = e.touches[0].clientX;
    };
    const end = () => { touchRef.current.active = false; };
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);
    return () => {
      canvas.removeEventListener('touchstart', start);
      canvas.removeEventListener('touchmove', move);
      canvas.removeEventListener('touchend', end);
      canvas.removeEventListener('touchcancel', end);
    };
  }, []);

  // Idle star animation (ready/gameover screens)
  useEffect(() => {
    if (phase === 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas || !starsRef.current) return;

    const idle = () => {
      const c = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      c.save();
      c.scale(1 / dpr, 1 / dpr);
      c.fillStyle = BG_COLOR;
      c.fillRect(0, 0, W, H);
      // Nebula
      NEBULA_COLORS.forEach(n => {
        const grad = c.createRadialGradient(n.x * W, n.y * H, 0, n.x * W, n.y * H, n.r * W);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        c.fillStyle = grad;
        c.fillRect(0, 0, W, H);
      });
      // Stars
      starsRef.current.forEach((layer, l) => {
        layer.forEach(star => {
          star.y += STAR_SPEEDS[l] * 0.4;
          if (star.y > 1) star.y -= 1;
          star.twinkle += star.twinkleSpeed * 0.016;
          const tw = 0.5 + Math.sin(star.twinkle) * 0.5;
          c.globalAlpha = star.brightness * tw;
          c.fillStyle = star.color;
          c.beginPath();
          c.arc(star.x * W, star.y * H, star.size, 0, Math.PI * 2);
          c.fill();
        });
      });
      c.globalAlpha = 1;
      c.restore();
      rafRef.current = requestAnimationFrame(idle);
    };
    rafRef.current = requestAnimationFrame(idle);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {showGuide && <HowToPlayModal gameId="galaga" isOpen={showGuide} onClose={closeGuide} />}
      <HelpButton gameId="galaga" className="absolute top-2 right-2 z-10" />
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-2xl"
        style={{ aspectRatio: '3/4', maxHeight: '75vh', touchAction: 'none', background: BG_COLOR }}
      />

      {/* Ready Screen Overlay */}
      {phase === 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl z-10">
          <div className="text-center px-6">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 tracking-tight pb-1"
                style={{ textShadow: '0 0 60px rgba(0,200,255,0.3)' }}>
              GALAGA STATION
            </h2>
            <p className="text-white/25 text-sm mb-8 tracking-wide">Defend the cosmos. Rack up combos. Set the high score.</p>

            {highScore > 0 && (
              <div className="mb-6">
                <p className="text-white/20 text-[10px] uppercase tracking-widest mb-1">High Score</p>
                <p className="text-amber-400 text-2xl font-black font-mono">{highScore.toLocaleString()}</p>
              </div>
            )}

            <button
              onClick={startGame}
              className="group px-12 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white font-black text-xl rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-400/40"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">&#9654;</span>
                START GAME
              </span>
            </button>

            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-center gap-6 text-white/15 text-xs">
                <span>Arrow keys / WASD</span>
                <span className="w-px h-3 bg-white/10" />
                <span>Space to shoot</span>
              </div>
              <p className="text-white/10 text-[10px]">Mobile: touch & drag + auto-fire</p>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="mt-6 text-white/15 hover:text-white/40 text-xs transition"
              >
                Back to Lounge
              </button>
            )}
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {phase === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl z-10">
          <div className="text-center px-6">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2"
                style={{ textShadow: '0 0 40px rgba(255,56,100,0.3)' }}>
              GAME OVER
            </h2>

            {finalScore >= highScore && finalScore > 0 && (
              <p className="text-amber-400 font-black text-sm mb-4 animate-pulse tracking-widest">
                NEW HIGH SCORE!
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                <p className="text-white/20 text-[9px] uppercase tracking-widest mb-1">Score</p>
                <p className="text-cyan-400 font-black text-2xl">{finalScore.toLocaleString()}</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                <p className="text-white/20 text-[9px] uppercase tracking-widest mb-1">Wave</p>
                <p className="text-white font-black text-2xl">{finalWave}</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                <p className="text-white/20 text-[9px] uppercase tracking-widest mb-1">Max Combo</p>
                <p className="text-amber-400 font-black text-2xl">{finalCombo}x</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={startGame}
                className="px-10 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 text-white font-black text-lg rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl shadow-cyan-500/25"
              >
                PLAY AGAIN
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-6 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/40 hover:text-white font-bold rounded-2xl transition"
                >
                  BACK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
