/**
 * MYSTATION - Subscribe API
 * First 250 subscribers who stay subscribed until Aug 1 get a FREE ticket to LOTL 2026
 * Tracks subscriber count server-side
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendNewSignupAlert } from '@/lib/email';
import { createRateLimiter, isValidEmail } from '@/lib/rateLimit';

const LOTL_SLOTS = 250;
const subscribeLimiter = createRateLimiter('subscribe', 3, 3600000); // 3 per IP per hour

export async function POST(request) {
  const limited = subscribeLimiter(request);
  if (limited) return limited;

  try {
    const { email } = await request.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if Supabase is available
    if (!supabase) {
      // Fallback: direct to Stripe
      return NextResponse.json({
        success: true,
        isFree: false,
        message: 'Redirecting to payment',
        stripeUrl: 'https://buy.stripe.com/5kQbJ3fyX0l0gLafHd1oI00',
      premiumUrl: 'https://buy.stripe.com/bJe00lcmL2t8cuUcv11oI01',
      diamondUrl: 'https://buy.stripe.com/6oUbJ3euT5FkdyYgLh1oI02',
      });
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (existing?.status === 'active') {
      return NextResponse.json({
        success: true,
        isFree: false,
        message: 'Already subscribed!',
        alreadySubscribed: true,
      });
    }

    // Count total subscribers
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    const subscriberNumber = (count || 0) + 1;
    const lotlEligible = subscriberNumber <= LOTL_SLOTS;

    // Create subscriber record
    await supabase.from('subscribers').upsert({
      email: email.toLowerCase(),
      status: 'active',
      tier: 'supporter',
      is_free_trial: false,
      subscriber_number: subscriberNumber,
      created_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    // Fire-and-forget: Alert Mike
    sendNewSignupAlert({
      customerName: email.split('@')[0],
      customerEmail: email.toLowerCase(),
      subscriberNumber,
      isFreeSlot: lotlEligible,
    }).catch((err) => console.error('Signup alert email failed:', err));

    const lotlMessage = lotlEligible
      ? ` Stay subscribed until Aug 1 for a FREE ticket to Love on the Lawn 2026!`
      : '';

    return NextResponse.json({
      success: true,
      isFree: false,
      subscriberNumber,
      lotlEligible,
      message: `You're subscriber #${subscriberNumber}!${lotlMessage}`,
      stripeUrl: 'https://buy.stripe.com/5kQbJ3fyX0l0gLafHd1oI00',
      premiumUrl: 'https://buy.stripe.com/bJe00lcmL2t8cuUcv11oI01',
      diamondUrl: 'https://buy.stripe.com/6oUbJ3euT5FkdyYgLh1oI02',
      remaining: Math.max(0, LOTL_SLOTS - subscriberNumber),
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}

// Check how many LOTL promo slots remain
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ lotlSlots: LOTL_SLOTS, taken: 0, remaining: LOTL_SLOTS });
    }

    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    const taken = count || 0;
    return NextResponse.json({
      lotlSlots: LOTL_SLOTS,
      taken,
      remaining: Math.max(0, LOTL_SLOTS - taken),
    });
  } catch {
    return NextResponse.json({ lotlSlots: LOTL_SLOTS, taken: 0, remaining: LOTL_SLOTS });
  }
}
