# Pool Dual Upgrade + How to Play Guides — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split pool into Arcade Mode (solo, Rookie-to-Pro, kid-friendly) and upgraded 8-Ball multiplayer, plus add How to Play guides to all 7 Lounge games.

**Architecture:** Extract shared physics from PoolGame.jsx into poolPhysics.js. Build ArcadePoolGame.jsx as a standalone component with 30 levels across 4 tiers. Upgrade PoolGame.jsx visuals in-place. Add HowToPlayModal.jsx as a universal guide system for all games. Arcade mode is launched from GameModeModal as a third option alongside Quick Play and With Friends.

**Tech Stack:** React 19, Canvas 2D, Web Audio API, Zustand, localStorage (arcade progress), no new dependencies.

---

### Task 1: Extract Shared Physics Engine

**Files:**
- Create: `src/lib/games/poolPhysics.js`
- Modify: `src/components/lounge/PoolGame.jsx`

**Step 1: Create poolPhysics.js with all physics constants and functions**

Create `src/lib/games/poolPhysics.js` with these exports extracted from PoolGame.jsx:

```js
/**
 * KICKBACK LOUNGE — Pool Physics Engine (Shared)
 * Used by both ArcadePoolGame and PoolGame (8-Ball multiplayer)
 */

// Table & Physics Constants
export const TW = 1200;
export const TH = 600;
export const BORDER = 40;
export const CUSHION = 8;
export const BALL_R = 13;
export const POCKET_R = 22;
export const FRICTION = 0.988;
export const MIN_VEL = 0.06;
export const MAX_POWER = 22;
export const WALL_BOUNCE = 0.7;
export const BALL_BOUNCE = 0.96;

export const POCKETS = [
  { x: BORDER + 6, y: BORDER + 6 },
  { x: TW / 2, y: BORDER - 4 },
  { x: TW - BORDER - 6, y: BORDER + 6 },
  { x: BORDER + 6, y: TH - BORDER - 6 },
  { x: TW / 2, y: TH - BORDER + 4 },
  { x: TW - BORDER - 6, y: TH - BORDER - 6 },
];

export const BALL_COLORS = {
  0: '#F8F8F0', 1: '#F5C518', 2: '#1A3FC7', 3: '#D4261D', 4: '#5B2C8E',
  5: '#E87511', 6: '#1B8C4B', 7: '#8B1A1A', 8: '#111111', 9: '#F5C518',
  10: '#1A3FC7', 11: '#D4261D', 12: '#5B2C8E', 13: '#E87511', 14: '#1B8C4B', 15: '#8B1A1A',
};

export const isStripe = (id) => id >= 9 && id <= 15;
export const isSolid = (id) => id >= 1 && id <= 7;

export const RACK_ORDER = [
  [1], [11, 2], [9, 8, 3], [12, 4, 10, 5], [13, 6, 15, 7, 14],
];

/**
 * Create initial ball positions for a standard rack
 * @param {number[]} [ballIds] - specific ball IDs to include (default: full rack 0-15)
 */
export function createInitialBalls(ballIds = null) {
  const balls = [];
  balls.push({ id: 0, x: TW * 0.25, y: TH / 2, vx: 0, vy: 0, pocketed: false });

  if (ballIds && !ballIds.includes(0)) {
    // Caller only wants specific balls — skip cue if not listed
  }

  const rackX = TW * 0.72;
  const rackY = TH / 2;
  const spacing = BALL_R * 2.06;
  const rowDx = spacing * Math.sqrt(3) / 2;

  if (ballIds) {
    // Place specific balls in a compact arrangement
    const targetBalls = ballIds.filter(id => id !== 0);
    const rows = [];
    let remaining = [...targetBalls];
    let rowSize = 1;
    while (remaining.length > 0) {
      rows.push(remaining.splice(0, rowSize));
      rowSize++;
    }
    rows.forEach((row, ri) => {
      row.forEach((ballId, ci) => {
        balls.push({
          id: ballId,
          x: rackX + ri * rowDx,
          y: rackY + (ci - (row.length - 1) / 2) * spacing,
          vx: 0, vy: 0, pocketed: false,
        });
      });
    });
  } else {
    // Standard full rack
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
  }
  return balls;
}

/**
 * Run one physics frame (with sub-stepping)
 * @param {object[]} balls - array of ball objects { id, x, y, vx, vy, pocketed }
 * @param {object} config - { pockets, pocketRadius, subSteps, onBallCollision, onWallCollision, onPocket }
 * @returns {boolean} anyMoving - true if balls are still in motion
 */
export function stepPhysics(balls, config = {}) {
  const {
    pockets = POCKETS,
    pocketRadius = POCKET_R,
    subSteps = 3,
    onBallCollision,
    onWallCollision,
    onPocket,
  } = config;

  const inner = BORDER + CUSHION;
  let anyMoving = false;

  for (let sub = 0; sub < subSteps; sub++) {
    for (const b of balls) {
      if (b.pocketed) continue;
      b.x += b.vx / subSteps;
      b.y += b.vy / subSteps;

      // Wall collisions
      if (b.x - BALL_R < inner) {
        if (sub === 0 && onWallCollision) onWallCollision(Math.abs(b.vx));
        b.x = inner + BALL_R;
        b.vx = Math.abs(b.vx) * WALL_BOUNCE;
      }
      if (b.x + BALL_R > TW - inner) {
        if (sub === 0 && onWallCollision) onWallCollision(Math.abs(b.vx));
        b.x = TW - inner - BALL_R;
        b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
      }
      if (b.y - BALL_R < inner) {
        if (sub === 0 && onWallCollision) onWallCollision(Math.abs(b.vy));
        b.y = inner + BALL_R;
        b.vy = Math.abs(b.vy) * WALL_BOUNCE;
      }
      if (b.y + BALL_R > TH - inner) {
        if (sub === 0 && onWallCollision) onWallCollision(Math.abs(b.vy));
        b.y = TH - inner - BALL_R;
        b.vy = -Math.abs(b.vy) * WALL_BOUNCE;
      }

      // Pocket detection
      for (const p of pockets) {
        const pdx = b.x - p.x;
        const pdy = b.y - p.y;
        if (Math.sqrt(pdx * pdx + pdy * pdy) < pocketRadius) {
          b.pocketed = true;
          b.vx = 0;
          b.vy = 0;
          if (onPocket) onPocket(b, p);
          break;
        }
      }
    }

    // Ball-ball collisions
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
            if (sub === 0 && onBallCollision) onBallCollision(dvn);
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
  }

  // Friction (once per frame)
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

  return anyMoving;
}
```

