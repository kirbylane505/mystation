/**
 * POOL PHYSICS ENGINE — Shared by Arcade & Multiplayer modes
 * Extracted from PoolGame.jsx for dual-mode pool support
 */

// ============================================================
// TABLE & PHYSICS CONSTANTS
// ============================================================
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

// Corner pockets slightly inside, side pockets centered
export const POCKETS = [
  { x: BORDER + 6, y: BORDER + 6 },                  // top-left
  { x: TW / 2, y: BORDER - 4 },                       // top-center
  { x: TW - BORDER - 6, y: BORDER + 6 },              // top-right
  { x: BORDER + 6, y: TH - BORDER - 6 },              // bottom-left
  { x: TW / 2, y: TH - BORDER + 4 },                  // bottom-center
  { x: TW - BORDER - 6, y: TH - BORDER - 6 },         // bottom-right
];

// Ball colors (official billiards)
export const BALL_COLORS = {
  0: '#F8F8F0',   // cue - ivory white
  1: '#F5C518',   // 1 - yellow
  2: '#1A3FC7',   // 2 - blue
  3: '#D4261D',   // 3 - red
  4: '#5B2C8E',   // 4 - purple
  5: '#E87511',   // 5 - orange
  6: '#1B8C4B',   // 6 - green
  7: '#8B1A1A',   // 7 - maroon
  8: '#111111',   // 8 - black
  9: '#F5C518',   // 9 - yellow stripe
  10: '#1A3FC7',  // 10 - blue stripe
  11: '#D4261D',  // 11 - red stripe
  12: '#5B2C8E',  // 12 - purple stripe
  13: '#E87511',  // 13 - orange stripe
  14: '#1B8C4B',  // 14 - green stripe
  15: '#8B1A1A',  // 15 - maroon stripe
};

export const isStripe = (id) => id >= 9 && id <= 15;
export const isSolid = (id) => id >= 1 && id <= 7;

// ============================================================
// BALL SETUP
// ============================================================
export const RACK_ORDER = [
  [1],
  [11, 2],
  [9, 8, 3],
  [12, 4, 10, 5],
  [13, 6, 15, 7, 14],
];

/**
 * Create the initial ball positions for a pool game.
 * @param {number[]|null} ballIds - Optional array of ball IDs to place (for arcade mode).
 *   If provided, only those balls are racked. If null/undefined, standard full 15-ball rack.
 *   The cue ball (id 0) is always included.
 */
export function createInitialBalls(ballIds) {
  const balls = [];
  // Cue ball always present
  balls.push({ id: 0, x: TW * 0.25, y: TH / 2, vx: 0, vy: 0, pocketed: false });

  const rackX = TW * 0.72;
  const rackY = TH / 2;
  const spacing = BALL_R * 2.06;
  const rowDx = spacing * Math.sqrt(3) / 2;

  if (ballIds) {
    // Arcade mode: place only the specified balls in a compact rack
    let placed = 0;
    for (let ri = 0; ri < RACK_ORDER.length && placed < ballIds.length; ri++) {
      const row = RACK_ORDER[ri];
      for (let ci = 0; ci < row.length && placed < ballIds.length; ci++) {
        balls.push({
          id: ballIds[placed],
          x: rackX + ri * rowDx,
          y: rackY + (ci - (row.length - 1) / 2) * spacing,
          vx: 0, vy: 0, pocketed: false,
        });
        placed++;
      }
    }
  } else {
    // Standard 8-ball rack
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

// ============================================================
// PHYSICS STEP
// ============================================================

/**
 * Run one frame of pool physics simulation on the balls array (mutates in place).
 *
 * @param {Array} balls - Array of ball objects { id, x, y, vx, vy, pocketed }
 * @param {Object} config - Configuration object
 * @param {Array}    [config.pockets=POCKETS]     - Pocket positions
 * @param {number}   [config.pocketRadius=POCKET_R] - Pocket detection radius
 * @param {number}   [config.subSteps=3]          - Sub-step count for accuracy
 * @param {Function} [config.onBallCollision]      - Called with (velocity) on ball-ball hit
 * @param {Function} [config.onWallCollision]      - Called with (velocity) on wall hit
 * @param {Function} [config.onPocket]             - Called with (ball, pocket) when pocketed
 * @returns {boolean} anyMoving - true if any ball is still in motion
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

  let anyMoving = false;
  const inner = BORDER + CUSHION;

  for (let sub = 0; sub < subSteps; sub++) {
    for (const b of balls) {
      if (b.pocketed) continue;
      b.x += b.vx / subSteps;
      b.y += b.vy / subSteps;

      // Wall collisions with cushion bounce
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

    // Ball-ball collisions (elastic) - inside sub-step for accuracy
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

  return anyMoving;
}
