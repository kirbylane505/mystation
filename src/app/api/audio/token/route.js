/**
 * MYSTATION - Audio Token API
 * Access hierarchy: sub > friend > vault > specific free tracks (500, 501) > blocked
 * Only "I Want This One" & "R.U.N or R U Out" are free. Everything else = subscribe.
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
if (!AUDIO_SECRET) {
  console.error('FATAL: AUDIO_SECRET env var is not set');
}

// Use Web Crypto API (same as middleware) for HMAC signing — ensures token compatibility
async function signToken(payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(AUDIO_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 32);
}

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

// Specific free tracks — ONLY these 2 songs play for non-subscribers
// "I Want This One" (500) & "R.U.N or R U Out" (501) — everything else = subscribe
const FREE_TRACK_IDS = [500, 501];

// Verify subscription cookie (HMAC-signed, 365-day expiry — subscribers remembered FOREVER)
function verifySubscriptionCookie(cookieStr) {
  const val = parseCookie(cookieStr, 'mystation-sub');
  if (!val) return false;
  const [timestamp, sig] = val.split('.');
  if (!timestamp || !sig) return false;
  const expected = hmacSign('sub', timestamp);
  if (!timingSafeEqual(expected, sig)) return false;
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > 365 * 24 * 60 * 60 * 1000) return false;
  return true;
}

export async function POST(request) {
  try {
    const { trackId } = await request.json();
    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
    }

    // Look up track to get audio file path
    const { tracks } = await import('@/data/tracks');
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.audioFile) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const cookieStr = request.headers.get('cookie') || '';

    // --- ACCESS HIERARCHY ---

    // 1. Subscription cookie → full access
    if (verifySubscriptionCookie(cookieStr)) {
      return grantToken(track);
    }

    // 2. Friend cookie → full access
    if (cookieStr.includes('mystation-friend=')) {
      return grantToken(track);
    }

    // 3. Vault tracks need vault access
    const isVaultTrack = track.isVault || track.album === 'grammy-nights';
    if (isVaultTrack) {
      const hasVaultAccess = cookieStr.includes('mystation_vault=');
      if (!hasVaultAccess) {
        return NextResponse.json({ error: 'Vault access required' }, { status: 403 });
      }
      return grantToken(track);
    }

    // 4. Specific free tracks — "I Want This One" & "R.U.N or R U Out" always free
    if (FREE_TRACK_IDS.includes(track.id)) {
      return grantToken(track);
    }

    // 5. Everything else = subscribe required
    return NextResponse.json(
      { error: 'free_limit', message: 'Subscribe to unlock 100+ songs from IDMG' },
      { status: 403 }
    );
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function grantToken(track) {
  // External URLs (R2 CDN) — return directly (gate already passed above)
  if (track.audioFile.startsWith('http')) {
    return NextResponse.json({ audioUrl: track.audioFile });
  }
  // Local files — sign a token
  const expires = Date.now() + 30 * 60 * 1000; // 30 min
  const payload = `${track.audioFile}:${expires}`;
  const signature = await signToken(payload);
  const token = btoa(`${payload}:${signature}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return NextResponse.json({ token, expires });
}

// GET handler — returns free track IDs (no cookies needed)
export async function GET() {
  return NextResponse.json({ freeTrackIds: FREE_TRACK_IDS });
}
