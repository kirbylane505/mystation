import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Auto-end stale streams older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('streams')
      .update({ is_live: false, ended_at: new Date().toISOString() })
      .eq('is_live', true)
      .lt('started_at', twoHoursAgo);

    const { data: streams, error } = await supabaseAdmin
      .from('streams')
      .select('*')
      .eq('is_live', true)
      .order('viewer_count', { ascending: false });

    if (error) throw error;

    // Also fetch recent replays
    const { data: replays } = await supabaseAdmin
      .from('streams')
      .select('*')
      .eq('is_live', false)
      .not('replay_url', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(12);

    return NextResponse.json({ streams: streams || [], replays: replays || [] });
  } catch (err) {
    console.error('PodStation rooms error:', err);
    return NextResponse.json({ streams: [] });
  }
}
