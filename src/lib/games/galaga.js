/**
 * GALAGA STATION — Premium Game Logic (8K Quality)
 * Wave generation, collision, scoring, state management
 * Solo arcade + multiplayer duel
 */

// ─── Enemy Types ────────────────────────────────────
export const ENEMY_TYPES = {
  grunt:   { hp: 1, score: 100, speed: 0.8,  color: '#00f0ff', accent: '#0088cc', size: 20, shape: 'grunt' },
  swooper: { hp: 1, score: 200, speed: 1.3,  color: '#ff00ff', accent: '#aa00aa', size: 18, shape: 'swooper' },
  tank:    { hp: 4, score: 300, speed: 0.5,  color: '#ff6b35', accent: '#cc4400', size: 24, shape: 'tank' },
  bomber:  { hp: 2, score: 400, speed: 0.6,  color: '#ff3864', accent: '#cc0033', size: 22, shape: 'bomber' },
  boss:    { hp: 12, score: 2000, speed: 0.35, color: '#ffd700', accent: '#cc9900', size: 36, shape: 'boss' },
};

// ─── Power-up Types ─────────────────────────────────
export const POWERUP_TYPES = {
  shield:     { color: '#39ff14', duration: 0, icon: 'S', desc: 'Absorbs 1 hit' },
  rapidFire:  { color: '#00f0ff', duration: 12000, icon: 'R', desc: '2x fire rate' },
  spreadShot: { color: '#ff00ff', duration: 10000, icon: 'W', desc: '3-way fire' },
  nuke:       { color: '#ffd700', duration: 0, icon: 'N', desc: 'Screen clear' },
  extraLife:  { color: '#ff6bef', duration: 0, icon: '+', desc: 'Extra life' },
};

// ─── Wave Generation ────────────────────────────────

function generateFormation(wave) {
  const enemies = [];
  const cols = Math.min(8, 4 + Math.floor(wave / 2));
  const rows = Math.min(4, 2 + Math.floor(wave / 5));
  const isBossWave = wave % 5 === 0;

  if (isBossWave) {
    // Boss + escorts
    enemies.push({
      type: 'boss',
      x: 0.5,
      y: 0.12,
      hp: ENEMY_TYPES.boss.hp + Math.floor(wave / 5) * 4,
      maxHp: ENEMY_TYPES.boss.hp + Math.floor(wave / 5) * 4,
      state: 'formation',
      animOffset: 0,
      diveTimer: 8000 + Math.random() * 4000,
      hitFlash: 0,
    });
    // Escort grunts in V formation
    for (let i = 0; i < cols; i++) {
      const xSpread = 0.1 + (i / Math.max(1, cols - 1)) * 0.8;
      const yOffset = Math.abs(i - (cols - 1) / 2) * 0.03;
      enemies.push({
        type: 'grunt',
        x: xSpread,
        y: 0.24 + yOffset,
        hp: ENEMY_TYPES.grunt.hp,
        maxHp: ENEMY_TYPES.grunt.hp,
        state: 'formation',
        animOffset: i * 0.4,
        diveTimer: 6000 + Math.random() * 6000,
        hitFlash: 0,
      });
    }
  } else {
    // Regular formation — progressive difficulty
    const typePool = ['grunt', 'grunt', 'grunt', 'grunt'];
    if (wave >= 3) typePool.push('swooper', 'swooper');
    if (wave >= 5) typePool.push('tank');
    if (wave >= 7) typePool.push('bomber');
    if (wave >= 9) typePool.push('swooper', 'bomber');

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = typePool[Math.floor(Math.random() * typePool.length)];
        const et = ENEMY_TYPES[type];
        enemies.push({
          type,
          x: 0.1 + (c / Math.max(1, cols - 1)) * 0.8,
          y: 0.08 + r * 0.07,
          hp: et.hp,
          maxHp: et.hp,
          state: 'formation',
          animOffset: (r * cols + c) * 0.2,
          // Wave 1-2: enemies barely dive. Ramps up.
          diveTimer: wave <= 2
            ? 8000 + Math.random() * 10000
            : Math.max(2000, 6000 - wave * 300) + Math.random() * 5000,
          hitFlash: 0,
        });
      }
    }
  }

  return enemies;
}

