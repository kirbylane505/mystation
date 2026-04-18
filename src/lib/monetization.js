/**
 * MYSTATION - Monetization mode gate
 * MYSTATION_MONETIZATION_MODE = 'grow' | 'enforce'
 * grow (default): everything allowed, ads dormant, skips unlimited
 * enforce: tier rules apply
 */

export function isMonetizationEnforced() {
  return process.env.MYSTATION_MONETIZATION_MODE === 'enforce';
}

export function gateFor(feature, userTier) {
  if (!isMonetizationEnforced()) return { allowed: true, reason: 'grow_mode' };

  const rules = {
    ad_free: (t) => t === 'premium' || t === 'creator',
    hi_fi_audio: (t) => t === 'premium' || t === 'creator',
    unlimited_skips: (t) => t === 'premium' || t === 'creator',
  };

  const rule = rules[feature];
  if (!rule) return { allowed: true, reason: 'unknown_feature' };

  return rule(userTier)
    ? { allowed: true, reason: 'tier_allows' }
    : { allowed: false, reason: 'upgrade_required' };
}
