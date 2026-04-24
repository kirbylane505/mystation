/**
 * Daily QuickPlay summary email.
 * Triggered by Vercel Cron at 8pm CT (02:00 UTC next day).
 * Sends recap of last 24 hours of /quickplay activity to admin.
 *
 * Summary includes:
 * - Total listens (play_all + play_track events)
 * - Unique visitors
 * - Top 5 cities/countries
 * - Plays by hour of day
 * - Plays per track
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = ['mystationlive@gmail.com'];
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MyStation <notifications@mystationlive.com>';

const QUICKPLAY_TRACKS = {
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
  // Verify cron authorization (Vercel sends x-vercel-cron header)
  // Also accept manual trigger with admin key
  const cronHeader = req.headers.get('x-vercel-cron') || req.headers.get('X-Vercel-Cron');
  const adminKey = req.headers.get('x-admin-key') || new URL(req.url).searchParams.get('key');
  if (!cronHeader && adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const s = supa();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  if (!s || !resend) {
    return Response.json({ error: 'missing config' }, { status: 500 });
  }

  // Pull last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: events, error } = await s
    .from('quickplay_events')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const evs = events || [];
  const pageViews = evs.filter((e) => e.event_type === 'page_view');
  const plays = evs.filter((e) => e.event_type === 'play_track' || e.event_type === 'play_all');
  const uniqueVisitors = new Set(pageViews.map((e) => e.ip_hash)).size;

  // Plays per track
  const playsByTrack = {};
  for (const id of Object.keys(QUICKPLAY_TRACKS)) playsByTrack[id] = 0;
  for (const e of evs) {
    if (e.event_type === 'play_track' && e.track_id) {
      playsByTrack[e.track_id] = (playsByTrack[e.track_id] || 0) + 1;
    }
  }
  const trackRows = Object.entries(QUICKPLAY_TRACKS)
    .map(([id, title]) => ({ id, title, plays: playsByTrack[id] || 0 }))
    .sort((a, b) => b.plays - a.plays);

  // Cities/countries
  const byLocation = {};
  for (const e of pageViews) {
    const key = e.city && e.country ? `${e.city}, ${e.country}` : e.country || 'Unknown';
    byLocation[key] = (byLocation[key] || 0) + 1;
  }
  const topLocations = Object.entries(byLocation)
    .map(([loc, count]) => ({ loc, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Hourly distribution (local CT — UTC-6 or UTC-5 depending on DST — use UTC for simplicity with label)
  const byHour = Array(24).fill(0);
  for (const e of evs) {
    if (e.event_type === 'play_track' || e.event_type === 'play_all') {
      const d = new Date(e.created_at);
      // Convert UTC to CT (UTC-5 or UTC-6). Use -5 (CDT) as approximation during festival season
      const hour = (d.getUTCHours() - 5 + 24) % 24;
      byHour[hour]++;
    }
  }
  const maxHourVal = Math.max(...byHour, 1);

  // Build HTML email
  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 28px;">
    <div style="color: #FFD700; font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px;">
      QUICKPLAY DAILY
    </div>
    <h1 style="color: #fff; font-size: 28px; font-weight: 900; margin: 0 0 4px 0;">
      Mike Page · 5 Track Sampler
    </h1>
    <div style="color: rgba(255,255,255,0.5); font-size: 14px;">
      Last 24 hours · ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'medium', timeStyle: 'short' })} CT
    </div>
  </div>

  <!-- Big numbers -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02)); border: 1px solid rgba(255,215,0,0.2); border-radius: 16px; padding: 20px; text-align: center;">
      <div style="color: rgba(255,215,0,0.7); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Listens</div>
      <div style="color: #FFD700; font-size: 42px; font-weight: 900; line-height: 1;">${plays.length}</div>
    </div>
    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.02)); border: 1px solid rgba(255,215,0,0.2); border-radius: 16px; padding: 20px; text-align: center;">
      <div style="color: rgba(255,215,0,0.7); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">People</div>
      <div style="color: #FFD700; font-size: 42px; font-weight: 900; line-height: 1;">${uniqueVisitors}</div>
    </div>
  </div>

  <!-- Tracks -->
  <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; margin-bottom: 18px;">
    <div style="color: #FFD700; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Plays Per Track</div>
    ${trackRows
      .map(
        (t, i) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: ${i < trackRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'};">
      <div>
        <div style="color: #fff; font-weight: 700; font-size: 15px;">${t.title}</div>
        <div style="color: rgba(255,255,255,0.3); font-size: 11px;">Track ${t.id}</div>
      </div>
      <div style="color: #FFD700; font-weight: 900; font-size: 20px;">${t.plays}</div>
    </div>`
      )
      .join('')}
  </div>

  <!-- Locations -->
  <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; margin-bottom: 18px;">
    <div style="color: #FFD700; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Where They Opened It</div>
    ${
      topLocations.length === 0
        ? '<div style="color: rgba(255,255,255,0.3); font-size: 13px;">No location data yet</div>'
        : topLocations
            .map(
              (l) => `
    <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
      <span style="color: #fff;">${l.loc}</span>
      <span style="color: #FFD700; font-weight: 700;">${l.count}</span>
    </div>`
            )
            .join('')
    }
  </div>

  <!-- Hour of day histogram -->
  <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; margin-bottom: 18px;">
    <div style="color: #FFD700; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;">Listens by Hour (CT)</div>
    ${byHour
      .map((v, h) => {
        const w = Math.round((v / maxHourVal) * 100);
        const label = `${h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : h - 12 + 'p'}`;
        return `<div style="display: flex; align-items: center; gap: 8px; padding: 2px 0; font-size: 11px;">
      <span style="color: rgba(255,255,255,0.4); width: 32px; font-family: monospace;">${label}</span>
      <div style="flex: 1; background: rgba(255,255,255,0.05); height: 14px; border-radius: 3px; overflow: hidden;">
        <div style="width: ${w}%; height: 100%; background: linear-gradient(90deg, #FFD700, #FFA500);"></div>
      </div>
      <span style="color: ${v > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)'}; width: 24px; text-align: right; font-weight: 700;">${v}</span>
    </div>`;
      })
      .join('')}
  </div>

  <div style="text-align: center; margin-top: 24px;">
    <a href="https://mystationlive.com/admin/quickplay" style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 999px;">
      VIEW FULL DASHBOARD →
    </a>
  </div>

  <div style="text-align: center; color: rgba(255,255,255,0.3); font-size: 11px; margin-top: 20px;">
    mystationlive.com/quickplay · MyStation Empire
  </div>
</div>`;

  try {
    const { error: sendErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `QuickPlay Daily: ${plays.length} listens · ${uniqueVisitors} people`,
      html,
    });
    if (sendErr) {
      return Response.json({ error: sendErr.message }, { status: 500 });
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    stats: {
      plays: plays.length,
      uniqueVisitors,
      pageViews: pageViews.length,
      locations: topLocations.length,
    },
  });
}