// ─── Initial State ──────────────────────────────────

export function createGalagaState(mode = 'solo') {
  const wave1 = generateFormation(1);
  return {
    mode,
    phase: 'ready',
    wave: 1,
    waveTransition: false,
    waveTransitionTimer: 0,

    player: {
      x: 0.5,
      y: 0.88,
      lives: 5,
      score: 0,
      shield: false,
      rapidFire: false,
      rapidFireEnd: 0,
      spreadShot: false,
      spreadShotEnd: 0,
      invincible: false,
      invincibleEnd: 0,
      combo: 0,
      comboTimer: 0,
      maxCombo: 0,
    },

    player2: mode === 'duel' ? {
      x: 0.5, y: 0.88, lives: 5, score: 0,
      shield: false, rapidFire: false, rapidFireEnd: 0,
      spreadShot: false, spreadShotEnd: 0,
      invincible: false, invincibleEnd: 0,
      combo: 0, comboTimer: 0, maxCombo: 0,
    } : null,

    enemies: wave1,
    bullets: [],
    enemyBullets: [],
    powerups: [],
    particles: [],
    scorePopups: [],  // floating score text
    shakeTimer: 0,
    nukeFlash: 0,     // screen flash on nuke

    highScores: [],
    startTime: 0,
    elapsed: 0,
  };
}

// ─── Game Update ────────────────────────────────────