**Step 2: Modify PoolGame.jsx to import from poolPhysics.js**

In `src/components/lounge/PoolGame.jsx`, replace the inline constants and physics code:
- Remove lines 14-34 (constants — TW, TH, BORDER, CUSHION, BALL_R, POCKET_R, FRICTION, MIN_VEL, MAX_POWER, WALL_BOUNCE, BALL_BOUNCE, POCKETS, BALL_COLORS, isStripe, isSolid)
- Remove lines 166-192 (RACK_ORDER, createInitialBalls)
- Add import at top: `import { TW, TH, BORDER, CUSHION, BALL_R, POCKET_R, MAX_POWER, BALL_COLORS, isStripe, POCKETS, createInitialBalls, stepPhysics } from '@/lib/games/poolPhysics';`
- Replace the inline physics loop in the shooting useEffect (lines 771-855) with a call to `stepPhysics(balls, { onBallCollision: playBallClick, onWallCollision: playCushionBounce, onPocket: (b, p) => { playPocketDrop(); pocketFlashes.push({ x: p.x, y: p.y, alpha: 1.0, radius: POCKET_R }); if (!pocketed.includes(b.id)) pocketed.push(b.id); } })`

**Step 3: Verify PoolGame still works identically**

Open the lounge, start a Quick Play pool game, shoot balls, verify:
- Physics feel identical
- Sounds still play on collisions, pockets, cushions
- Pocket flash effects still work
- AI opponent still fires shots
- Ball positions update correctly

**Step 4: Commit**

```bash
git add src/lib/games/poolPhysics.js src/components/lounge/PoolGame.jsx
git commit -m "refactor: extract shared pool physics engine from PoolGame"
```

---

### Task 2: Upgrade PoolGame.jsx Visuals

**Files:**
- Modify: `src/components/lounge/PoolGame.jsx`

**Step 1: Upgrade drawTable() — cloth texture, better felt**

Replace the felt texture noise section (lines 243-251 — the random dots loop) with a proper cloth weave pattern:

```js
// Cloth weave texture (diagonal cross-hatch)
ctx.strokeStyle = 'rgba(0,0,0,0.02)';
ctx.lineWidth = 0.5;
const feltLeft = BORDER + CUSHION;
const feltTop = BORDER + CUSHION;
const feltRight = TW - BORDER - CUSHION;
const feltBottom = TH - BORDER - CUSHION;
for (let i = -feltBottom; i < feltRight; i += 6) {
  ctx.beginPath();
  ctx.moveTo(Math.max(feltLeft, i), feltTop);
  ctx.lineTo(Math.max(feltLeft, i + feltBottom - feltTop), feltBottom);
  ctx.stroke();
}
for (let i = -feltBottom; i < feltRight; i += 6) {
  ctx.beginPath();
  ctx.moveTo(Math.min(feltRight, i + feltBottom - feltTop), feltTop);
  ctx.lineTo(Math.min(feltRight, i), feltBottom);
  ctx.stroke();
}
```

**Step 2: Upgrade drawBall() — deeper 3D, subtle spin line**

Enhance the 3D gradient for more depth. After the specular highlight (line 403-405), add a subtle equator line that gives a spin impression:

```js
// Subtle equator line (spin impression)
if (id !== 0) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 0.4;
  ctx.stroke();
}
```

**Step 3: Add pocket drop animation**

Add a `pocketDrops` array at module scope (alongside `pocketFlashes`):
```js
const pocketDrops = []; // { x, y, ballId, scale, alpha, color }
```

When a ball is pocketed (in the onPocket callback), push a drop animation entry:
```js
pocketDrops.push({ x: b.x, y: b.y, ballId: b.id, scale: 1.0, alpha: 1.0, color: BALL_COLORS[b.id] });
```

In the render loop, before drawing balls, animate pocket drops:
```js
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
```

**Step 4: Add shot trail particles**

Add a `trailParticles` array at module scope:
```js
const trailParticles = []; // { x, y, alpha }
```

