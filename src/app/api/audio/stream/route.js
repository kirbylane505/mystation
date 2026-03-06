/**
 * MYSTATION - Audio Stream from Cloudflare R2
 * Verifies HMAC token, fetches from R2 public URL, streams back.
 * Supports Range requests for seeking.
 * LOGS EVERY STREAM to Supabase — subscriber or not.
 */

import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

async function verifyToken(token, audioPath) {
  if (!AUDIO_SECRET) return false;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const decoded = atob(base64 + pad);

    const lastColon = decoded.lastIndexOf(':');
    const sig = decoded.slice(lastColon + 1);
    const rest = decoded.slice(0, lastColon);
    const secondLastColon = rest.lastIndexOf(':');
    const expires = rest.slice(secondLastColon + 1);
    const tokenPath = rest.slice(0, secondLastColon);

    if (tokenPath !== audioPath) return false;
    if (Date.now() > parseInt(expires)) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(AUDIO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${tokenPath}:${expires}`));
    const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const expected = hex.slice(0, 32);
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Fire-and-forget: Log stream event to Supabase
 * Never blocks the audio stream — errors are silently caught.
 */
async function logStream(request, audioPath) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const headersList = await headers();

    // Geo from Vercel edge headers
    const city = headersList.get('x-vercel-ip-city') || null;
    const region = headersList.get('x-vercel-ip-country-region') || null;
    const country = headersList.get('x-vercel-ip-country') || null;

    // Hash IP for privacy
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const hashSalt = process.env.IP_HASH_SALT || 'ms-ip-salt-2026';
    const ip_hash = createHash('sha256').update(ip + hashSalt).digest('hex').slice(0, 16);

    // Device type
    const ua = headersList.get('user-agent') || '';
    const device_type = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile'
      : /Tablet/i.test(ua) ? 'tablet' : 'desktop';

    const referrer = headersList.get('referer') || null;

    // Extract track filename for identification
    const filename = audioPath.split('/').pop();

    await supabase.from('analytics_events').insert({
      event_type: 'stream',
      track_id: null,
      track_title: filename,
      page_path: `/api/audio/stream?path=${encodeURIComponent(audioPath)}`,
      session_id: ip_hash,
      ip_hash,
      city: city ? decodeURIComponent(city) : null,
      region,
      country,
      device_type,
      user_agent: ua.slice(0, 500),
      referrer: referrer?.slice(0, 500) || null,
      amount_cents: null,
    });
  } catch {
    // Silent — never break audio for analytics
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const audioPath = searchParams.get('path');
  const token = searchParams.get('_t');

  if (!audioPath || !token) {
    return new Response('Missing parameters', { status: 400 });
  }

  if (!R2_PUBLIC_URL) {
    return new Response('R2 not configured', { status: 500 });
  }

  const valid = await verifyToken(token, audioPath);
  if (!valid) {
    return new Response('Access Denied', { status: 403 });
  }

  // Block isComingSoon tracks at stream level (belt-and-suspenders with client filter)
  try {
    const { tracks } = await import('@/data/tracks');
    const blocked = tracks.find(t => t.audioFile === audioPath && t.isComingSoon);
    if (blocked) {
      return new Response('Track not yet available', { status: 403 });
    }
  } catch { /* don't block stream on import failure */ }

  // Log this stream — fire and forget, don't await
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) {
    // Only log on initial request, not range/seek requests
    logStream(request, audioPath);
  }

  // Extract filename from path (e.g., /audio/singles/song.mp3 → song.mp3)
  const filename = audioPath.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const contentType = ext === 'wav' ? 'audio/wav' : ext === 'm4a' || ext === 'mp4' || ext === 'aac' ? 'audio/mp4' : 'audio/mpeg';

  try {
    const r2Url = `${R2_PUBLIC_URL}/${encodeURIComponent(decodeURIComponent(filename))}`;

    const fetchHeaders = {};
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const r2Response = await fetch(r2Url, { headers: fetchHeaders });

    if (!r2Response.ok && r2Response.status !== 206) {
      if (r2Response.status === 404) {
        return new Response('Track not found', { status: 404 });
      }
      return new Response('Stream error', { status: 500 });
    }

    const responseHeaders = {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Accept-Ranges': 'bytes',
    };

    const cl = r2Response.headers.get('content-length');
    if (cl) responseHeaders['Content-Length'] = cl;

    const cr = r2Response.headers.get('content-range');
    if (cr) responseHeaders['Content-Range'] = cr;

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[R2 Stream Error]', err.message);
    return new Response('Stream error', { status: 500 });
  }
}
