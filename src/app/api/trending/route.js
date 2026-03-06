/**
 * MYSTATION - Trending Tracks
 * Returns top 10 most-played tracks in the last 7 days
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ tracks: [] });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analytics_events')
      .select('track_title')
      .eq('event_type', 'stream')
      .gte('created_at', sevenDaysAgo)
      .not('track_title', 'is', null);

    if (error || !data) {
      return Response.json({ tracks: [] });
    }

    // Count plays per track
    const counts = {};
    data.forEach(row => {
      const title = row.track_title;
      counts[title] = (counts[title] || 0) + 1;
    });

    // Sort by play count, take top 10
    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, plays]) => ({ title, plays }));

    return Response.json({ tracks: trending });
  } catch {
    return Response.json({ tracks: [] });
  }
}
