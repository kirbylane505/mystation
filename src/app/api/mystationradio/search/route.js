import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ results: [] });

  const supabase = getSupabaseAdmin();
  const { data: creators } = await supabase
    .from('creators')
    .select('slug, display_name, avatar_url, track_count')
    .ilike('display_name', `%${q}%`)
    .eq('subscription_status', 'active')
    .limit(10);

  const results = (creators || []).map((c) => ({
    slug: c.slug,
    name: c.display_name,
    avatar: c.avatar_url,
    trackCount: c.track_count || 0,
  }));

  // Always include Mike Page if query matches
  if ('mike page'.includes(q.toLowerCase()) || 'idmg'.includes(q.toLowerCase())) {
    results.unshift({
      slug: 'mike-page',
      name: 'Mike Page',
      avatar: '/images/idmg-logo-white.png',
      trackCount: mikePageTracks.length,
    });
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
