/**
 * MYSTATION - Subscribe API
 * First 26 subscribers get free first month, then $4.99/mo
 * Tracks subscriber count server-side
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const FREE_SLOTS = 26;

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
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
        stripeUrl: 'https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04',
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
    const isFree = subscriberNumber <= FREE_SLOTS;

    if (isFree) {
      // Free slot! Create subscriber record
      const freeUntil = new Date();
      freeUntil.setMonth(freeUntil.getMonth() + 1);

      await supabase.from('subscribers').upsert({
        email: email.toLowerCase(),
        status: 'active',
        tier: 'supporter',
        is_free_trial: true,
        subscriber_number: subscriberNumber,
        free_until: freeUntil.toISOString(),
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return NextResponse.json({
        success: true,
        isFree: true,
        subscriberNumber,
        freeUntil: freeUntil.toISOString(),
        message: `You're subscriber #${subscriberNumber}! First month FREE.`,
        remainingFreeSlots: FREE_SLOTS - subscriberNumber,
      });
    }

    // Not free — redirect to Stripe
    return NextResponse.json({
      success: true,
      isFree: false,
      subscriberNumber,
      message: 'Free slots filled. Subscribe for $4.99/mo.',
      stripeUrl: 'https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04',
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    );
  }
}

// Check how many free slots remain
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ freeSlots: FREE_SLOTS, taken: 0, remaining: FREE_SLOTS });
    }

    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    const taken = count || 0;
    return NextResponse.json({
      freeSlots: FREE_SLOTS,
      taken,
      remaining: Math.max(0, FREE_SLOTS - taken),
    });
  } catch {
    return NextResponse.json({ freeSlots: FREE_SLOTS, taken: 0, remaining: FREE_SLOTS });
  }
}
