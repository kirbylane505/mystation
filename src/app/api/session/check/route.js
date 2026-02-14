/**
 * MYSTATION - Session Check API (Read-Only)
 * Polled every 30s by TimerGuard to sync timer state.
 * Does NOT create new cookies.
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';
const BROWSE_DURATION_MS = 26 * 60 * 1000; // Must match session/start

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

export async function GET(request) {
  try {
    const cookieStr = request.headers.get('cookie') || '';

    // Check auth cookie
    const auth = verifyAuthCookie(cookieStr);
    if (auth) {
      return NextResponse.json({ status: 'authenticated', locked: false, timeRemaining: null });
    }

    // Check sub cookie
    if (cookieStr.includes('mystation-sub=')) {
      return NextResponse.json({ status: 'subscribed', locked: false, timeRemaining: null });
    }

    // Check friend cookie
    if (cookieStr.includes('mystation-friend=')) {
      return NextResponse.json({ status: 'friend', locked: false, timeRemaining: null });
    }

    // Check browse cookie
    const browse = verifyBrowseCookie(cookieStr);
    if (browse) {
      const elapsed = Date.now() - browse.timestamp;
      const locked = elapsed >= BROWSE_DURATION_MS;
      const timeRemaining = Math.max(0, BROWSE_DURATION_MS - elapsed);
      return NextResponse.json({ status: 'browsing', locked, timeRemaining });
    }

    // No browse cookie — locked (they haven't started a session)
    return NextResponse.json({ status: 'none', locked: true, timeRemaining: 0 });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ status: 'error', locked: false, timeRemaining: 0 }, { status: 500 });
  }
}
