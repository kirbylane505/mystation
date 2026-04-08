import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request, { params }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Get creator profile
  const { data: creator } = await supabase
    .from('creators')
    .select('id, slug, display_name, category, bio, avatar_url, banner_url, genre_tags, social_links, verified, track_count, follower_count, total_plays, is_live, current_stream_id, created_at')
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

  // Get their videos
  const { data: videos } = await supabase
    .from('creator_videos')
    .select('id, title, description, video_url, thumbnail_url, duration, views, created_at')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  // Get public gallery albums with items
  const { data: albums } = await supabase
    .from('creator_albums')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('visibility', 'public')
    .order('sort_order', { ascending: true });

  let albumsWithItems = [];
  if (albums && albums.length > 0) {
    const albumIds = albums.map(a => a.id);
    const { data: items } = await supabase
      .from('creator_gallery_items')
      .select('*')
      .in('album_id', albumIds)
      .order('sort_order', { ascending: true });

    const itemsByAlbum = {};
    for (const item of (items || [])) {
      if (!itemsByAlbum[item.album_id]) {
        itemsByAlbum[item.album_id] = [];
      }
      itemsByAlbum[item.album_id].push(item);
    }

    albumsWithItems = albums.map(album => ({
      ...album,
      items: itemsByAlbum[album.id] || [],
    }));
  }

  return NextResponse.json({
    creator,
    tracks: tracks || [],
    merch: merch || [],
    videos: videos || [],
    albums: albumsWithItems,
  });
}
