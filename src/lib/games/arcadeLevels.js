/**
 * KICKBACK LOUNGE — Arcade Pool Level Definitions
 * 30 levels: Rookie (1-8), Street (9-16), Hustler (17-24), Pro (25-30)
 */

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

export const AIM_GUIDE_CONFIG = {
  rookie: { length: 800, showBallPrediction: true, showTrajectory: true },
  street: { length: 500, showBallPrediction: false, showTrajectory: true },
  hustler: { length: 300, showBallPrediction: false, showTrajectory: true },
  pro: { length: 120, showBallPrediction: false, showTrajectory: false },
};

export const POCKET_SCALE = {
  rookie: 1.5,
  street: 1.0,
  hustler: 1.0,
  pro: 0.85,
};

export const LEVELS = [
  // === ROOKIE (1-8) — Giant pockets, full aim guide, fewer balls ===
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
    starThresholds: [22, 16, 10], description: 'Now we\'re cooking! 10 balls!' },
  { num: 8, name: 'Rookie Finals', type: 'clear', balls: [0, 1, 2, 3, 4, 5, 6, 7, 8], shotLimit: 20,
    starThresholds: [20, 14, 9], description: 'Clear 8 balls including the 8-ball. Rookie complete!' },

  // === STREET (9-16) — Normal pockets, trajectory guide, full rack ===
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

  // === HUSTLER (17-24) — Normal pockets, short guide, time pressure ===
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

  // === PRO (25-30) — Tight pockets, minimal guide, trick shots ===
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
 * Get stars earned for a level based on performance
 * For 'clear'/'combo'/'trick': metric = shots used (lower = better)
 * For 'time': metric = seconds remaining (higher = better)
 */
export function getStars(levelNum, metric) {
  const level = LEVELS[levelNum - 1];
  if (!level) return 0;
  const [one, two, three] = level.starThresholds;
  if (level.type === 'time') {
    if (metric >= two) return 3;
    if (metric >= one * 0.4) return 2;
    return 1;
  }
  if (metric <= three) return 3;
  if (metric <= two) return 2;
  return 1;
}

export function loadArcadeProgress() {
  try {
    const data = localStorage.getItem('ms-arcade-pool');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

export function saveArcadeProgress(progress) {
  try {
    localStorage.setItem('ms-arcade-pool', JSON.stringify(progress));
  } catch { /* storage full */ }
}
