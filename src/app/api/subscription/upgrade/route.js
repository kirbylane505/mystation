/**
 * MYSTATION — Subscription Upgrade/Downgrade
 * Changes tier by swapping Stripe subscription price with proration.
 */

import { NextResponse } from 'next/server';
import { normalizeTier, priceIdFor, tierLevel } from '@/lib/tiers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const UPGRADE_ALLOWED_TIERS = new Set(['premium', 'creator']);

export async function POST(request) {
  try {
    const { email, newTier } = await request.json();

    const canonicalNewTier = normalizeTier(newTier);
    if (!email || !UPGRADE_ALLOWED_TIERS.has(canonicalNewTier)) {
      return NextResponse.json(
        { error: 'Email and valid tier (premium or creator) required' },
        { status: 400 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();

    // Look up subscriber — try new columns first, fall back to Stripe API lookup
    let subscriber;
    const { data: subData, error: subErr } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (!subData) {
      return NextResponse.json(
        { error: 'No subscriber record found' },
        { status: 404 }
      );
    }

    subscriber = subData;

    // If stripe_subscription_id not in DB yet, look up via Stripe API by email
    if (!subscriber.stripe_subscription_id) {
      const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: 'active',
          limit: 1,
        });
        if (subs.data.length > 0) {
          subscriber.stripe_subscription_id = subs.data[0].id;
          subscriber.stripe_customer_id = customers.data[0].id;
        }
      }
    }

    if (!subscriber.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active Stripe subscription found. Please subscribe first.' },
        { status: 404 }
      );
    }

    if (normalizeTier(subscriber.tier) === canonicalNewTier) {
      return NextResponse.json(
        { error: 'Already on this tier' },
        { status: 400 }
      );
    }

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    const newPriceId = priceIdFor(canonicalNewTier);

    // Update the subscription item to new price
    const updated = await stripe.subscriptions.update(subscriber.stripe_subscription_id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      metadata: { tier: canonicalNewTier, source: 'mystation' },
    });

    // Update Supabase immediately (webhook will also fire as backup)
    const { error: updateErr } = await supabase
      .from('subscribers')
      .update({
        tier: canonicalNewTier,
        current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
      })
      .eq('email', email.toLowerCase());
    if (updateErr) {
      // current_period_end column may not exist yet — update just the tier
      await supabase
        .from('subscribers')
        .update({ tier: canonicalNewTier })
        .eq('email', email.toLowerCase());
    }

    const isUpgrade = tierLevel(canonicalNewTier) > tierLevel(subscriber.tier);

    return NextResponse.json({
      success: true,
      previousTier: normalizeTier(subscriber.tier),
      newTier: canonicalNewTier,
      action: isUpgrade ? 'upgraded' : 'downgraded',
      currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json(
      { error: 'Failed to change subscription' },
      { status: 500 }
    );
  }
}
