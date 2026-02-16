/**
 * MYSTATION - Comments API (Supabase-backed)
 * GET: Fetch comments for a track
 * POST: Add a comment + notify Mike via email
 *
 * Required Supabase table:
 * ---------------------------------------------------------
 * CREATE TABLE comments (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   track_id text NOT NULL,
 *   username text NOT NULL,
 *   content text NOT NULL,
 *   avatar text DEFAULT '',
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX idx_comments_track_id ON comments (track_id);
 * ---------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Rate limit: max 5 comments per IP per 10 minutes (in-memory, best-effort)
const rateLimits = new Map();
const RATE_LIMIT = 5;
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
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');

  if (!trackId) {
    return NextResponse.json({ comments: [] });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // Supabase not configured -- return empty gracefully
    return NextResponse.json({ comments: [] });
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('id, track_id, username, content, avatar, created_at')
      .eq('track_id', String(trackId))
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase comments fetch error:', error.message);
      return NextResponse.json({ comments: [] });
    }

    // Map DB columns to the shape the frontend expects
    const comments = (data || []).map(row => ({
      id: row.id,
      trackId: row.track_id,
      name: row.username,
      message: row.content,
      avatar: row.avatar || '',
      createdAt: row.created_at,
    }));

    return NextResponse.json({ comments });
  } catch (err) {
    console.error('Comments GET error:', err);
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many comments. Try again later.' }, { status: 429 });
    }

    const { trackId, trackTitle, name, message } = await request.json();

    if (!trackId || !name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name and message required' }, { status: 400 });
    }

    // Sanitize inputs
    const cleanName = name.trim().slice(0, 50);
    const cleanMessage = message.trim().slice(0, 500);

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Supabase not configured -- return a fake comment so the UI still works
      const fallback = {
        id: `local-${Date.now()}`,
        trackId: String(trackId),
        name: cleanName,
        message: cleanMessage,
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ comment: fallback, success: true });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        track_id: String(trackId),
        username: cleanName,
        content: cleanMessage,
      })
      .select('id, track_id, username, content, avatar, created_at')
      .single();

    if (error) {
      console.error('Supabase comments insert error:', error.message);
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    // Map DB row to frontend shape
    const comment = {
      id: data.id,
      trackId: data.track_id,
      name: data.username,
      message: data.content,
      avatar: data.avatar || '',
      createdAt: data.created_at,
    };

    // Send email notification to Mike (fire-and-forget)
    notifyAdmin(comment, trackTitle).catch(() => {});

    return NextResponse.json({ comment, success: true });
  } catch (err) {
    console.error('Comments POST error:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

async function notifyAdmin(comment, trackTitle) {
  // Use Resend if configured
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'MyStation <notifications@mystationlive.com>',
    to: 'mystationllc@gmail.com',
    subject: `New Comment on "${trackTitle || 'a track'}" \u2014 ${comment.name}`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;background:#0a0e1a;color:#fff;padding:24px;border-radius:16px;">
        <h2 style="color:#3b82f6;margin:0 0 8px;">New Comment</h2>
        <p style="color:#94a3b8;margin:0 0 16px;">on "${trackTitle || 'Unknown Track'}"</p>
        <div style="background:#1a1f36;padding:16px;border-radius:12px;margin-bottom:16px;">
          <p style="color:#e2e8f0;margin:0 0 4px;font-weight:700;">${comment.name}</p>
          <p style="color:#e2e8f0;margin:0;font-size:16px;">${comment.message}</p>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;">Reply at mystationlive.com</p>
      </div>
    `,
  });
}
