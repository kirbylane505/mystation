/**
 * MYSTATION - Comments API
 * GET: Fetch comments for a track
 * POST: Add a comment + notify Mike via email
 */

import { NextResponse } from 'next/server';

// In-memory comment store (upgrades to Supabase later)
// Persists for the life of the serverless function
const commentsStore = new Map();

// Rate limit: max 5 comments per IP per 10 minutes
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

  const comments = commentsStore.get(trackId) || [];
  return NextResponse.json({ comments });
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

    const comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      trackId: String(trackId),
      name: cleanName,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    // Store comment
    const existing = commentsStore.get(String(trackId)) || [];
    existing.push(comment);
    commentsStore.set(String(trackId), existing);

    // Send email notification to Mike (fire-and-forget)
    notifyAdmin(comment, trackTitle).catch(() => {});

    return NextResponse.json({ comment, success: true });
  } catch {
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
    to: 'idmgatl@gmail.com',
    subject: `New Comment on "${trackTitle || 'a track'}" — ${comment.name}`,
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
