/**
 * MYSTATION — Public Profile API
 * GET: Get public profile by username (with stats, badges, counts)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    const [
      { count: followers },
      { count: following },
      { data: badges },
      { data: gameStats },
      { data: activity },
      { data: publicPlaylists },
    ] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.user_id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.user_id),
      supabase.from('badges').select('badge_id, earned_at').eq('user_id', profile.user_id),
      supabase.from('game_stats').select('game_type, wins, losses, games_played, current_streak, best_streak, points_earned').eq('user_id', profile.user_id),
      supabase.from('activity_feed').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('playlists').select('id, name, description, track_ids, created_at').eq('user_id', profile.user_id).eq('is_public', true).order('created_at', { ascending: false }),
    ]);

    let isFollowing = false;
    const reqEmail = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (reqEmail) {
      const encoder = new TextEncoder();
      const data = encoder.encode(reqEmail.toLowerCase().trim());
      const hash = await crypto.subtle.digest('SHA-256', data);
      const arr = Array.from(new Uint8Array(hash));
      const requesterId = 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

      const { data: followRow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', requesterId)
        .eq('following_id', profile.user_id)
        .single();
      isFollowing = !!followRow;
    }

    const { email: _email, ...publicProfile } = profile;

    return NextResponse.json({
      profile: {
        ...publicProfile,
        followers: followers || 0,
        following: following || 0,
        isFollowing,
        badges: badges || [],
        gameStats: gameStats || [],
        activity: activity || [],
        playlists: (publicPlaylists || []).map(p => ({
          ...p,
          trackCount: Array.isArray(p.track_ids) ? p.track_ids.length : 0,
        })),
      },
    });
  } catch (err) {
    console.error('Public profile error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
