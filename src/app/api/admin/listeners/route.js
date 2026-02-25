/**
 * MYSTATION — Admin Listener Geo Data API
 * GET: Returns aggregated listener data by city/state
 * Admin-only (behind ADMIN_KEY)
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
  try {
    // Admin auth check (timing-safe)
    const { searchParams } = new URL(request.url);
    const key = request.headers.get('x-admin-key') || searchParams.get('key');

    if (!verifyAdminKey(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get play events with geo data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('city, region, country, created_at, track_title')
      .eq('event_type', 'play')
      .not('city', 'is', null)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('Listeners query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    // Aggregate by state
    const stateMap = {};
    const cityMap = {};
    let totalListeners = 0;

    for (const evt of (events || [])) {
      const state = evt.region || 'Unknown';
      const city = evt.city || 'Unknown';
      const cityKey = `${city}, ${state}`;

      // State aggregation
      if (!stateMap[state]) {
        stateMap[state] = { state, count: 0, cities: new Set(), topTracks: {} };
      }
      stateMap[state].count++;
      stateMap[state].cities.add(city);

      if (evt.track_title) {
        stateMap[state].topTracks[evt.track_title] = (stateMap[state].topTracks[evt.track_title] || 0) + 1;
      }

      // City aggregation
      if (!cityMap[cityKey]) {
        cityMap[cityKey] = { city, state, count: 0, lastActive: evt.created_at };
      }
      cityMap[cityKey].count++;

      totalListeners++;
    }

    // Format state data
    const states = Object.values(stateMap)
      .map(s => ({
        state: s.state,
        count: s.count,
        cityCount: s.cities.size,
        topTrack: Object.entries(s.topTracks).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      }))
      .sort((a, b) => b.count - a.count);

    // Format city data (top 50)
    const cities = Object.values(cityMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    // Hot areas (top 10 cities)
    const hotAreas = cities.slice(0, 10);

    return NextResponse.json({
      totalListeners,
      states,
      cities,
      hotAreas,
      period: '30 days',
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Listeners API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
