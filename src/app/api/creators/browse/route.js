import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('creators')
    .select('slug, display_name, category, bio, avatar_url, genre_tags, verified, track_count, follower_count, total_plays')
    .eq('subscription_status', 'active')
    .order('follower_count', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,bio.ilike.%${search}%`);
  }

  const { data: creators, count } = await query;

  return NextResponse.json({
    creators: creators || [],
    total: count || 0,
  });
}