In the physics step, for each moving ball, emit trail particles:
```js
// In the physics frame callback, after stepPhysics:
for (const b of balls) {
  if (b.pocketed) continue;
  const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
  if (speed > 3) {
    trailParticles.push({ x: b.x, y: b.y, alpha: Math.min(speed / 15, 0.4) });
  }
}
// Decay particles
for (let i = trailParticles.length - 1; i >= 0; i--) {
  trailParticles[i].alpha -= 0.03;
  if (trailParticles[i].alpha <= 0) trailParticles.splice(i, 1);
}
```

In the render loop, draw trail particles BEFORE balls:
```js
for (const p of trailParticles) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
  ctx.fill();
}
```

**Step 5: Add impact sparks on hard collisions**

Add a `sparks` array at module scope:
```js
const sparks = []; // { x, y, vx, vy, alpha }
```

In the onBallCollision callback, when velocity > 8, emit sparks at collision point:
```js
// Wrap existing playBallClick to also emit sparks
function handleBallCollision(velocity, b1, b2) {
  playBallClick(velocity);
  if (velocity > 8) {
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
```

Animate and draw sparks in render loop:
```js
for (let i = sparks.length - 1; i >= 0; i--) {
  const s = sparks[i];
  s.x += s.vx; s.y += s.vy;
  s.alpha -= 0.06;
  if (s.alpha <= 0) { sparks.splice(i, 1); continue; }
  ctx.beginPath();
  ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,220,100,${s.alpha})`;
  ctx.fill();
}
```

**Step 6: Commit**

```bash
git add src/components/lounge/PoolGame.jsx
git commit -m "feat: premium visual upgrade for 8-Ball Pool — cloth texture, pocket drops, trail particles, impact sparks"
```

---

### Task 3: Create Arcade Level Definitions

**Files:**
- Create: `src/lib/games/arcadeLevels.js`

**Step 1: Create arcadeLevels.js with 30 levels across 4 tiers**

```js
/**
 * KICKBACK LOUNGE — Arcade Pool Level Definitions
 * 30 levels: Rookie (1-8), Street (9-16), Hustler (17-24), Pro (25-30)
 */

// Level types
// 'clear' — pocket all target balls within shotLimit
// 'time' — clear all balls before timer expires
// 'trick' — pocket specific ball into specific pocket
// 'combo' — pocket 2+ balls in a single shot

export const TIER_INFO = {
  rookie: { name: 'Rookie', color: '#22c55e', icon: '🟢', range: [1, 8] },
  street: { name: 'Street', color: '#3b82f6', icon: '🔵', range: [9, 16] },
  hustler: { name: 'Hustler', color: '#f59e0b', icon: '🟡', range: [17, 24] },
  pro: { name: 'Pro', color: '#ef4444', icon: '🔴', range: [25, 30] },
};

export function getTier(levelNum) {
  if (levelNum <= 8) return 'rookie';
  if (levelNum <= 16) return 'street';
  if (levelNum <= 24) return 'hustler';
  return 'pro';
}

// Aim guide length multiplier per tier
export const AIM_GUIDE_CONFIG = {
  rookie: { length: 800, showBallPrediction: true, showTrajectory: true },
  street: { length: 500, showBallPrediction: false, showTrajectory: true },
  hustler: { length: 300, showBallPrediction: false, showTrajectory: true },
  pro: { length: 120, showBallPrediction: false, showTrajectory: false },
};

// Pocket size multiplier per tier (1.0 = normal)
export const POCKET_SCALE = {
  rookie: 1.5,
  street: 1.0,
  hustler: 1.0,
  pro: 0.85,
};

