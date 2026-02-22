/**
 * MYSTATION - Admin Analytics API
 * Returns aggregated analytics data for the dashboard
 * Protected by admin key
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '24h';

  // Admin check — header or query param
  const key = request.headers.get('x-admin-key') || searchParams.get('key');
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Calculate time range
    const now = new Date();
    const periodMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const since = new Date(now.getTime() - (periodMs[period] || periodMs['24h']));

    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) {
      return NextResponse.json({ error: 'Analytics unavailable' }, { status: 500 });
    }

    const plays = events.filter(e => e.event_type === 'play');
    const pageViews = events.filter(e => e.event_type === 'page_view');
    const purchases = events.filter(e => e.event_type === 'purchase');

    const uniqueListeners = new Set(plays.map(e => e.ip_hash)).size;
    const totalRevenue = purchases.reduce((sum, e) => sum + (e.amount_cents || 0), 0);

    // Top tracks
    const trackCounts = {};
    plays.forEach(e => {
      const key = e.track_title || e.track_id || 'Unknown';
      trackCounts[key] = (trackCounts[key] || 0) + 1;
    });
    const topTracks = Object.entries(trackCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, count]) => ({ title, count }));

    // Top locations
    const locationCounts = {};
    events.forEach(e => {
      if (e.city || e.region) {
        const loc = [e.city, e.region, e.country].filter(Boolean).join(', ');
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([location, count]) => ({ location, count }));

    // Device breakdown
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0, unknown: 0 };
    events.forEach(e => {
      deviceCounts[e.device_type || 'unknown'] = (deviceCounts[e.device_type || 'unknown'] || 0) + 1;
    });

    // Peak hours (EST)
    const hourCounts = {};
    events.forEach(e => {
      const hour = new Date(e.created_at).getUTCHours();
      const estHour = (hour - 5 + 24) % 24;
      const label = estHour === 0 ? '12 AM' : estHour < 12 ? `${estHour} AM` : estHour === 12 ? '12 PM' : `${estHour - 12} PM`;
      hourCounts[label] = (hourCounts[label] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hour, count]) => ({ hour, count }));

    return NextResponse.json({
      period,
      totalPlays: plays.length,
      uniqueListeners,
      totalPageViews: pageViews.length,
      totalPurchases: purchases.length,
      totalRevenue,
      topTracks,
      topLocations,
      deviceCounts,
      peakHours,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
