/**
 * MYSTATION - Comments API (Supabase-backed)
 * GET: Fetch comments for a track (with nested replies)
 * POST: Add a comment (subscriber-only) or owner reply
 * PATCH: Like/unlike/pin/unpin a comment
 * DELETE: Remove a comment (owner-only)
 *
 * Required Supabase table:
 * ---------------------------------------------------------
 * CREATE TABLE comments (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   track_id text NOT NULL,
 *   username text NOT NULL,
 *   content text NOT NULL,
 *   avatar text DEFAULT '',
 *   parent_id uuid REFERENCES comments(id) DEFAULT NULL,
 *   is_admin boolean DEFAULT false,
 *   role text DEFAULT 'fan',
 *   likes integer DEFAULT 0,
 *   is_pinned boolean DEFAULT false,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX idx_comments_track_id ON comments (track_id);
 * CREATE INDEX idx_comments_parent_id ON comments (parent_id);
 *
 * Migration (if table exists without likes/is_pinned):
 * ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
 * ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
 * ---------------------------------------------------------
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Owner emails — auto-detect Mike Page as creator
const OWNER_EMAILS = ['idmgatl@gmail.com', 'mystationlive@gmail.com', 'pagemusic505@gmail.com'];

function isOwnerEmail(email) {
  return email && OWNER_EMAILS.includes(email.toLowerCase().trim());
}

function getEmailFromRequest(request) {
  // Check mystation-email cookie
  const emailCookie = request.cookies.get('mystation-email');
  if (emailCookie?.value) return emailCookie.value;
  // Check x-user-email header (set by client)
  const headerEmail = request.headers.get('x-user-email');
  if (headerEmail) return headerEmail;
  return null;
}

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

function isValidAdminKey(key) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key || key.length !== adminKey.length) return false;
  try {
    return timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
  } catch {
    return false;
  }
}

function mapRow(row) {
  return {
    id: row.id,
    trackId: row.track_id,
    name: row.username,
    message: row.content,
    avatar: row.avatar || '',
    parentId: row.parent_id || null,
    isAdmin: row.is_admin || false,
    role: row.role || 'fan',
    likes: row.likes || 0,
    isPinned: row.is_pinned || false,
    createdAt: row.created_at,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('trackId');

  if (!trackId) {
    return NextResponse.json({ comments: [] });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ comments: [] });
  }

  try {
    let query = supabase
      .from('comments')
      .select('*')
      .eq('track_id', String(trackId));

    // Try ordering by is_pinned first; if column doesn't exist, fallback
    const { data, error } = await query
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase comments fetch error:', error.message);
      return NextResponse.json({ comments: [] });
    }

    const all = (data || []).map(mapRow);

    // Separate top-level comments and replies
    const topLevel = [];
    const repliesByParent = {};

    for (const c of all) {
      if (c.parentId) {
        if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
        repliesByParent[c.parentId].push(c);
      } else {
        topLevel.push(c);
      }
    }

    // Attach replies to their parent
    const comments = topLevel.map(c => ({
      ...c,
      replies: repliesByParent[c.id] || [],
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

    const { trackId, trackTitle, name, message, parentId, adminKey } = await request.json();

    // Owner detection: admin key OR owner email
    const email = getEmailFromRequest(request);
    const isAdmin = isValidAdminKey(adminKey) || isOwnerEmail(email);

    // Non-admin posts require subscriber cookie
    if (!isAdmin) {
      const subCookie = request.cookies.get('mystation-sub');
      if (!subCookie?.value) {
        return NextResponse.json({ error: 'Subscribe to comment' }, { status: 403 });
      }
    }

    if (!trackId || !message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Admin always posts as "Mike Page", fans use their name
    const cleanName = isAdmin ? 'Mike Page' : (name?.trim() || '').slice(0, 50);
    if (!isAdmin && !cleanName) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }
    const cleanMessage = escapeHtml(message.trim().slice(0, 500));

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      const fallback = {
        id: `local-${Date.now()}`,
        trackId: String(trackId),
        name: cleanName,
        message: cleanMessage,
        parentId: parentId || null,
        isAdmin,
        role: isAdmin ? 'admin' : 'fan',
        createdAt: new Date().toISOString(),
        replies: [],
      };
      return NextResponse.json({ comment: fallback, success: true });
    }

    const insertData = {
      track_id: String(trackId),
      username: cleanName,
      content: cleanMessage,
      is_admin: isAdmin,
      role: isAdmin ? 'admin' : 'fan',
    };
    if (parentId) insertData.parent_id = parentId;

    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase comments insert error:', error.message);
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    const comment = { ...mapRow(data), replies: [] };

    // Send email notification to Mike for fan comments (not admin's own replies)
    if (!isAdmin) {
      notifyAdmin(comment, trackTitle).catch(() => {});
    }

    return NextResponse.json({ comment, success: true });
  } catch (err) {
    console.error('Comments POST error:', err);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { commentId, action, adminKey } = body;

    if (!commentId || !['like', 'unlike', 'pin', 'unpin'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Pin/unpin = owner only
    if (action === 'pin' || action === 'unpin') {
      const email = getEmailFromRequest(request);
      if (!isOwnerEmail(email) && !isValidAdminKey(adminKey)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    if (action === 'like' || action === 'unlike') {
      // Read current likes, handle missing column gracefully
      const { data: current, error: readErr } = await supabase.from('comments').select('likes').eq('id', commentId).single();
      if (readErr && readErr.code === '42703') {
        // Column doesn't exist yet — client handles optimistically
        return NextResponse.json({ success: true, pending_migration: true });
      }
      const currentLikes = current?.likes || 0;
      const newLikes = action === 'like' ? currentLikes + 1 : Math.max(0, currentLikes - 1);
      await supabase.from('comments').update({ likes: newLikes }).eq('id', commentId);
    } else if (action === 'pin' || action === 'unpin') {
      const { error: pinErr } = await supabase.from('comments').update({ is_pinned: action === 'pin' }).eq('id', commentId);
      if (pinErr && pinErr.code === '42703') {
        return NextResponse.json({ success: true, pending_migration: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Comments PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { commentId, adminKey } = await request.json();

    // Owner can delete via admin key OR owner email
    const email = getEmailFromRequest(request);
    if (!isValidAdminKey(adminKey) && !isOwnerEmail(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true });
    }

    // Delete replies first (if deleting a parent), then the comment itself
    await supabase.from('comments').delete().eq('parent_id', commentId);
    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      console.error('Supabase comments delete error:', error.message);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Comments DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

async function notifyAdmin(comment, trackTitle) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const safeName = escapeHtml(comment.name);
  const safeMessage = escapeHtml(comment.message);
  const safeTitle = escapeHtml(trackTitle || 'Unknown Track');

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'MyStation <notifications@mystationlive.com>',
    to: 'mystationlive@gmail.com',
    subject: `New Comment on "${safeTitle}" \u2014 ${safeName}`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;background:#0a0e1a;color:#fff;padding:24px;border-radius:16px;">
        <h2 style="color:#3b82f6;margin:0 0 8px;">New Comment</h2>
        <p style="color:#94a3b8;margin:0 0 16px;">on "${safeTitle}"</p>
        <div style="background:#1a1f36;padding:16px;border-radius:12px;margin-bottom:16px;">
          <p style="color:#e2e8f0;margin:0 0 4px;font-weight:700;">${safeName}</p>
          <p style="color:#e2e8f0;margin:0;font-size:16px;">${safeMessage}</p>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;">Reply at mystationlive.com</p>
      </div>
    `,
  });
}
