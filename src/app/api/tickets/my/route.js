/**
 * MYTICKETSLIVE - My Tickets API
 * GET: Get tickets for a user by email (from mystation-auth cookie or ?email= param)
 * Returns tickets joined with events and ticket_types, includes QR code URLs
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;

function parseCookie(cookieStr, name) {
  const match = cookieStr.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function hmacSign(prefix, payload) {
  return createHmac('sha256', AUDIO_SECRET).update(`${prefix}:${payload}`).digest('hex').slice(0, 32);
}

function timingSafeCompare(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function getEmailFromAuth(cookieStr) {
  const val = parseCookie(cookieStr, 'mystation-auth');
  if (!val) return null;
  const parts = val.split(':');
  if (parts.length < 3) return null;
  const sig = parts[parts.length - 1];
  const timestamp = parts[parts.length - 2];
  const email = parts.slice(0, parts.length - 2).join(':');
  const expected = hmacSign('auth', `${email}:${timestamp}`);
  if (!timingSafeCompare(expected, sig)) return null;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
  return email;
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const cookieStr = request.headers.get('cookie') || '';

    // Get email from auth cookie or query param
    let email = getEmailFromAuth(cookieStr);
    if (!email) {
      email = searchParams.get('email');
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Authentication required. Log in or provide ?email= parameter.' },
        { status: 401 }
      );
    }

    const emailNorm = email.toLowerCase().trim();

    // Fetch tickets for this email with event and ticket type details
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*, events(*), ticket_types(*)')
      .eq('holder_email', emailNorm)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[My Tickets] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    // Add QR code URLs
    const ticketsWithQR = (tickets || []).map(t => ({
      id: t.id,
      status: t.status,
      holder_name: t.holder_name,
      holder_email: t.holder_email,
      qr_code: t.qr_code,
      qr_url: t.qr_code
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(t.qr_code)}&bgcolor=0a0f1e&color=ffffff`
        : null,
      checked_in_at: t.checked_in_at,
      event: t.events ? {
        id: t.events.id,
        name: t.events.name,
        slug: t.events.slug,
        date: t.events.date,
        venue: t.events.venue,
        city: t.events.city,
        state: t.events.state,
        cover_image_url: t.events.cover_image_url,
      } : null,
      ticket_type: t.ticket_types ? {
        id: t.ticket_types.id,
        name: t.ticket_types.name,
        price: t.ticket_types.price,
      } : null,
      created_at: t.created_at,
    }));

    return NextResponse.json({
      success: true,
      email: emailNorm,
      count: ticketsWithQR.length,
      tickets: ticketsWithQR,
    });
  } catch (err) {
    console.error('[My Tickets] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
