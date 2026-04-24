/**
 * POST /api/quickplay/track
 * Body: { event_type, track_id?, stars? }
 * Logs visitor/playback events for /quickplay.
 *
 * Captures IP (prefix only for privacy), UA, device type,
 * referrer, and Vercel geo headers (country/region/city).
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = ['page_view', 'play_all', 'play_track', 'rank', 'share'];

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function sha(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 32);
}

function parseDevice(ua) {
  if (!ua) return 'unknown';
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return 'tablet';
  if (/iphone|android.*mobile|mobile/.test(u)) return 'mobile';
  return 'desktop';
}

function ipPrefix(ip) {
  if (!ip) return null;
  // IPv4: keep first 3 octets
  const v4 = ip.match(/^(\d+\.\d+\.\d+)\.\d+/);
  if (v4) return `${v4[1]}.x`;
  // IPv6: keep first 4 groups
  const v6 = ip.match(/^([\da-f]+:[\da-f]+:[\da-f]+:[\da-f]+)/i);
  if (v6) return `${v6[1]}::x`;
  return null;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  const event_type = body.event_type;
  if (!ALLOWED_EVENTS.includes(event_type)) {
    return Response.json({ error: 'invalid event_type' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '';
  const ua = req.headers.get('user-agent') || '';
  const referrer = req.headers.get('referer') || null;
  const country = req.headers.get('x-vercel-ip-country') || null;
  const region = req.headers.get('x-vercel-ip-country-region') || null;
  const city = req.headers.get('x-vercel-ip-city') ? decodeURIComponent(req.headers.get('x-vercel-ip-city')) : null;

  const fingerprint = sha(`${ip}::${ua}`);
  const ip_hash = sha(ip);

  const volume = typeof body.volume === 'string' && body.volume.length <= 32
    ? body.volume
    : null;

  const row = {
    event_type,
    track_id: body.track_id ? parseInt(body.track_id, 10) : null,
    stars: body.stars ? parseInt(body.stars, 10) : null,
    fingerprint,
    ip_hash,
    ip_prefix: ipPrefix(ip),
    user_agent: ua.slice(0, 400),
    device_type: parseDevice(ua),
    referrer: referrer ? referrer.slice(0, 500) : null,
    country,
    region,
    city,
  };
  if (volume) row.volume = volume;

  const s = supa();
  if (!s) {
    return Response.json({ ok: false, error: 'storage unavailable' }, { status: 500 });
  }
  const { error } = await s.from('quickplay_events').insert(row);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
