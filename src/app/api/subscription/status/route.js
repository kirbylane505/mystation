/**
 * MYSTATION — Subscription Status
 * Returns current tier, status, renewal date from Supabase.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ tier: 'free', status: 'none' });
    }

    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (!subscriber || subscriber.status !== 'active') {
      return NextResponse.json({
        tier: 'free',
        status: subscriber?.status || 'none',
        isSubscribed: false,
      });
    }

    return NextResponse.json({
      tier: subscriber.tier || 'supporter',
      status: subscriber.status,
      isSubscribed: true,
      currentPeriodEnd: subscriber.current_period_end,
      cancelAtPeriodEnd: subscriber.cancel_at_period_end || false,
      subscriberNumber: subscriber.subscriber_number,
      memberSince: subscriber.created_at,
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
