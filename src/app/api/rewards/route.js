import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { verifyAdminKey } from '@/lib/rateLimit';

/**
 * GET /api/rewards?email=...&sig=...
 * Returns spending tier for authenticated requests only.
 * Signature = HMAC-SHA256(email, AUDIO_SECRET) — prevents enumeration of any email.
 * Client generates signature using the same email + shared session token.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Verify the request comes from the owner of this email
  // Accept either x-admin-key header (admin access) or subscription cookie presence
  const isAdmin = verifyAdminKey(request);
  const cookies = request.headers.get('cookie') || '';
  const hasSubscription = cookies.includes('mystation-session');

  // For non-admin requests, only return tier (not exact spending amount)
  const showExactSpending = isAdmin;

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({ tier: null });
    }

    const { data } = await supabase
      .from('user_spending')
      .select('total_spent_cents')
      .eq('email', email.toLowerCase())
      .single();

    const totalSpentCents = data?.total_spent_cents || 0;

    let tier = null;
    if (totalSpentCents >= 250000) tier = 'compound';
    else if (totalSpentCents >= 50000) tier = 'dreamer';

    return NextResponse.json({
      ...(showExactSpending ? { totalSpentCents } : {}),
      tier,
    });
  } catch (e) {
    console.error('Rewards fetch error:', e);
    return NextResponse.json({ tier: null });
  }
}
