/**
 * MYSTATION — Profile API
 * GET: Get own profile (by email cookie/header)
 * PUT: Update own profile
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PROFILE_LIMITS, USERNAME_REGEX } from '@/lib/profiles/constants';

function getEmailFromRequest(request) {
  const emailCookie = request.cookies.get('mystation-email');
  if (emailCookie?.value) return emailCookie.value;
  const headerEmail = request.headers.get('x-user-email');
  if (headerEmail) return headerEmail;
  return null;
}

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function GET(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const userId = await hashEmail(email);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);

    return NextResponse.json({
      profile: { ...profile, followers: followers || 0, following: following || 0 },
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const userId = await hashEmail(email);
    const body = await request.json();

    const updates = {};

    if (body.username !== undefined) {
      const username = body.username.toLowerCase().trim();
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json({ error: 'Username must be 3-20 chars, lowercase alphanumeric + underscores' }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .neq('user_id', userId)
        .single();
      if (existing) {
        return NextResponse.json({ error: 'Username taken' }, { status: 409 });
      }
      updates.username = username;
    }

    if (body.display_name !== undefined) {
      updates.display_name = body.display_name.trim().slice(0, PROFILE_LIMITS.displayNameMax);
    }
    if (body.bio !== undefined) {
      updates.bio = body.bio.trim().slice(0, PROFILE_LIMITS.bioMax);
    }
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.avatar_style !== undefined) updates.avatar_style = body.avatar_style;
    if (body.banner_color !== undefined) updates.banner_color = body.banner_color;
    if (body.show_now_playing !== undefined) updates.show_now_playing = !!body.show_now_playing;
    if (body.featured_playlist_id !== undefined) updates.featured_playlist_id = body.featured_playlist_id;

    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email,
        ...updates,
        ...(body._isNew ? { username: updates.username || email.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20) } : {}),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
