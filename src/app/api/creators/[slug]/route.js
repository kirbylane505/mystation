import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Get creator profile
  const { data: creator } = await supabase
    .from('creators')
    .select('id, slug, display_name, category, bio, avatar_url, banner_url, genre_tags, social_links, verified, track_count, follower_count, total_plays, created_at')
    .eq('slug', slug)
    .eq('subscription_status', 'active')
    .maybeSingle();

  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  // Get their tracks
  const { data: tracks } = await supabase
    .from('creator_tracks')
    .select('id, title, artist, album, producer, duration, audio_url, cover_url, plays, created_at')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get their merch
  const { data: merch } = await supabase
    .from('creator_merch')
    .select('id, title, description, price, image_url, variants')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    creator,
    tracks: tracks || [],
    merch: merch || [],
  });
}
