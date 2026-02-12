/**
 * MYSTATION - Fan Wall API (Supabase-backed)
 * GET: Fetch all fan wall posts
 * POST: Add a new post
 * PATCH: Like a post
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Rate limit: max 10 posts per IP per 10 minutes
const rateLimits = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 10 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimits.get(ip);
  if (!record || now - record.firstAt > RATE_WINDOW) {
    rateLimits.set(ip, { count: 1, firstAt: now });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ posts: [], error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('fan_wall')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fan wall fetch error:', error);
      return NextResponse.json({ posts: [], error: error.message });
    }

    return NextResponse.json({ posts: data || [] });
  } catch (err) {
    return NextResponse.json({ posts: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many posts. Try again later.' }, { status: 429 });
    }

    const { username, content, avatar } = await request.json();

    if (!username?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Username and content required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const cleanUsername = username.trim().slice(0, 30);
    const cleanContent = content.trim().slice(0, 500);
    const cleanAvatar = (avatar || '🎤').slice(0, 4);

    const { data, error } = await supabase
      .from('fan_wall')
      .insert({
        username: cleanUsername,
        content: cleanContent,
        avatar: cleanAvatar,
        tier: 'fan',
        likes: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Fan wall insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data, success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Increment likes
    const { data: current } = await supabase
      .from('fan_wall')
      .select('likes')
      .eq('id', id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('fan_wall')
      .update({ likes: (current.likes || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data, success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
