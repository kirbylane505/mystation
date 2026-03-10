/**
 * MYSTATION — Follow API
 * POST: Toggle follow/unfollow a user
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

const followLimits = new Map();
const MAX_FOLLOWS_PER_HOUR = 50;

export async function POST(request) {
  try {
    const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }

    const followerId = await hashEmail(email);

    if (followerId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const now = Date.now();
    const record = followLimits.get(followerId);
    if (record && now - record.firstAt < 3600000 && record.count >= MAX_FOLLOWS_PER_HOUR) {
      return NextResponse.json({ error: 'Follow rate limit exceeded' }, { status: 429 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', targetUserId)
      .single();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
      return NextResponse.json({ following: false });
    } else {
      await supabase.from('follows').insert({ follower_id: followerId, following_id: targetUserId });
      if (!record || now - record.firstAt >= 3600000) {
        followLimits.set(followerId, { count: 1, firstAt: now });
      } else {
        record.count++;
      }
      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error('Follow error:', err);
    return NextResponse.json({ error: 'Failed to process follow' }, { status: 500 });
  }
}
