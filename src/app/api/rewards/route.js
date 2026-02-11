import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({ totalSpentCents: 0, tier: null });
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

    return NextResponse.json({ totalSpentCents, tier });
  } catch (e) {
    console.error('Rewards fetch error:', e);
    return NextResponse.json({ totalSpentCents: 0, tier: null });
  }
}
