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

// In-memory trial tracking (backed by IP — resets on deploy but that's acceptable)
if (!global._serverTrialTracking) global._serverTrialTracking = new Map();

// Verify subscription session cookie (HMAC-signed, httpOnly)
function verifySubscriptionCookie(request) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/mystation-sub=([^;]+)/);
  if (!match) return false;
  try {
    const [timestamp, sig] = match[1].split('.');
    if (!timestamp || !sig) return false;
    const secret = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';
    const expected = createHmac('sha256', secret).update(`sub:${timestamp}`).digest('hex').slice(0, 32);
    // Timing-safe comparison
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return false;
    // Check expiry (30 days)
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
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

    // DJ mode bypasses trial/subscription — DJ Turntables is a free fan feature
    const isDJMode = request.headers.get('x-dj-mode') === '1';

    // SERVER-SIDE SUBSCRIPTION/TRIAL CHECK
    // 1. Check for valid subscription cookie
    const isSubscribed = verifySubscriptionCookie(request);

    // 2. Check for valid vault cookie (vault tracks bypass subscription)
    const isVaultTrack = track.isVault || track.album === 'grammy-nights';
    const cookieStr = request.headers.get('cookie') || '';
    const hasVaultAccess = cookieStr.includes('mystation_vault=');

    // 3. Check friend/access code cookie
    const hasFriendAccess = cookieStr.includes('mystation-friend=');

    // 4. If not subscribed, check 24-hour trial (DJ mode skips this)
    if (!isSubscribed && !hasFriendAccess && !isDJMode) {
      // Vault tracks need vault access, not subscription
      if (isVaultTrack && !hasVaultAccess) {
        return NextResponse.json({ error: 'Vault access required' }, { status: 403 });
      }

      // Non-vault: check trial
      if (!isVaultTrack) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const tracking = global._serverTrialTracking;
        let session = tracking.get(ip);
        const now = Date.now();

        if (!session) {
          session = { firstPlay: now, playCount: 0 };
          tracking.set(ip, session);
        }

        // Clean old entries (>48h)
        for (const [k, v] of tracking) {
          if (now - v.firstPlay > 48 * 60 * 60 * 1000) tracking.delete(k);
        }

        const elapsed = now - session.firstPlay;
        const trialMs = 24 * 60 * 60 * 1000;

        // Trial expired AND beyond free play limit
        if (elapsed >= trialMs) {
          return NextResponse.json({
            error: 'Trial expired — subscribe to continue',
            trialExpired: true,
          }, { status: 403 });
        }

        session.playCount++;
      }
    }

    const expires = Date.now() + 30 * 60 * 1000; // 30 min
    const payload = `${track.audioFile}:${expires}`;
    const signature = await signToken(payload);
    // base64url encode: audioPath:expires:signature
    const token = btoa(`${payload}:${signature}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return NextResponse.json({ token, expires });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
