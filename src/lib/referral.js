/**
 * MYSTATION - Referral Engine
 * Online Street Team code generation + tier system
 */

/**
 * Generate a unique 6-character referral code.
 * Uses only unambiguous characters (no 0/O, 1/I/L).
 */
export function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Calculate the tier based on referral count.
 */
export function calculateTier(referralCount) {
  if (referralCount >= 50) return { tier: 'General', reward: 'Free premium merch + VIP festival access' };
  if (referralCount >= 30) return { tier: 'Captain', reward: 'Free tee + early access to drops' };
  if (referralCount >= 15) return { tier: 'Lieutenant', reward: '20% merch discount code' };
  if (referralCount >= 5) return { tier: 'Soldier', reward: 'Free sticker pack' };
  return { tier: 'Recruit', reward: 'Exclusive wallpaper' };
}

/**
 * All tier thresholds for display in the UI.
 */
export const TIER_THRESHOLDS = [
  { name: 'Recruit', min: 0, reward: 'Exclusive wallpaper', icon: 'shield' },
  { name: 'Soldier', min: 5, reward: 'Free sticker pack', icon: 'sword' },
  { name: 'Lieutenant', min: 15, reward: '20% merch discount code', icon: 'medal' },
  { name: 'Captain', min: 30, reward: 'Free tee + early access to drops', icon: 'star' },
  { name: 'General', min: 50, reward: 'Free premium merch + VIP festival access', icon: 'crown' },
];
