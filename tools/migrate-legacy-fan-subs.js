#!/usr/bin/env node
/**
 * MYSTATION - One-time legacy fan-sub migration
 *
 * Swaps anyone still on the old $9.99 Premium or $14.99 Diamond price
 * onto the new $4.99 Premium price. proration_behavior: 'none' — they
 * finish their current cycle at the old rate, next cycle bills $4.99.
 *
 * SAFETY: Dry-run is DEFAULT. You must pass --live to write.
 *
 * Usage:
 *   node tools/migrate-legacy-fan-subs.js            # dry run
 *   node tools/migrate-legacy-fan-subs.js --live     # real run
 *
 * Required env:
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   STRIPE_PRICE_PREMIUM (target price id — new $4.99)
 *   LEGACY_PRICE_IDS    (comma-separated list of old price ids to swap)
 */

import 'dotenv/config';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const LIVE = process.argv.includes('--live');
const MODE = LIVE ? 'LIVE' : 'DRY_RUN';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'));
const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
);

const NEW_PREMIUM_PRICE_ID = requireEnv('STRIPE_PRICE_PREMIUM');
const OLD_PRICES_TO_SWAP = requireEnv('LEGACY_PRICE_IDS')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  console.log(`=== LEGACY FAN-SUB MIGRATION (${MODE}) ===`);
  console.log(`Target price: ${NEW_PREMIUM_PRICE_ID}`);
  console.log(`Old prices:   ${OLD_PRICES_TO_SWAP.join(', ')}`);
  console.log('');

  const { data: subs, error } = await supabase
    .from('subscribers')
    .select('user_id, email, stripe_subscription_id, tier, status')
    .in('tier', ['premium', 'diamond'])
    .eq('status', 'active');

  if (error) {
    console.error('Supabase query failed:', error.message);
    process.exit(1);
  }

  console.log(`Found ${subs.length} candidate(s) in Supabase.\n`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subs) {
    const label = sub.email || sub.user_id;
    if (!sub.stripe_subscription_id) {
      console.log(`SKIP ${label}: no stripe_subscription_id`);
      skipped++;
      continue;
    }

    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const item = stripeSub.items.data[0];
      const currentPriceId = item?.price?.id;

      if (!OLD_PRICES_TO_SWAP.includes(currentPriceId)) {
        console.log(`SKIP ${label}: not on old price (on ${currentPriceId})`);
        skipped++;
        continue;
      }

      if (!LIVE) {
        console.log(`WOULD ${label}: ${currentPriceId} → ${NEW_PREMIUM_PRICE_ID}`);
        migrated++;
        continue;
      }

      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: item.id, price: NEW_PREMIUM_PRICE_ID }],
        proration_behavior: 'none',
      });

      await supabase
        .from('subscribers')
        .update({ tier: 'premium' })
        .eq('user_id', sub.user_id);

      console.log(`OK   ${label}: swapped to Premium ($4.99)`);
      migrated++;
    } catch (err) {
      console.error(`FAIL ${label}:`, err.message);
      failed++;
    }
  }

  console.log('');
  console.log(`=== DONE (${MODE}) ===`);
  console.log(`Migrated: ${migrated}  Skipped: ${skipped}  Failed: ${failed}`);
  if (!LIVE) {
    console.log('');
    console.log('This was a DRY RUN. Re-run with --live to apply.');
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
