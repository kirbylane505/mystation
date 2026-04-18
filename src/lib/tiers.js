/**
 * MYSTATION — Tier Configuration & Feature Gates
 * Single source of truth for subscription tiers.
 *
 * Canonical tiers (post-redesign, Apr 2026):
 *   free    — $0   (display name: Supporter)
 *   premium — $4.99/mo  (was "supporter" tier; same Stripe price ID)
 *   creator — $14.99/mo
 *
 * Legacy tiers accepted during DB migration (Task 8):
 *   'supporter' → 'premium' (same $4.99 price, just renamed)
 *   'diamond'   → 'premium' (downgraded, grandfathered — no UX regression)
 *   'regular'   → 'premium' (historic alias)
 */

// Canonical tiers. Order = access level (0 = no access, 2 = most).
export const TIERS = {
  free:    { level: 0, name: 'Supporter', price: 0,     priceId: null },
  premium: { level: 1, name: 'Premium',   price: 4.99,  priceId: process.env.STRIPE_PRICE_PREMIUM },
  creator: { level: 2, name: 'Creator',   price: 14.99, priceId: process.env.STRIPE_PRICE_CREATOR },
};

/**
 * Normalize any tier string (legacy or canonical) to a canonical key.
 * Returns one of: 'free' | 'premium' | 'creator'.
 */
export function normalizeTier(tier) {
  if (!tier) return 'free';
  const t = String(tier).toLowerCase();
  // Legacy aliases from the DB / old code paths
  if (t === 'supporter' || t === 'diamond' || t === 'regular') return 'premium';
  if (t in TIERS) return t;
  return 'free';
}

export function tierLevel(tier) {
  return TIERS[normalizeTier(tier)]?.level ?? 0;
}

export function hasAccess(userTier, requiredTier) {
  return tierLevel(userTier) >= tierLevel(requiredTier);
}

export function tierName(tier) {
  return TIERS[normalizeTier(tier)]?.name ?? 'Supporter';
}

export function priceIdFor(tier) {
  return TIERS[normalizeTier(tier)]?.priceId ?? null;
}

// ---------------------------------------------------------------------------
// Legacy-compat exports — keep existing call sites working without edits.
// These resolve against canonical tiers after normalizeTier().
// ---------------------------------------------------------------------------

/** @deprecated Prefer tierLevel(). Kept for back-compat. */
export const TIER_LEVEL = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined;
    return tierLevel(prop);
  },
  has(_target, prop) {
    if (typeof prop !== 'string') return false;
    return normalizeTier(prop) !== 'free' || prop === 'free';
  },
});

/** @deprecated Prefer priceIdFor(). Kept for back-compat. */
export const TIER_PRICES = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined;
    return priceIdFor(prop);
  },
  has(_target, prop) {
    if (typeof prop !== 'string') return false;
    // Only treat canonical paid tiers as "present" for checkout validation.
    const norm = normalizeTier(prop);
    return norm === 'premium' || norm === 'creator';
  },
});

/** @deprecated Prefer tierName() and priceIdFor(). */
export const TIER_INFO = {
  free:    { name: 'Supporter', price: 0,     color: 'slate',  icon: 'Headphones' },
  premium: { name: 'Premium',   price: 4.99,  color: 'blue',   icon: 'Star' },
  creator: { name: 'Creator',   price: 14.99, color: 'amber',  icon: 'Gem' },
};

/**
 * Reverse lookup: Stripe price_id → canonical tier name.
 * Returns 'free' when priceId is unknown.
 */
export function tierFromPriceId(priceId) {
  if (!priceId) return 'free';
  for (const [tier, cfg] of Object.entries(TIERS)) {
    if (cfg.priceId && cfg.priceId === priceId) return tier;
  }
  return 'free';
}

/** @deprecated Prefer tierLevel(). */
export function getTierLevel(tier) {
  return tierLevel(tier);
}

/** @deprecated Available upgrades from current canonical tier. */
export function getUpgradeOptions(currentTier) {
  const level = tierLevel(currentTier);
  const options = [];
  if (level < TIERS.premium.level) options.push('premium');
  if (level < TIERS.creator.level) options.push('creator');
  return options;
}
