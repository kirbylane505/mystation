/**
 * MYSTATION — Tier Configuration & Feature Gates
 * Single source of truth for subscription tiers.
 */

// Tier levels (higher = more features)
export const TIER_LEVEL = {
  free: 0,
  supporter: 1,
  regular: 1, // alias
  premium: 2,
  diamond: 3,
};

// Price IDs — set in env vars after creating Stripe Products
export const TIER_PRICES = {
  supporter: process.env.STRIPE_PRICE_SUPPORTER,
  regular: process.env.STRIPE_PRICE_SUPPORTER, // alias — same as supporter
  premium: process.env.STRIPE_PRICE_PREMIUM,
  diamond: process.env.STRIPE_PRICE_DIAMOND,
};

// Reverse lookup: price_id → tier name
export function tierFromPriceId(priceId) {
  for (const [tier, id] of Object.entries(TIER_PRICES)) {
    if (id === priceId) return tier;
  }
  return 'supporter'; // fallback
}

// Tier display info
export const TIER_INFO = {
  supporter: { name: 'Supporter', price: 4.99, color: 'blue', icon: 'Headphones' },
  premium: { name: 'Premium', price: 9.99, color: 'purple', icon: 'Star' },
  diamond: { name: 'Diamond', price: 14.99, color: 'amber', icon: 'Gem' },
};

// Feature gate: does this tier have access?
export function hasAccess(userTier, requiredTier) {
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0);
}

// Get numeric level
export function getTierLevel(tier) {
  return TIER_LEVEL[tier] || 0;
}

// What tier can upgrade to?
export function getUpgradeOptions(currentTier) {
  const level = getTierLevel(currentTier);
  const options = [];
  if (level < 1) options.push('supporter');
  if (level < 2) options.push('premium');
  if (level < 3) options.push('diamond');
  return options;
}