export const LEVELS = [
  // === ROOKIE (1-8) ===
  { num: 1, name: 'First Shot', type: 'clear', balls: [0, 1, 2, 3], shotLimit: 10,
    starThresholds: [10, 7, 4], description: 'Pocket 3 balls. Take your time!' },
  { num: 2, name: 'Easy Does It', type: 'clear', balls: [0, 1, 2, 3, 4], shotLimit: 12,
    starThresholds: [12, 8, 5], description: 'Pocket 4 balls. You got this!' },
  { num: 3, name: 'Corner Pocket', type: 'clear', balls: [0, 1, 2, 3, 4, 5], shotLimit: 14,
    starThresholds: [14, 10, 6], description: 'Pocket 5 balls. Aim for the corners!' },
  { num: 4, name: 'Getting Warm', type: 'clear', balls: [0, 1, 2, 3, 4, 5, 6], shotLimit: 16,
    starThresholds: [16, 11, 7], description: 'Pocket 6 balls. Focus on angles.' },
  { num: 5, name: 'Side Pocket Pro', type: 'clear', balls: [0, 1, 2, 3, 4, 5, 6, 7], shotLimit: 18,
    starThresholds: [18, 13, 8], description: 'Clear all 7 balls! Try the side pockets.' },
  { num: 6, name: 'Quick Learner', type: 'time', balls: [0, 1, 2, 3, 4], timeLimit: 90,
    starThresholds: [90, 60, 30], description: 'Clear 4 balls before time runs out!' },
  { num: 7, name: 'Ten Ball', type: 'clear', balls: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11], shotLimit: 22,
    starThresholds: [22, 16, 10], description: 'Now we\'re cooking — 10 balls!' },
  { num: 8, name: 'Rookie Finals', type: 'clear', balls: [0, 1, 2, 3, 4, 5, 6, 7, 8], shotLimit: 20,
    starThresholds: [20, 14, 9], description: 'Clear 8 balls including the 8-ball. Rookie complete!' },

  // === STREET (9-16) ===
  { num: 9, name: 'Full Table', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 25,
    starThresholds: [25, 18, 12], description: 'Full 15-ball rack. Real pool now.' },
  { num: 10, name: 'Speed Run', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 120,
    starThresholds: [120, 80, 50], description: 'Clear the table in 2 minutes.' },
  { num: 11, name: 'Sharpshooter', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 20,
    starThresholds: [20, 16, 12], description: 'Same table, fewer shots allowed.' },
  { num: 12, name: 'Bank Shot', type: 'trick',
    balls: [0, 3], targetBall: 3, targetPocket: 0, shotLimit: 5,
    starThresholds: [5, 3, 1], description: 'Pocket the 3-ball into the top-left corner!' },
  { num: 13, name: 'Cross Table', type: 'trick',
    balls: [0, 5], targetBall: 5, targetPocket: 5, shotLimit: 5,
    starThresholds: [5, 3, 1], description: 'Pocket the 5-ball into the bottom-right!' },
  { num: 14, name: 'Rapid Fire', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 90,
    starThresholds: [90, 60, 35], description: '90 seconds. Full table. Go go go!' },
  { num: 15, name: 'Economy', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 17,
    starThresholds: [17, 15, 13], description: '15 balls in 17 shots. Every shot counts.' },
  { num: 16, name: 'Street Finals', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 16,
    starThresholds: [16, 15, 14], description: 'Almost one shot per ball. You\'re legit now.' },

  // === HUSTLER (17-24) ===
  { num: 17, name: 'Pressure Cooker', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 75,
    starThresholds: [75, 50, 30], description: '75 seconds. Clock is ticking.' },
  { num: 18, name: 'Surgical', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 15,
    starThresholds: [15, 14, 13], description: '15 balls, 15 shots. No wasted motion.' },
  { num: 19, name: 'Combo Starter', type: 'combo',
    balls: [0,1,2,3,4,5], comboTarget: 2, shotLimit: 8,
    starThresholds: [8, 5, 3], description: 'Pocket 2 balls in one shot! Then clear the rest.' },
  { num: 20, name: 'Trick Master', type: 'trick',
    balls: [0, 8], targetBall: 8, targetPocket: 2, shotLimit: 3,
    starThresholds: [3, 2, 1], description: 'Pocket the 8-ball into the top-right corner!' },
  { num: 21, name: 'Speed Demon', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 60,
    starThresholds: [60, 40, 25], description: 'One minute. Full table. Execute.' },
  { num: 22, name: 'Run Out', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 15,
    starThresholds: [15, 13, 11], description: 'The run-out: clear the table with precision.' },
  { num: 23, name: 'Double Combo', type: 'combo',
    balls: [0,1,2,3,4,5,6,7,8], comboTarget: 2, shotLimit: 6,
    starThresholds: [6, 4, 3], description: 'Two combos required! Pocket 2+ balls twice.' },
  { num: 24, name: 'Hustler Finals', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 50,
    starThresholds: [50, 35, 20], description: '50 seconds flat. You\'re a hustler now.' },

  // === PRO (25-30) ===
  { num: 25, name: 'Sniper', type: 'trick',
    balls: [0, 1, 8, 15], targetBall: 8, targetPocket: 1, shotLimit: 3,
    starThresholds: [3, 2, 1], description: 'Pocket the 8 into the top-center. Obstacles in the way.' },
  { num: 26, name: 'Lightning', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 40,
    starThresholds: [40, 28, 18], description: '40 seconds. Pro speed.' },
  { num: 27, name: 'Perfect Run', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 15,
    starThresholds: [15, 12, 10], description: 'Tight pockets. Every ball, every shot.' },
  { num: 28, name: 'Triple Combo', type: 'combo',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], comboTarget: 3, shotLimit: 10,
    starThresholds: [10, 7, 5], description: 'Pocket 3 balls in one shot. Then clear the rest.' },
  { num: 29, name: 'Impossible', type: 'time',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], timeLimit: 30,
    starThresholds: [30, 22, 15], description: '30 seconds. Full table. Legend status.' },
  { num: 30, name: 'Hall of Fame', type: 'clear',
    balls: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], shotLimit: 15,
    starThresholds: [15, 11, 8], description: 'Tiny pockets, no guide. Pure skill. You made it.' },
];

/**
 * Get stars earned for a given level and performance metric
 * @param {number} levelNum
 * @param {number} metric - shots used (for clear/combo/trick) or seconds remaining (for time)
 * @returns {number} 1, 2, or 3 stars
 */
export function getStars(levelNum, metric) {
  const level = LEVELS[levelNum - 1];
  if (!level) return 0;
  const [one, two, three] = level.starThresholds;
  if (level.type === 'time') {
    // Time levels: more time remaining = more stars
    if (metric >= two) return 3;
    if (metric >= one * 0.4) return 2;
    return 1;
  }
  // Shot-based levels: fewer shots = more stars
  if (metric <= three) return 3;
  if (metric <= two) return 2;
  return 1;
}

