/**
 * MYSTATION — Stripe Checkout Session Creator
 * Replaces Payment Links with server-created sessions for full control.
 * Supports new subscriptions with 30-day free trial.
 */

import { NextResponse } from 'next/server';
import { TIER_PRICES } from '@/lib/tiers';

export async function POST(request) {
  try {
    const { tier, email } = await request.json();

    if (!tier || !TIER_PRICES[tier]) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: supporter, premium, or diamond' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const priceId = TIER_PRICES[tier];
    if (!priceId) {
      console.error(`Missing STRIPE_PRICE for tier: ${tier}`);
      return NextResponse.json(
        { error: 'Subscription not configured' },
        { status: 500 }
      );
    }

    // Check if customer already exists in Stripe
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;

      // Check if they already have an active subscription
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      if (subs.data.length > 0) {
        return NextResponse.json({
          error: 'Already subscribed. Use upgrade to change tier.',
          alreadySubscribed: true,
          currentTier: subs.data[0].metadata?.tier || 'supporter',
        }, { status: 409 });
      }
    }

    // Create Checkout Session
    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://mystationlive.com/subscribe/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: 'https://mystationlive.com/subscribe',
      subscription_data: {
        trial_period_days: 30,
        metadata: { tier, priceId, source: 'mystation' },
      },
      metadata: { tier, priceId, source: 'mystation' },
      allow_promotion_codes: true,
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
