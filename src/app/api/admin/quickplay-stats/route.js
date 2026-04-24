/**
 * GET /api/admin/quickplay-stats
 * Admin-only. Returns stats for the QuickPlay page:
 * - Total views, unique visitors, top countries, top devices
 * - Play counts per track
 * - Recent visitor list (last 100)
 * - Rating averages per track
 */
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const QUICKPLAY_TRACK_IDS = [500, 501, 509, 508, 503];
const TRACK_TITLES = {
  500: 'I Want This One',
  501: 'R.U.N or R U Out',
  509: "Heaven's Gate",
  508: 'F.I.L.A.',
  503: 'Be Alright',
};

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req) {
  const url = new URL(req.url);
  const key = req.headers.get('x-admin-key') || url.searchParams.get('key');
  if (key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const s = supa();
  if (!s) return Response.json({ error: 'storage unavailable' }, { status: 500 });

  // All events
  const { data: events, error } = await s
    .from('quickplay_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const evs = events || [];

  // Stats
  const pageViews = evs.filter((e) => e.event_type === 'page_view').length;
  const uniqueVisitors = new Set(evs.filter((e) => e.event_type === 'page_view').map((e) => e.ip_hash)).size;
  const playAlls = evs.filter((e) => e.event_type === 'play_all').length;
  const totalPlays = evs.filter((e) => e.event_type === 'play_track' || e.event_type === 'play_all').length;

  // Plays per track
  const playsByTrack = {};
  for (const id of QUICKPLAY_TRACK_IDS) playsByTrack[id] = 0;
  for (const e of evs) {
    if (e.event_type === 'play_track' && e.track_id) {
      playsByTrack[e.track_id] = (playsByTrack[e.track_id] || 0) + 1;
    }
  }

  // Ratings per track
  const ratingsRes = await s
    .from('quickplay_rankings')
    .select('track_id, stars');
  const ratings = ratingsRes.data || [];
  const ratingByTrack = {};
  for (const id of QUICKPLAY_TRACK_IDS) ratingByTrack[id] = { avg: 0, count: 0 };
  const grouped = {};
  for (const r of ratings) {
    if (!grouped[r.track_id]) grouped[r.track_id] = { sum: 0, count: 0 };
    grouped[r.track_id].sum += r.stars;
    grouped[r.track_id].count += 1;
  }
  for (const [tid, g] of Object.entries(grouped)) {
    ratingByTrack[tid] = { avg: +(g.sum / g.count).toFixed(2), count: g.count };
  }

  // Top countries
  const byCountry = {};
  for (const e of evs) {
    if (e.event_type === 'page_view' && e.country) {
      byCountry[e.country] = (byCountry[e.country] || 0) + 1;
    }
  }
  const topCountries = Object.entries(byCountry)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top devices
  const byDevice = {};
  for (const e of evs) {
    if (e.event_type === 'page_view') {
      const d = e.device_type || 'unknown';
      byDevice[d] = (byDevice[d] || 0) + 1;
    }
  }

  // Top referrers
  const byReferrer = {};
  for (const e of evs) {
    if (e.event_type === 'page_view' && e.referrer) {
      try {
        const host = new URL(e.referrer).hostname;
        byReferrer[host] = (byReferrer[host] || 0) + 1;
      } catch {}
    }
  }
  const topReferrers = Object.entries(byReferrer)
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recent visitors (distinct fingerprints, last 100 page_views)
  const seen = new Set();
  const recent = [];
  for (const e of evs) {
    if (e.event_type !== 'page_view') continue;
    if (seen.has(e.fingerprint)) continue;
    seen.add(e.fingerprint);
    recent.push({
      created_at: e.created_at,
      device: e.device_type,
      country: e.country,
      region: e.region,
      city: e.city,
      ip_prefix: e.ip_prefix,
      user_agent: (e.user_agent || '').slice(0, 120),
      referrer: e.referrer,
    });
    if (recent.length >= 100) break;
  }

  return Response.json({
    summary: {
      pageViews,
      uniqueVisitors,
      playAlls,
      totalPlays,
    },
    playsByTrack: QUICKPLAY_TRACK_IDS.map((id) => ({
      id,
      title: TRACK_TITLES[id],
      plays: playsByTrack[id] || 0,
      rating: ratingByTrack[id] || { avg: 0, count: 0 },
    })),
    topCountries,
    byDevice,
    topReferrers,
    recent,
  });
}