export function updateGalaga(state, dt, canvasW, canvasH) {
  if (state.phase !== 'playing') return state;

  const s = { ...state };
  s.elapsed += dt;

  // ─── Wave transition ───
  if (s.waveTransition) {
    s.waveTransitionTimer -= dt;
    if (s.waveTransitionTimer <= 0) {
      s.wave++;
      s.enemies = generateFormation(s.wave);
      s.waveTransition = false;
    }
    s.particles = updateParticles(s.particles, dt);
    s.scorePopups = updateScorePopups(s.scorePopups, dt);
    return s;
  }

  // ─── Combo decay (1.5s window) ───
  if (s.player.comboTimer > 0) {
    s.player.comboTimer -= dt;
    if (s.player.comboTimer <= 0) s.player.combo = 0;
  }

  // ─── Power-up expiry ───
  const now = s.elapsed;
  if (s.player.rapidFire && now > s.player.rapidFireEnd) s.player.rapidFire = false;
  if (s.player.spreadShot && now > s.player.spreadShotEnd) s.player.spreadShot = false;
  if (s.player.invincible && now > s.player.invincibleEnd) s.player.invincible = false;

  // ─── Shake & flash decay ───
  if (s.shakeTimer > 0) s.shakeTimer = Math.max(0, s.shakeTimer - dt);
  if (s.nukeFlash > 0) s.nukeFlash = Math.max(0, s.nukeFlash - dt);

  // ─── Enemy AI ───
  const speedMult = 1 + (s.wave - 1) * 0.06;
  s.enemies = s.enemies.map(e => {
    const et = ENEMY_TYPES[e.type];
    let { x, y, state: es, diveTimer, animOffset, hitFlash } = e;

    // Hit flash decay
    if (hitFlash > 0) hitFlash = Math.max(0, hitFlash - dt);

    if (es === 'formation') {
      // Smooth sway in formation
      x += Math.sin((s.elapsed / 1200 + animOffset) * 1.2) * 0.00025 * dt;

      // Dive timer
      diveTimer -= dt;
      if (diveTimer <= 0) {
        // Only dive if below a wave-based probability
        const diveChance = s.wave <= 1 ? 0.1 : Math.min(0.5, 0.15 + s.wave * 0.04);
        if (Math.random() < diveChance) {
          es = 'diving';
          diveTimer = 0;
        } else {
          diveTimer = 3000 + Math.random() * 4000;
        }
      }
    } else if (es === 'diving') {
      const targetX = s.player.x;
      const dx = targetX - x;
      x += Math.sign(dx) * Math.min(Math.abs(dx), 0.0008 * et.speed * speedMult * dt);
      y += 0.00035 * et.speed * speedMult * dt;

      // Bomber drops projectiles
      if (e.type === 'bomber' && Math.random() < 0.0015 * dt) {
        s.enemyBullets.push({ x, y: y + 0.02, dy: 0.00025 });
      }

      // Swooper curves
      if (e.type === 'swooper') {
        x += Math.sin(s.elapsed / 250 + animOffset) * 0.0006 * dt;
      }

      // Boss moves slowly and fires
      if (e.type === 'boss') {
        if (Math.random() < 0.002 * dt) {
          s.enemyBullets.push({ x: x - 0.03, y: y + 0.03, dy: 0.0003 });
          s.enemyBullets.push({ x: x + 0.03, y: y + 0.03, dy: 0.0003 });
        }
      }

      // Off-screen → return
      if (y > 1.08) {
        y = -0.08;
        es = 'formation';
        diveTimer = 4000 + Math.random() * 5000;
      }
    }

    return { ...e, x, y, state: es, diveTimer, hitFlash };
  });

  // ─── Enemy bullets ───
  s.enemyBullets = s.enemyBullets
    .map(b => ({ ...b, y: b.y + b.dy * dt }))
    .filter(b => b.y < 1.12);

  // Random enemy shooting (NO shooting on wave 1, light on wave 2)
  if (s.wave >= 2) {
    const shootRate = 0.000025 * Math.min(speedMult, 3) * (s.wave === 2 ? 0.3 : 1);
    s.enemies.forEach(e => {
      if (e.state === 'formation' && Math.random() < shootRate * dt) {
        s.enemyBullets.push({ x: e.x, y: e.y + 0.02, dy: 0.0002 + s.wave * 0.000015 });
      }
    });
  }

  // ─── Player bullets ───
  s.bullets = s.bullets
    .map(b => ({ ...b, x: b.x + (b.dx || 0) * dt, y: b.y + b.dy * dt }))
    .filter(b => b.y > -0.05 && b.x > -0.05 && b.x < 1.05);

  // ─── Power-ups fall ───
  s.powerups = s.powerups
    .map(p => ({ ...p, y: p.y + 0.00012 * dt }))
    .filter(p => p.y < 1.12);

  // ─── Collision: player bullets vs enemies (GENEROUS hitbox) ───
  const bulletsToRemove = new Set();
  const enemiesToRemove = new Set();

  s.bullets.forEach((b, bi) => {
    s.enemies.forEach((e, ei) => {
      if (enemiesToRemove.has(ei) || bulletsToRemove.has(bi)) return;
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const et = ENEMY_TYPES[e.type];
      // Generous hit radius — easier to hit
      const hitR = 0.022 + et.size * 0.0008;
      if (dist < hitR) {
        bulletsToRemove.add(bi);
        e.hp--;
        e.hitFlash = 120;
        if (e.hp <= 0) {
          enemiesToRemove.add(ei);
          // Score with combo
          s.player.combo++;
          s.player.comboTimer = 1500;
          const comboMult = Math.min(s.player.combo, 8);
          const pts = et.score * comboMult;
          s.player.score += pts;
          s.player.maxCombo = Math.max(s.player.maxCombo, s.player.combo);
          // Explosion particles (bigger, more)
          s.particles.push(...createExplosion(e.x, e.y, et.color, e.type === 'boss' ? 50 : 20));
          s.particles.push(...createExplosion(e.x, e.y, '#fff', e.type === 'boss' ? 20 : 8));
          // Debris particles
          s.particles.push(...createDebris(e.x, e.y, et.accent, e.type === 'boss' ? 15 : 6));
          // Score popup
          s.scorePopups.push({
            x: e.x, y: e.y,
            text: comboMult > 1 ? `+${pts} ${comboMult}x` : `+${pts}`,
            color: comboMult >= 5 ? '#ffd700' : comboMult >= 3 ? '#ff6bef' : '#fff',
            life: 800,
            maxLife: 800,
          });
          s.shakeTimer = e.type === 'boss' ? 400 : 120;
          // Power-up drop (20% normal, 80% boss, extra life 5%)
          const dropChance = e.type === 'boss' ? 0.8 : 0.2;
          if (Math.random() < dropChance) {
            const types = Object.keys(POWERUP_TYPES);
            // Extra life is rare (only from bosses or low chance)
            let pType;
            if (e.type === 'boss' || Math.random() < 0.05) {
              pType = types[Math.floor(Math.random() * types.length)];
            } else {
              const noLife = types.filter(t => t !== 'extraLife');
              pType = noLife[Math.floor(Math.random() * noLife.length)];
            }
            s.powerups.push({ x: e.x, y: e.y, type: pType });
          }
        } else {
          // Hit flash particles
          s.particles.push(...createExplosion(b.x, b.y, '#fff', 6));
          s.particles.push(...createSparks(b.x, b.y, et.color, 4));
        }
      }
    });
  });

  s.bullets = s.bullets.filter((_, i) => !bulletsToRemove.has(i));
  s.enemies = s.enemies.filter((_, i) => !enemiesToRemove.has(i));

  // ─── Collision: enemy bullets vs player ───
  if (!s.player.invincible) {
    s.enemyBullets = s.enemyBullets.filter(b => {
      const dx = b.x - s.player.x;
      const dy = b.y - s.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.028) {
        if (s.player.shield) {
          s.player.shield = false;
          s.particles.push(...createExplosion(s.player.x, s.player.y, '#39ff14', 15));
          s.shakeTimer = 80;
          return false;
        }
        playerHit(s);
        return false;
      }
      return true;
    });
  }

  // ─── Collision: enemies touching player ───
  if (!s.player.invincible) {
    s.enemies = s.enemies.filter(e => {
      const dx = e.x - s.player.x;
      const dy = e.y - s.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.035 && e.state === 'diving') {
        if (s.player.shield) {
          s.player.shield = false;
          s.particles.push(...createExplosion(s.player.x, s.player.y, '#39ff14', 15));
          s.particles.push(...createExplosion(e.x, e.y, ENEMY_TYPES[e.type].color, 15));
          return false;
        }
        playerHit(s);
        s.particles.push(...createExplosion(e.x, e.y, ENEMY_TYPES[e.type].color, 20));
        return false;
      }
      return true;
    });
  }

  // ─── Collision: power-ups vs player ───
  s.powerups = s.powerups.filter(p => {
    const dx = p.x - s.player.x;
    const dy = p.y - s.player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 0.04) {
      applyPowerup(s.player, p.type, s);
      return false;
    }
    return true;
  });

  // ─── Update particles & popups ───
  s.particles = updateParticles(s.particles, dt);
  s.scorePopups = updateScorePopups(s.scorePopups, dt);

  // ─── Wave clear check ───
  if (s.enemies.length === 0 && !s.waveTransition) {
    s.waveTransition = true;
    s.waveTransitionTimer = 2500;
    // Bonus points for clearing wave
    const waveBonus = s.wave * 200;
    s.player.score += waveBonus;
    s.scorePopups.push({
      x: 0.5, y: 0.5,
      text: `WAVE CLEAR +${waveBonus}`,
      color: '#ffd700',
      life: 1500,
      maxLife: 1500,
    });
  }

  return s;
}