/** Load arcade progress from localStorage */
export function loadArcadeProgress() {
  try {
    const data = localStorage.getItem('ms-arcade-pool');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

/** Save arcade progress to localStorage */
export function saveArcadeProgress(progress) {
  try {
    localStorage.setItem('ms-arcade-pool', JSON.stringify(progress));
  } catch { /* storage full */ }
}
```

**Step 2: Commit**

```bash
git add src/lib/games/arcadeLevels.js
git commit -m "feat: add 30 arcade pool levels (Rookie/Street/Hustler/Pro)"
```

---

### Task 4: Build ArcadePoolGame Component

**Files:**
- Create: `src/components/lounge/ArcadePoolGame.jsx`

This is the largest task. The component includes:
- Level select screen (tier tabs, star display, lock state)
- In-game view (canvas, HUD with shots/time, enhanced aim guide)
- Level complete overlay (stars animation, retry/next buttons)
- Kid-friendly feedback popups ("NICE SHOT!", confetti on clear)

**Step 1: Create ArcadePoolGame.jsx**

The component has three screens managed by a `screen` state: `'select'`, `'playing'`, `'complete'`.

Key differences from PoolGame.jsx:
- NO server state — all local
- NO multiplayer — single player only
- Level config controls ball count, pocket size, aim guide length
- Shot counter / timer HUD
- Star rating on completion
- Progress saved to localStorage
- Kid-friendly: big feedback text, confetti particles, encouraging messages

The file structure:
```
1. Imports (poolPhysics, arcadeLevels, React hooks)
2. Sound effects (reuse from PoolGame — extract to shared or copy)
3. drawTable, drawBall, drawCueStick, drawAimLine — copied from poolPhysics shared rendering
4. Level Select Screen component
5. In-Game Screen (canvas + HUD)
6. Level Complete Screen
7. Main ArcadePoolGame component (screen state machine)
```

Create the full `src/components/lounge/ArcadePoolGame.jsx` file. It will be ~800-1000 lines. Key sections:

**Sound effects:** Copy the 4 sound functions from PoolGame.jsx (playBallClick, playCushionBounce, playPocketDrop, playCueStrike). These are pure functions, no state.

**Drawing functions:** Copy drawTable, drawDiamond, drawBall, drawCueStick from PoolGame.jsx. Modify drawAimLine to respect `AIM_GUIDE_CONFIG` per tier (guide length, ball prediction toggle).

**Pocket size scaling:** When creating POCKETS for the level, multiply POCKET_R by `POCKET_SCALE[tier]`. Pass custom pocket radius to `stepPhysics`.

**Level Select Screen:**
```jsx
function LevelSelect({ progress, onSelectLevel }) {
  const [activeTier, setActiveTier] = useState('rookie');
  // Tier tabs: Rookie, Street, Hustler, Pro
  // Grid of level cards showing: level number, name, star count (0-3), locked/unlocked
  // Unlock rule: complete previous tier (all levels have >= 1 star) to unlock next
  // Total stars counter at top
}
```

**In-Game HUD overlay (drawn on canvas or as DOM):**
- Level name + number (top left)
- Shots remaining or timer (top right)
- "?" help button (top right corner)

**Feedback system:**
```js
const FEEDBACK_MESSAGES = [
  { min: 0, texts: ['NICE!', 'GOOD SHOT!', 'SWEET!'] },
  { min: 2, texts: ['GREAT!', 'ON FIRE!', 'UNSTOPPABLE!'] },
  { min: 4, texts: ['INCREDIBLE!', 'LEGENDARY!', 'PERFECT!'] },
];
```
Show a random message from the appropriate tier based on consecutive pockets. Big, colorful, center-screen, fades out over 1s.

**Confetti on level clear:** Emit 50 particles with random colors, velocities, and rotations. Animate for 2 seconds in render loop.

**Step 2: Verify arcade mode works standalone**

Test locally:
- Level select shows 30 levels, tiers work
- Level 1 (Rookie): 3 balls, giant pockets, full aim guide
- Pocket a ball → feedback popup
- Clear level → stars + confetti
- Progress saves to localStorage
- Level 9 (Street): full rack, normal pockets, shorter guide
- Locked tiers show lock icon until previous tier completed

**Step 3: Commit**

```bash
git add src/components/lounge/ArcadePoolGame.jsx
git commit -m "feat: add Arcade Pool — 30 levels, Rookie-to-Pro, kid-friendly"
```

---

### Task 5: Wire Arcade Pool into Game Selector

**Files:**
- Modify: `src/lib/games/constants.js`
- Modify: `src/components/lounge/GameModeModal.jsx`
- Modify: `src/components/lounge/GameRoom.jsx`
- Modify: `src/app/lounge/page.jsx` (if needed for arcade routing)

**Step 1: Add arcadePool to GAME_TYPES in constants.js**

After the `pool` entry (line 108), add:
```js
arcadePool: {
  id: 'arcadePool',
  name: 'Arcade Pool',
  description: 'Solo challenges — clear levels from Rookie to Pro!',
  minPlayers: 1,
  maxPlayers: 1,
  icon: '🎯',
  color: '#22c55e',
  turnBased: false,
  isArcade: true, // flag: no room creation needed
},
```

**Step 2: Update GameModeModal.jsx for pool sub-selector**

When `gameKey === 'pool'`, show a pool-specific mode selector BEFORE the standard Quick Play / With Friends cards:

Add a `poolSubMode` state. When pool is selected, show two cards:
1. **Arcade Mode** — "Solo challenges, Rookie to Pro" → sets screen to arcade (no room needed)
2. **8-Ball Pool** → shows the normal Quick Play / With Friends options

For Arcade Mode, instead of creating a room, directly render ArcadePoolGame in the lounge page. The simplest approach: use `router.push('/lounge?arcade=pool')` and handle it in the lounge page.

**Step 3: Handle arcade mode in lounge/page.jsx**

In `src/app/lounge/page.jsx`, check for `?arcade=pool` search param. If present, render `<ArcadePoolGame />` instead of the lobby. Add a back button to return to the lobby.

```jsx
import ArcadePoolGame from '@/components/lounge/ArcadePoolGame';
import { useSearchParams } from 'next/navigation';

// Inside LoungePage:
const searchParams = useSearchParams();
const arcadeMode = searchParams.get('arcade');

if (arcadeMode === 'pool') {
  return (
    <div className="...">
      <button onClick={() => router.push('/lounge')} className="...">← Back to Lounge</button>
      <ArcadePoolGame />
    </div>
  );
}
```

**Step 4: Add arcade tips to GameModeModal GAME_TIPS**

```js
arcadePool: [
  'Start on Rookie — giant pockets, helpful guides',
  'Earn 3 stars by using fewer shots',
  'Complete all 8 levels to unlock the next tier',
  'Pro tier: tiny pockets, no guide. Pure skill.',
],
```

**Step 5: Verify full flow**

1. Go to /lounge
2. Click pool (🎱)
3. See two options: Arcade Mode, 8-Ball Pool
4. Click Arcade Mode → redirected to /lounge?arcade=pool
5. Level select shows, can play Level 1
6. Back button returns to lobby
7. Click pool → 8-Ball Pool → Quick Play works as before

**Step 6: Commit**

```bash
git add src/lib/games/constants.js src/components/lounge/GameModeModal.jsx src/components/lounge/GameRoom.jsx src/app/lounge/page.jsx
git commit -m "feat: wire arcade pool into lounge — pool sub-selector, arcade routing"
```

---

### Task 6: How to Play Data

**Files:**
- Create: `src/lib/games/howToPlayData.js`

**Step 1: Create howToPlayData.js with guide content for all 7 games**

Each game gets 3-5 slides with heading, body text (10-year-old reading level), and an optional diagram key (rendered by the modal component).

```js
/**
 * KICKBACK LOUNGE — How to Play Guide Data
 * Written for kids and beginners — simple language, short sentences
 */

export const HOW_TO_PLAY = {
  arcadePool: {
    title: 'Arcade Pool',
    slides: [
      { heading: 'How to Shoot', body: 'Tap the white ball, drag back to aim, then let go to shoot! The farther you drag, the harder you hit.' },
      { heading: 'Your Goal', body: 'Pocket all the colored balls on the table. Each level tells you how many shots you get.' },
      { heading: 'Earn Stars', body: 'Use fewer shots to earn more stars! 1 star = you did it. 3 stars = you crushed it!' },
      { heading: 'Level Up', body: 'Beat all 8 levels in a tier to unlock the next one. Start as a Rookie, end as a Pro!' },
    ],
  },
  pool: {
    title: '8-Ball Pool',
    slides: [
      { heading: 'How to Shoot', body: 'Tap near the white ball, drag back to aim, then let go to shoot. The farther you drag, the harder you hit.' },
      { heading: 'Solids & Stripes', body: 'After the break, whoever pockets a ball first claims that type — solids (1-7) or stripes (9-15). You only pocket YOUR balls.' },
      { heading: 'Pocket the 8 Last', body: 'Once ALL your balls are pocketed, sink the 8-ball to win. But if you pocket the 8 too early — you lose!' },
      { heading: 'Scratch!', body: 'If the white ball goes in a pocket, that\'s a scratch. Your opponent gets to place the white ball anywhere behind the line.' },
      { heading: 'Winning', body: 'Pocket all your balls, then sink the 8. Don\'t scratch on the 8-ball or you lose!' },
    ],
  },
  blackjack: {
    title: '21 (Blackjack)',
    slides: [
      { heading: 'The Goal', body: 'Get your cards as close to 21 as possible — without going over! Beat the dealer\'s hand to win.' },
      { heading: 'Card Values', body: 'Number cards = face value. Jack, Queen, King = 10. Ace = 1 or 11 (whichever helps you more).' },
      { heading: 'Hit or Stand', body: 'Hit = get another card. Stand = keep what you have. If you go over 21, you bust and lose!' },
      { heading: 'Beat the Dealer', body: 'The dealer must hit until they reach 17. If you\'re closer to 21 without busting, you win!' },
    ],
  },
  slidesLadders: {
    title: 'Slides & Ladders',
    slides: [
      { heading: 'How to Play', body: 'Roll the dice and move forward that many spaces. First player to reach square 100 wins!' },
      { heading: 'Ladders Go Up!', body: 'Land on the bottom of a ladder? Climb up to the top! Ladders are shortcuts to the finish.' },
      { heading: 'Slides Go Down!', body: 'Land on the top of a slide? You slide all the way down. Watch out — they can send you way back!' },
      { heading: 'Tips', body: 'It\'s mostly luck, but cheer for high rolls and hope you hit those ladders! Roll a 6 to go again.' },
    ],
  },
  spades: {
    title: 'Spades',
    slides: [
      { heading: 'The Basics', body: 'Spades is a trick-taking card game. You play with a partner against another team of two.' },
      { heading: 'Bidding', body: 'Before each round, guess how many tricks (rounds) you\'ll win. Your team tries to hit that number exactly.' },
      { heading: 'Playing Cards', body: 'The highest card of the lead suit wins the trick. But Spades beat everything — they\'re trump!' },
      { heading: 'Scoring', body: 'Hit your bid = 10 points per trick bid. Go over = 1 bonus point each. Miss your bid = penalty! First to 500 wins.' },
      { heading: 'Pro Tip', body: 'Count your sure winners (Aces, Kings) when bidding. Save your Spades for when you really need to win a trick.' },
    ],
  },
  dominoes: {
    title: 'Dominoes',
    slides: [
      { heading: 'Setup', body: 'Each player draws 7 tiles. The rest stay in the boneyard (draw pile). Look at your tiles but hide them from others!' },
      { heading: 'How to Play', body: 'Take turns placing tiles. The number on your tile must match the number on one end of the chain.' },
      { heading: 'Can\'t Play?', body: 'If none of your tiles match, draw from the boneyard until you can play (or it\'s empty, then pass).' },
      { heading: 'Winning', body: 'First player to play all their tiles wins! If nobody can play, the player with the fewest dots wins.' },
    ],
  },
  quiz: {
    title: 'Black History Quiz',
    slides: [
      { heading: 'How It Works', body: '10 questions per round. Pick the right answer from 4 choices. Simple!' },
      { heading: 'Speed Bonus', body: 'Answer faster to earn more points. The timer counts down — quick fingers win!' },
      { heading: 'Streaks', body: 'Get multiple answers right in a row to build a streak. Streaks give you bonus multiplier points!' },
      { heading: 'Categories', body: '230 questions across 10 topics: Civil Rights, Music, Sports, Science, Art, and more. Learn while you play!' },
    ],
  },
  maze: {
    title: 'Maze HQ',
    slides: [
      { heading: 'Navigate the Maze', body: 'Use arrow keys or swipe to move through the maze. Find the exit before time runs out!' },
      { heading: 'Collect Stars', body: 'Grab stars along the way for bonus points. But don\'t get lost — time is ticking!' },
      { heading: 'Levels', body: 'Each level gets harder with bigger mazes and trickier paths. How far can you get?' },
    ],
  },
};
```

**Step 2: Commit**

```bash
git add src/lib/games/howToPlayData.js
git commit -m "feat: add How to Play guide data for all 7+1 games"
```

---

### Task 7: Build HowToPlayModal Component

**Files:**
- Create: `src/components/lounge/HowToPlayModal.jsx`

**Step 1: Create the universal How to Play modal**

```jsx
/**
 * KICKBACK LOUNGE — How to Play Modal
 * Universal guide for all games. Auto-shows on first play, re-accessible via "?" button.
 * Swipeable slides, kid-friendly language.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { HOW_TO_PLAY } from '@/lib/games/howToPlayData';

/** Check if player has seen the guide for this game */
function hasSeenGuide(gameId) {
  try { return localStorage.getItem(`ms-howto-${gameId}`) === '1'; }
  catch { return false; }
}

/** Mark guide as seen */
function markGuideSeen(gameId) {
  try { localStorage.setItem(`ms-howto-${gameId}`, '1'); }
  catch { /* storage full */ }
}

/** The "?" help button — place this in any game's UI */
export function HelpButton({ gameId, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition ${className}`}
        title="How to play"
      >
        <HelpCircle size={18} />
      </button>
      <HowToPlayModal gameId={gameId} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Auto-show hook — call in each game component to auto-show guide on first play */
export function useAutoShowGuide(gameId) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!hasSeenGuide(gameId)) {
      setShowGuide(true);
    }
  }, [gameId]);

  const closeGuide = useCallback(() => {
    markGuideSeen(gameId);
    setShowGuide(false);
  }, [gameId]);

  return { showGuide, closeGuide };
}

export default function HowToPlayModal({ gameId, isOpen, onClose }) {
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (isOpen) setSlide(0); }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !gameId) return null;
  const data = HOW_TO_PLAY[gameId];
  if (!data) return null;

  const total = data.slides.length;
  const current = data.slides[slide];
  const isLast = slide === total - 1;

  const handleClose = () => {
    markGuideSeen(gameId);
    onClose();
  };

  const handleNext = () => {
    if (isLast) handleClose();
    else setSlide(s => s + 1);
  };

  const handlePrev = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  // Touch swipe support
  let touchStartX = 0;
  const handleTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
  };

  const modal = (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/[0.08] rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ animation: 'loungeFadeUp 0.3s ease-out' }}
      >
        {/* Close button */}
        <button onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/70 transition z-10">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <p className="text-[10px] text-white/30 font-medium tracking-widest mb-1">HOW TO PLAY</p>
          <h3 className="text-white font-bold text-xl">{data.title}</h3>
        </div>

        {/* Slide content */}
        <div className="px-8 pb-4 min-h-[160px]">
          <h4 className="text-white font-bold text-lg mb-2">{current.heading}</h4>
          <p className="text-white/60 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button onClick={handlePrev}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition ${slide > 0 ? 'bg-white/5 hover:bg-white/10 text-white/50' : 'opacity-0 pointer-events-none'}`}>
            <ChevronLeft size={20} />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {data.slides.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === slide ? 'bg-white w-5' : 'bg-white/20'}`} />
            ))}
          </div>

          <button onClick={handleNext}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 transition">
            {isLast ? <span className="text-xs font-bold text-emerald-400">GO!</span> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
```

**Step 2: Commit**

```bash
git add src/components/lounge/HowToPlayModal.jsx
git commit -m "feat: add universal How to Play modal for all Lounge games"
```

---

### Task 8: Wire Help Button into All 7 Game Components

**Files:**
- Modify: `src/components/lounge/PoolGame.jsx`
- Modify: `src/components/lounge/ArcadePoolGame.jsx`
- Modify: `src/components/lounge/BlackjackGame.jsx`
- Modify: `src/components/lounge/SlidesLaddersGame.jsx`
- Modify: `src/components/lounge/SpadesGame.jsx`
- Modify: `src/components/lounge/DominoesGame.jsx`
- Modify: `src/components/lounge/QuizGame.jsx`
- Modify: `src/components/lounge/MazeGame.jsx`

**Step 1: Add HelpButton + auto-show to each game**

For EACH game component, add two things:

1. Import at top:
```jsx
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';
```

2. Inside the component, add the auto-show hook:
```jsx
const { showGuide, closeGuide } = useAutoShowGuide('pool'); // or 'blackjack', etc.
```

3. Add the HelpButton to the top-right of the game UI (inside the existing layout, near any existing header/status bar):
```jsx
<HelpButton gameId="pool" className="absolute top-2 right-2 z-10" />
```

4. Add the auto-show modal:
```jsx
<HowToPlayModal gameId="pool" isOpen={showGuide} onClose={closeGuide} />
```

**Mapping of gameId per component:**
| Component | gameId |
|-----------|--------|
| PoolGame.jsx | `'pool'` |
| ArcadePoolGame.jsx | `'arcadePool'` |
| BlackjackGame.jsx | `'blackjack'` |
| SlidesLaddersGame.jsx | `'slidesLadders'` |
| SpadesGame.jsx | `'spades'` |
| DominoesGame.jsx | `'dominoes'` |
| QuizGame.jsx | `'quiz'` |
| MazeGame.jsx | `'maze'` |

**Step 2: Verify help button appears in every game**

Open each game in /lounge, verify:
- "?" button visible in top-right
- First time: guide auto-shows
- Clicking "?" reopens the guide
- Slides are swipeable on mobile
- "GO!" on last slide closes and marks as seen
- Refreshing doesn't auto-show again (localStorage flag set)

**Step 3: Commit**

```bash
git add src/components/lounge/PoolGame.jsx src/components/lounge/ArcadePoolGame.jsx src/components/lounge/BlackjackGame.jsx src/components/lounge/SlidesLaddersGame.jsx src/components/lounge/SpadesGame.jsx src/components/lounge/DominoesGame.jsx src/components/lounge/QuizGame.jsx src/components/lounge/MazeGame.jsx
git commit -m "feat: add How to Play help button + auto-show guide to all 8 Lounge games"
```

---

### Task 9: Final Integration Test + Deploy

**Files:**
- All modified files

**Step 1: Full integration test**

Test the complete flow:
1. `/lounge` — all 7 game tiles visible + Arcade Pool as new option under Pool
2. Click Pool → see Arcade Mode / 8-Ball Pool sub-selector
3. Arcade Mode:
   - Level select shows 4 tiers (Rookie unlocked, others locked)
   - Level 1: 3 balls, giant pockets, full aim guide
   - Pocket ball → "NICE SHOT!" feedback
   - Clear level → confetti + stars
   - Progress persists on refresh
4. 8-Ball Pool:
   - Quick Play still works (AI opponent)
   - Visual upgrades visible (cloth texture, pocket drops, trail particles, sparks)
   - All sounds play correctly
5. Every game shows "?" help button
6. First-time guide auto-shows on each game
7. Mobile: test touch controls on arcade + 8-ball

**Step 2: Build check**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npm run build 2>&1 | tail -20
# Expected: ✓ compiled successfully
```

**Step 3: Deploy**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
vercel ls 2>&1 | grep -E "Building|Queued"
# If clear:
vercel --prod
```

**Step 4: Verify live site**

```bash
for p in / /music /search /merch /lounge; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 5: Commit final state + update SESSION_STATE.md**

```bash
git add -A
git commit -m "feat: Pool Dual Upgrade — Arcade Mode (30 levels, Rookie-to-Pro) + 8-Ball visual upgrade + How to Play guides for all games"
```

---

## Summary

| Task | What | Estimated Lines |
|------|------|----------------|
| 1 | Extract poolPhysics.js + refactor PoolGame | ~200 new, ~200 removed from PoolGame |
| 2 | Upgrade PoolGame visuals | ~100 added |
| 3 | Arcade level definitions | ~250 new |
| 4 | ArcadePoolGame component | ~900 new |
| 5 | Wire into game selector | ~80 modified |
| 6 | How to Play data | ~120 new |
| 7 | HowToPlayModal component | ~180 new |
| 8 | Help button in all 8 games | ~30 per game = ~240 modified |
| 9 | Integration test + deploy | 0 new code |
