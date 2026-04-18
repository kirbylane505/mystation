/**
 * MYSTATION - Subscription cancel with 6-month commitment guard
 * Premium subs carry metadata.commitment_start — cancel is rejected
 * until 6 billing cycles have passed. Other tiers cancel freely.
 *
 * This is a thin cancel endpoint the app calls directly. Stripe Billing
 * Portal is the escape hatch for staff-assisted refunds.
 */

import { NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rateLimit';

const cancelLimiter = createRateLimiter('subscription-cancel', 10, 3600000); // 10/hour/IP

function monthsElapsed(startIso) {
  const start = new Date(startIso);
  if (isNaN(start)) return Infinity; // unparseable = treat as fully elapsed (fail open)
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

export async function POST(request) {
  const limited = cancelLimiter(request);
  if (limited) return limited;

  try {
    const { subscriptionId, email } = await request.json();
    if (!subscriptionId && !email) {
      return NextResponse.json({ error: 'subscriptionId or email required' }, { status: 400 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let sub;
    if (subscriptionId) {
      sub = await stripe.subscriptions.retrieve(subscriptionId);
    } else {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (!customers.data.length) {
        return NextResponse.json({ error: 'No customer found' }, { status: 404 });
      }
      const subs = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'active',
        limit: 1,
      });
      if (!subs.data.length) {
        return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
      }
      sub = subs.data[0];
    }

    const commitmentStart = sub.metadata?.commitment_start;
    const commitmentMonths = parseInt(sub.metadata?.commitment_months || '0', 10);

    if (commitmentStart && commitmentMonths > 0) {
      const elapsed = monthsElapsed(commitmentStart);
      if (elapsed < commitmentMonths) {
        const unlockDate = new Date(commitmentStart);
        unlockDate.setMonth(unlockDate.getMonth() + commitmentMonths);
        return NextResponse.json({
          error: `Premium has a ${commitmentMonths}-month commitment. You can cancel starting ${unlockDate.toLocaleDateString()}.`,
          unlockDate: unlockDate.toISOString(),
          monthsRemaining: commitmentMonths - elapsed,
        }, { status: 403 });
      }
    }

    // Cancel at period end so they keep access through paid period
    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });

    return NextResponse.json({
      success: true,
      subscriptionId: updated.id,
      cancelAt: updated.cancel_at,
    });
  } catch (err) {
    console.error('Subscription cancel error:', err);
    return NextResponse.json({ error: err.message || 'Failed to cancel' }, { status: 500 });
  }
}