// ─── Helpers ────────────────────────────────────────

function playerHit(s) {
  s.player.lives--;
  s.player.invincible = true;
  s.player.invincibleEnd = s.elapsed + 2500;
  s.player.combo = 0;
  s.particles.push(...createExplosion(s.player.x, s.player.y, '#ff3864', 30));
  s.particles.push(...createExplosion(s.player.x, s.player.y, '#ffa500', 15));
  s.particles.push(...createDebris(s.player.x, s.player.y, '#00c8ff', 10));
  s.shakeTimer = 300;
  if (s.player.lives <= 0) {
    s.phase = 'gameover';
  }
}

function applyPowerup(player, type, state) {
  switch (type) {
    case 'shield':
      player.shield = true;
      break;
    case 'rapidFire':
      player.rapidFire = true;
      player.rapidFireEnd = state.elapsed + POWERUP_TYPES.rapidFire.duration;
      break;
    case 'spreadShot':
      player.spreadShot = true;
      player.spreadShotEnd = state.elapsed + POWERUP_TYPES.spreadShot.duration;
      break;
    case 'nuke':
      state.enemies.forEach(e => {
        state.particles.push(...createExplosion(e.x, e.y, ENEMY_TYPES[e.type].color, 12));
        player.score += ENEMY_TYPES[e.type].score;
      });
      state.enemies = [];
      state.shakeTimer = 500;
      state.nukeFlash = 400;
      break;
    case 'extraLife':
      player.lives = Math.min(player.lives + 1, 8);
      state.scorePopups.push({
        x: player.x, y: player.y - 0.05,
        text: 'EXTRA LIFE!',
        color: '#ff6bef',
        life: 1200,
        maxLife: 1200,
      });
      break;
  }
}

