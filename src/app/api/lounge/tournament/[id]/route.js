/**
 * KICKBACK LOUNGE — Tournament Detail API
 * GET: Get tournament details + bracket + players
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const { data: players } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', id)
      .order('seed', { ascending: true });

    return NextResponse.json({
      tournament,
      players: players || [],
    });
  } catch (err) {
    console.error('Tournament detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
}
