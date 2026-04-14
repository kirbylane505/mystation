import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Fetch all active creators + their track counts
  const { data: creators } = await supabase
    .from('creators')
    .select('slug, display_name, avatar_url, track_count')
    .eq('subscription_status', 'active')
    .gt('track_count', 0)
    .order('track_count', { ascending: false });

  const artists = [
    {
      slug: 'mike-page',
      name: 'Mike Page',
      avatar: '/images/idmg-logo-white.png',
      trackCount: mikePageTracks.length,
    },
    ...(creators || []).map((c) => ({
      slug: c.slug,
      name: c.display_name,
      avatar: c.avatar_url,
      trackCount: c.track_count || 0,
    })),
  ];

  return NextResponse.json({
    artists,
    totalTracks: artists.reduce((sum, a) => sum + a.trackCount, 0),
  });
}
