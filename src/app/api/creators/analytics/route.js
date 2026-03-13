import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const summary = searchParams.get('summary') === 'true';

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: creator } = await supabase
    .from('creators')
    .select('id, total_plays, track_count, follower_count')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Merch count
  const { count: merchCount } = await supabase
    .from('creator_merch')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'active');

  if (summary) {
    return NextResponse.json({
      totalPlays: creator.total_plays,
      trackCount: creator.track_count,
      followerCount: creator.follower_count,
      merchCount: merchCount || 0,
    });
  }

  // Full analytics: top tracks
  const { data: topTracks } = await supabase
    .from('creator_tracks')
    .select('id, title, artist, plays, created_at')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .order('plays', { ascending: false })
    .limit(10);

  return NextResponse.json({
    totalPlays: creator.total_plays,
    trackCount: creator.track_count,
    followerCount: creator.follower_count,
    merchCount: merchCount || 0,
    topTracks: topTracks || [],
  });
}
