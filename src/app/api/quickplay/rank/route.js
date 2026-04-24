/**
 * /api/quickplay/rank
 *
 * GET ?ids=500,501,...          → returns { rankings: { trackId: {avg, count} } }
 * POST { trackId, stars, volume? } → records vote, returns { avg, count }
 *
 * Storage: Supabase quickplay_rankings table.
 * Anti-spam: simple IP+UA fingerprint hash, one vote per fingerprint per track
 * (UPSERT updates existing vote so users can change their rating).
 *
 * Allowlist is sourced from QUICKPLAY_VOLUMES so new volumes automatically
 * accept votes without touching this file.
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { QUICKPLAY_VOLUMES, getVolume } from '@/data/quickplayVolumes';

export const dynamic = 'force-dynamic';

function buildAllowedTrackIds() {
  const ids = new Set();
  for (const slug of Object.keys(QUICKPLAY_VOLUMES)) {
    const vol = getVolume(slug);
    if (!vol) continue;
    for (const t of vol.tracks) {
      if (typeof t?.id === 'number') ids.add(t.id);
    }
  }
  return ids;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function getFingerprint(req) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  return crypto.createHash('sha256').update(`${ip}::${ua}`).digest('hex').slice(0, 32);
}

export async function GET(req) {
  const allowed = buildAllowedTrackIds();
  const url = new URL(req.url);
  const idsParam = url.searchParams.get('ids') || '';
  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => allowed.has(n));

  if (ids.length === 0) return Response.json({ rankings: {} });

  const supabase = getSupabase();
  if (!supabase) return Response.json({ rankings: {} });

  const { data, error } = await supabase
    .from('quickplay_rankings')
    .select('track_id, stars')
    .in('track_id', ids);

  if (error) {
    return Response.json({ rankings: {}, error: error.message }, { status: 500 });
  }

  const grouped = {};
  for (const row of data || []) {
    if (!grouped[row.track_id]) grouped[row.track_id] = { sum: 0, count: 0 };
    grouped[row.track_id].sum += row.stars;
    grouped[row.track_id].count += 1;
  }
  const rankings = {};
  for (const [tid, g] of Object.entries(grouped)) {
    rankings[tid] = { avg: g.sum / g.count, count: g.count };
  }
  return Response.json({ rankings });
}

export async function POST(req) {
  const allowed = buildAllowedTrackIds();
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  const trackId = parseInt(body.trackId, 10);
  const stars = parseInt(body.stars, 10);
  const volume = typeof body.volume === 'string' && body.volume.length <= 32
    ? body.volume
    : null;

  if (!allowed.has(trackId)) {
    return Response.json({ error: 'invalid trackId' }, { status: 400 });
  }
  if (!(stars >= 1 && stars <= 5)) {
    return Response.json({ error: 'stars must be 1-5' }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ error: 'storage unavailable' }, { status: 500 });
  }

  const fingerprint = getFingerprint(req);

  const row = {
    track_id: trackId,
    stars,
    fingerprint,
    user_agent: req.headers.get('user-agent') || null,
  };
  if (volume) row.volume = volume;

  const { error: upsertErr } = await supabase
    .from('quickplay_rankings')
    .upsert(row, { onConflict: 'track_id,fingerprint' });

  if (upsertErr) {
    return Response.json({ error: upsertErr.message }, { status: 500 });
  }

  const { data: rows } = await supabase
    .from('quickplay_rankings')
    .select('stars')
    .eq('track_id', trackId);

  const count = rows?.length || 0;
  const avg = count > 0 ? rows.reduce((s, r) => s + r.stars, 0) / count : stars;

  return Response.json({ avg, count, mine: stars });
}
