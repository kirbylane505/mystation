/**
 * MYSTATION - Fan Wall API (Supabase-backed)
 * GET: Fetch posts + replies grouped together
 * POST: Add a post OR reply (include parentId for reply)
 * PATCH: Like a post OR react to a post (include reaction emoji)
 *
 * Convention: replies stored as fan_wall rows with tier='reply:PARENT_ID'
 * Owner reactions stored with tier='react:EMOJI:POST_ID'
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const OWNER_SECRET = process.env.FAN_WALL_OWNER_SECRET;
if (!OWNER_SECRET) {
  console.error('WARNING: FAN_WALL_OWNER_SECRET env var is not set');
}

// Rate limit
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

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ posts: [], error: 'Database not configured' });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    let query = supabase
      .from('fan_wall')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (channel) {
      query = query.or(`channel.eq.${channel},tier.like.reply:%,tier.like.react:%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ posts: [], error: error.message });
    }

    const allRows = data || [];

    // Separate posts, replies, and reactions
    const posts = [];
    const repliesMap = {};
    const reactionsMap = {};

    for (const row of allRows) {
      if (row.tier?.startsWith('reply:')) {
        const parentId = row.tier.replace('reply:', '');
        if (!repliesMap[parentId]) repliesMap[parentId] = [];
        repliesMap[parentId].push(row);
      } else if (row.tier?.startsWith('react:')) {
        const parts = row.tier.split(':');
        const emoji = parts[1];
        const postId = parts[2];
        if (!reactionsMap[postId]) reactionsMap[postId] = [];
        reactionsMap[postId].push({ emoji, by: row.username, id: row.id });
      } else {
        posts.push(row);
      }
    }

    // Attach replies and reactions to their parent posts
    const enrichedPosts = posts.map(post => ({
      ...post,
      replies: (repliesMap[post.id] || []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
      reactions: reactionsMap[post.id] || [],
    }));

    return NextResponse.json({ posts: enrichedPosts });
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

    const body = await request.json();
    const { username, content, avatar, parentId, ownerSecret, verifyOwner, channel, post_type, media_url, poll_options } = body;

    // Owner verification endpoint — just checks if the secret is valid
    if (verifyOwner) {
      const isValid = OWNER_SECRET && ownerSecret && ownerSecret.length === OWNER_SECRET.length &&
        crypto.timingSafeEqual(Buffer.from(ownerSecret), Buffer.from(OWNER_SECRET));
      return NextResponse.json({ isOwner: !!isValid });
    }

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

    // Determine tier
    let tier = 'fan';
    if (parentId) {
      tier = `reply:${parentId}`;
    }
    // Owner gets special tier
    if (OWNER_SECRET && ownerSecret && ownerSecret.length === OWNER_SECRET.length &&
        crypto.timingSafeEqual(Buffer.from(ownerSecret), Buffer.from(OWNER_SECRET))) {
      tier = parentId ? `reply:${parentId}` : 'vip';
    }

    // Subscriber gate for community channels (not legacy fan wall)
    const cookies = request.headers.get('cookie') || '';
    const isSubscriber = cookies.includes('mystation-sub=true');
    const isAdmin = OWNER_SECRET && ownerSecret && ownerSecret.length === OWNER_SECRET.length &&
      crypto.timingSafeEqual(Buffer.from(ownerSecret), Buffer.from(OWNER_SECRET));

    if (!isAdmin && !isSubscriber && channel && channel !== 'general' && !parentId) {
      return NextResponse.json({ error: 'Subscribe to post in the community' }, { status: 403 });
    }

    if (channel === 'announcements' && !isAdmin) {
      return NextResponse.json({ error: 'Only Mike can post announcements' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('fan_wall')
      .insert({
        username: cleanUsername,
        content: cleanContent,
        avatar: cleanAvatar,
        tier,
        likes: 0,
        channel: channel || 'general',
        post_type: post_type || 'text',
        media_url: media_url || null,
        poll_options: poll_options || null,
      })
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

export async function PATCH(request) {
  try {
    const { id, reaction, ownerSecret } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Owner reaction (emoji on a post)
    if (reaction && OWNER_SECRET && ownerSecret &&
        ownerSecret.length === OWNER_SECRET.length &&
        crypto.timingSafeEqual(Buffer.from(ownerSecret), Buffer.from(OWNER_SECRET))) {
      const { data, error } = await supabase
        .from('fan_wall')
        .insert({
          username: 'Mike Page',
          content: reaction,
          avatar: '👑',
          tier: `react:${reaction}:${id}`,
          likes: 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reaction: data, success: true });
    }

    // Regular like
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
