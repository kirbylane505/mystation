import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { isMonetizationEnforced, gateFor } from '@/lib/monetization';

export async function GET() {
  try {
    // Grow mode: ads are dormant — no ad served to anyone.
    if (!isMonetizationEnforced()) {
      return NextResponse.json({ ad: null });
    }

    // Enforce mode: subscribed users skip ads, everyone else gets one.
    const cookieStore = await cookies();
    const subFlag = cookieStore.get('mystation-sub-flag')?.value === '1';
    const userTier = subFlag ? 'premium' : 'free';
    const { allowed } = gateFor('ad_free', userTier);
    if (allowed) return NextResponse.json({ ad: null });

    const supabase = getSupabaseAdmin();

    // Get a random active ad within its date range
    const { data: ads } = await supabase
      .from('ads')
      .select('id, title, audio_url, banner_url, click_url')
      .eq('active', true)
      .or('start_date.is.null,start_date.lte.' + new Date().toISOString().split('T')[0])
      .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0])
      .limit(10);

    if (!ads || ads.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Pick random ad
    const ad = ads[Math.floor(Math.random() * ads.length)];

    return NextResponse.json({ ad });
  } catch (err) {
    console.error('[ad-serve] Error:', err);
    return NextResponse.json({ ad: null });
  }
}
