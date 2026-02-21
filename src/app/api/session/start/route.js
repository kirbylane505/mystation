/**
 * MYSTATION - Session Start API
 * Creates 26-minute browse cookie for new visitors.
 * Returns timer status for authenticated/subscribed/friend users.
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const BROWSE_DURATION_MS = 26 * 60 * 1000; // 26 minutes

function hmacSign(prefix, payload) {
  return createHmac('sha256', AUDIO_SECRET).update(`${prefix}:${payload}`).digest('hex').slice(0, 32);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCookie(cookieStr, name) {
  const match = cookieStr.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function verifyAuthCookie(cookieStr) {
  const val = parseCookie(cookieStr, 'mystation-auth');
  if (!val) return null;
  const parts = val.split(':');
  if (parts.length < 3) return null;
  const sig = parts[parts.length - 1];
  const timestamp = parts[parts.length - 2];
  const email = parts.slice(0, parts.length - 2).join(':');
  const expected = hmacSign('auth', `${email}:${timestamp}`);
  if (!timingSafeEqual(expected, sig)) return null;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
  return { email, timestamp: ts };
}

function verifyBrowseCookie(cookieStr) {
  const val = parseCookie(cookieStr, 'mystation-browse');
  if (!val) return null;
  const parts = val.split(':');
  if (parts.length !== 2) return null;
  const [timestamp, sig] = parts;
  const expected = hmacSign('browse', timestamp);
  if (!timingSafeEqual(expected, sig)) return null;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return null;
  return { timestamp: ts };
}

async function getFreeSignupSlots() {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return 26;
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });
    return Math.max(0, 26 - (count || 0));
  } catch {
    return 26; // fail open
  }
}

export async function GET(request) {
  try {
    const cookieStr = request.headers.get('cookie') || '';

    // 1. Check authenticated user
    const auth = verifyAuthCookie(cookieStr);
    if (auth) {
      const slots = await getFreeSignupSlots();
      return NextResponse.json({
        status: 'authenticated',
        locked: false,
        timeRemaining: null,
        freeSignupSlots: slots,
      });
    }

    // 2. Check subscription cookie
    if (cookieStr.includes('mystation-sub=')) {
      return NextResponse.json({
        status: 'subscribed',
        locked: false,
        timeRemaining: null,
        freeSignupSlots: 0,
      });
    }

    // 3. Check friend cookie
    if (cookieStr.includes('mystation-friend=')) {
      return NextResponse.json({
        status: 'friend',
        locked: false,
        timeRemaining: null,
        freeSignupSlots: 0,
      });
    }

    // 4. Check browse cookie
    const browse = verifyBrowseCookie(cookieStr);
    if (browse) {
      const elapsed = Date.now() - browse.timestamp;
      const locked = elapsed >= BROWSE_DURATION_MS;
      const timeRemaining = Math.max(0, BROWSE_DURATION_MS - elapsed);
      const slots = await getFreeSignupSlots();
      return NextResponse.json({
        status: 'browsing',
        locked,
        timeRemaining,
        freeSignupSlots: slots,
      });
    }

    // 5. No cookies — create browse timer
    const now = Date.now();
    const sig = hmacSign('browse', String(now));
    const cookieValue = `${now}:${sig}`;
    const slots = await getFreeSignupSlots();

    const response = NextResponse.json({
      status: 'browsing',
      locked: false,
      timeRemaining: BROWSE_DURATION_MS,
      freeSignupSlots: slots,
    });

    response.cookies.set('mystation-browse', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24h cookie, but server checks 10min
    });

    return response;
  } catch (err) {
    console.error('Session start error:', err);
    return NextResponse.json({ status: 'error', locked: false, timeRemaining: BROWSE_DURATION_MS }, { status: 500 });
  }
}
