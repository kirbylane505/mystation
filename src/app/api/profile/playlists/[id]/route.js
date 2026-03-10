/**
 * MYSTATION — Single Playlist API
 * GET: Get playlist by ID
 * PUT: Update playlist (owner only)
 * DELETE: Delete playlist (owner only)
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

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const { data: playlist } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();

    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!playlist.is_public) {
      const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
      if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const userId = await hashEmail(email);
      if (userId !== playlist.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ playlist });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = await hashEmail(email);
    const { data: existing } = await supabase.from('playlists').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name.trim().slice(0, PROFILE_LIMITS.playlistNameMax);
    if (body.description !== undefined) updates.description = body.description.trim().slice(0, PROFILE_LIMITS.playlistDescMax);
    if (body.track_ids !== undefined) updates.track_ids = Array.isArray(body.track_ids) ? body.track_ids.slice(0, PROFILE_LIMITS.maxTracksPerPlaylist) : [];
    if (body.is_public !== undefined) updates.is_public = !!body.is_public;

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ playlist });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = await hashEmail(email);
    const { data: existing } = await supabase.from('playlists').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await supabase.from('playlists').delete().eq('id', id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