function createExplosion(x, y, color, count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 0.00008 + Math.random() * 0.00035;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 500 + Math.random() * 500,
      maxLife: 500 + Math.random() * 500,
      color,
      size: 1.5 + Math.random() * 3,
      type: 'circle',
    });
  }
  return particles;
}

function createSparks(x, y, color, count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.0002 + Math.random() * 0.0004;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 200 + Math.random() * 300,
      maxLife: 200 + Math.random() * 300,
      color,
      size: 0.8 + Math.random() * 1.2,
      type: 'spark',
    });
  }
  return particles;
}

function createDebris(x, y, color, count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.00006 + Math.random() * 0.00025;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.00005,
      life: 800 + Math.random() * 600,
      maxLife: 800 + Math.random() * 600,
      color,
      size: 2 + Math.random() * 3,
      type: 'debris',
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
    });
  }
  return particles;
}

function updateParticles(particles, dt) {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + 0.00000008 * dt,
      life: p.life - dt,
      rotation: p.rotation !== undefined ? p.rotation + (p.rotSpeed || 0) * dt : undefined,
    }))
    .filter(p => p.life > 0);
}

function updateScorePopups(popups, dt) {
  return popups
    .map(p => ({ ...p, y: p.y - 0.00008 * dt, life: p.life - dt }))
    .filter(p => p.life > 0);
}

// ─── Player Actions ─────────────────────────────────

export function playerShoot(state) {
  if (state.phase !== 'playing') return state;
  const p = state.player;
  const bullets = [...state.bullets];
  const baseSpeed = -0.0007;

  if (p.spreadShot) {
    bullets.push({ x: p.x - 0.008, y: p.y - 0.02, dy: baseSpeed, dx: -0.00012, owner: 'player' });
    bullets.push({ x: p.x, y: p.y - 0.025, dy: baseSpeed, dx: 0, owner: 'player' });
    bullets.push({ x: p.x + 0.008, y: p.y - 0.02, dy: baseSpeed, dx: 0.00012, owner: 'player' });
  } else {
    bullets.push({ x: p.x, y: p.y - 0.025, dy: baseSpeed, dx: 0, owner: 'player' });
  }

  return { ...state, bullets };
}

export function movePlayer(state, dx) {
  const newX = Math.max(0.04, Math.min(0.96, state.player.x + dx));
  return {
    ...state,
    player: { ...state.player, x: newX },
  };
}

// ─── Results ────────────────────────────────────────

export function getGalagaResults(state) {
  return {
    score: state.player.score,
    wave: state.wave,
    maxCombo: state.player.maxCombo,
    elapsed: state.elapsed,
  };
}
