/**
 * MYSTATION - Daily Analytics Email Cron
 * Runs daily at 8AM UTC (3AM EST) via Vercel Cron
 * Queries last 24h of analytics_events, sends styled report to admin
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendDailyAnalyticsReport } from '@/lib/email';

export async function GET(request) {
  // Verify cron secret (Vercel auto-provides CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch all events from last 24h
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch analytics:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate data
    const plays = events.filter(e => e.event_type === 'play');
    const pageViews = events.filter(e => e.event_type === 'page_view');
    const purchases = events.filter(e => e.event_type === 'purchase');

    // Unique listeners (by ip_hash)
    const uniqueListeners = new Set(plays.map(e => e.ip_hash)).size;

    // Revenue
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

    // Top locations (state/city)
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
      const d = e.device_type || 'unknown';
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });

    // Peak hours (EST = UTC - 5)
    const hourCounts = {};
    events.forEach(e => {
      const hour = new Date(e.created_at).getUTCHours();
      const estHour = (hour - 5 + 24) % 24;
      const label = estHour === 0 ? '12 AM' : estHour < 12 ? `${estHour} AM` : estHour === 12 ? '12 PM' : `${estHour - 12} PM`;
      hourCounts[label] = (hourCounts[label] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour, count }));

    // Top pages
    const pageCounts = {};
    pageViews.forEach(e => {
      pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Send the report
    const report = {
      date: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' }),
      totalPlays: plays.length,
      uniqueListeners,
      totalPageViews: pageViews.length,
      totalPurchases: purchases.length,
      totalRevenue,
      topTracks,
      topLocations,
      deviceCounts,
      peakHours,
      topPages,
    };

    await sendDailyAnalyticsReport(report);

    return NextResponse.json({ success: true, summary: { plays: plays.length, views: pageViews.length, purchases: purchases.length } });
  } catch (err) {
    console.error('Daily analytics cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
