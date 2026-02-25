/**
 * MYSTATION — Admin Fan Command Center API
 * Aggregates top listeners by play count, cross-references subscribers
 * Protected by admin key
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { timingSafeEqual } from 'crypto';

function verifyAdminKey(key) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key) return false;
  try {
    return timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
  } catch { return false; }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  // Admin auth — header or query param (timing-safe)
  const key = request.headers.get('x-admin-key') || searchParams.get('key');
  if (!verifyAdminKey(key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get all play events (no time limit — lifetime stats)
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('ip_hash, track_title, track_id, created_at, visitor_id, email')
      .eq('event_type', 'play')
      .order('created_at', { ascending: false })
      .limit(50000);

    if (eventsError) {
      console.error('Fan query error:', eventsError);
      return NextResponse.json({ error: 'Analytics unavailable' }, { status: 500 });
    }

    // Get all subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('email, name, status, tier, created_at');

    if (subError) {
      console.error('Subscriber query error:', subError);
    }

    // Build subscriber lookup by email
    const subMap = {};
    (subscribers || []).forEach(s => {
      if (s.email) subMap[s.email.toLowerCase()] = s;
    });

    // Aggregate plays per visitor (use visitor_id > email > ip_hash as identifier)
    const fanMap = {};
    (events || []).forEach(e => {
      const id = e.visitor_id || e.email || e.ip_hash || 'unknown';
      if (!fanMap[id]) {
        fanMap[id] = {
          id,
          email: e.email || null,
          play_count: 0,
          tracks: {},
          first_seen: e.created_at,
          last_seen: e.created_at,
        };
      }
      const fan = fanMap[id];
      fan.play_count++;

      // Track email if we find one
      if (e.email && !fan.email) fan.email = e.email;

      // Track plays per track
      const trackName = e.track_title || e.track_id || 'Unknown';
      fan.tracks[trackName] = (fan.tracks[trackName] || 0) + 1;

      // Update first/last seen
      if (e.created_at < fan.first_seen) fan.first_seen = e.created_at;
      if (e.created_at > fan.last_seen) fan.last_seen = e.created_at;
    });

    // Convert to sorted array
    const fans = Object.values(fanMap)
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, limit)
      .map((fan, idx) => {
        // Get top 3 tracks
        const topTracks = Object.entries(fan.tracks)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([title, count]) => ({ title, count }));

        // Cross-reference subscriber status
        const sub = fan.email ? subMap[fan.email.toLowerCase()] : null;

        return {
          rank: idx + 1,
          id: fan.id,
          email: fan.email || fan.id,
          play_count: fan.play_count,
          top_tracks: topTracks,
          subscriber_status: sub?.status || 'free',
          tier: sub?.tier || 'listener',
          name: sub?.name || null,
          first_seen: fan.first_seen,
          last_seen: fan.last_seen,
        };
      });

    // Summary stats
    const totalFans = Object.keys(fanMap).length;
    const activeSubscribers = (subscribers || []).filter(s => s.status === 'active').length;
    const fiftyPlusClub = Object.values(fanMap).filter(f => f.play_count >= 50).length;
    const totalPlays = (events || []).length;

    return NextResponse.json({
      fans,
      stats: {
        totalFans,
        activeSubscribers,
        fiftyPlusClub,
        totalPlays,
      },
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Admin fans API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
