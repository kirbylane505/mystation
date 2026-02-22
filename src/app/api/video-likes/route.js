/**
 * VIDEO LIKES API - Instagram-style heart/like system
 * GET: Fetch like count + whether visitor liked it
 * POST: Toggle like/unlike
 *
 * Required Supabase table:
 * ---------------------------------------------------------
 * CREATE TABLE video_likes (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   video_id text NOT NULL,
 *   visitor_id text NOT NULL,
 *   created_at timestamptz DEFAULT now(),
 *   UNIQUE(video_id, visitor_id)
 * );
 * CREATE INDEX idx_video_likes_video_id ON video_likes (video_id);
 * ---------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  const visitorId = searchParams.get('visitorId');

  if (!videoId) {
    return NextResponse.json({ likes: 0, liked: false });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ likes: 0, liked: false });
  }

  try {
    // Get total like count
    const { count, error: countError } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);

    if (countError) {
      console.error('Video likes count error:', countError.message);
      return NextResponse.json({ likes: 0, liked: false });
    }

    // Check if this visitor liked it
    let liked = false;
    if (visitorId) {
      const { data } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('visitor_id', visitorId)
        .maybeSingle();
      liked = !!data;
    }

    return NextResponse.json({ likes: count || 0, liked });
  } catch (err) {
    console.error('Video likes GET error:', err);
    return NextResponse.json({ likes: 0, liked: false });
  }
}

export async function POST(request) {
  try {
    const { videoId, visitorId } = await request.json();

    if (!videoId || !visitorId) {
      return NextResponse.json({ error: 'videoId and visitorId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('visitor_id', visitorId)
      .maybeSingle();

    if (existing) {
      // Unlike — delete the row
      await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('visitor_id', visitorId);
    } else {
      // Like — insert new row
      const { error } = await supabase
        .from('video_likes')
        .insert({ video_id: videoId, visitor_id: visitorId });

      if (error) {
        console.error('Video like insert error:', error.message);
        return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
      }
    }

    // Return updated count
    const { count } = await supabase
      .from('video_likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', videoId);

    return NextResponse.json({
      likes: count || 0,
      liked: !existing,
    });
  } catch (err) {
    console.error('Video likes POST error:', err);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
