import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function displayName(email) {
  const prefix = email.split('@')[0];
  // Split on dots, underscores, dashes
  const parts = prefix.split(/[._-]/);
  const first = parts[0].replace(/[0-9]/g, '');
  if (first.length < 2) return parts.length > 1 ? parts[1].replace(/[0-9]/g, '') : 'Member';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export async function GET() {
  const { data, error } = await supabase
    .from('subscribers')
    .select('email, subscriber_number, tier, created_at')
    .eq('status', 'active')
    .order('subscriber_number', { ascending: true });

  if (error) {
    return NextResponse.json({ names: [], count: 0 }, { status: 200 });
  }

  const names = data.map(s => ({
    name: displayName(s.email),
    number: s.subscriber_number,
    tier: s.tier,
  }));

  return NextResponse.json({
    names,
    count: data.length,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
  });
}
