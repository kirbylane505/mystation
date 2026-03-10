/**
 * MYSTATION — Playlists API
 * GET: List own playlists
 * POST: Create a playlist (subscribers only)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PROFILE_LIMITS } from '@/lib/profiles/constants';

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function getEmailFromRequest(request) {
  return request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email') || null;
}

export async function GET(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) return NextResponse.json({ playlists: [] });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ playlists: [] });

    const userId = await hashEmail(email);
    const { data } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ playlists: data || [] });
  } catch (err) {
    return NextResponse.json({ playlists: [], error: 'Failed to fetch' });
  }
}

export async function POST(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const isSub = request.cookies.get('mystation-sub')?.value ||
                  request.cookies.get('mystation-sub-flag')?.value;
    if (!isSub) {
      return NextResponse.json({ error: 'Subscribers only' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = await hashEmail(email);
    const body = await request.json();

    const { count } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count || 0) >= PROFILE_LIMITS.maxPlaylists) {
      return NextResponse.json({ error: `Max ${PROFILE_LIMITS.maxPlaylists} playlists` }, { status: 400 });
    }

    const name = (body.name || 'My Playlist').trim().slice(0, PROFILE_LIMITS.playlistNameMax);
    const description = (body.description || '').trim().slice(0, PROFILE_LIMITS.playlistDescMax);
    const trackIds = Array.isArray(body.track_ids)
      ? body.track_ids.slice(0, PROFILE_LIMITS.maxTracksPerPlaylist)
      : [];

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name,
        description,
        track_ids: trackIds,
        is_public: body.is_public !== false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ playlist });
  } catch (err) {
    console.error('Playlist create error:', err);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
