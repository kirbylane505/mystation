/**
 * KICKBACK LOUNGE — Tournament Join API
 * POST: Register for a tournament
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { playerId, displayName } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'registration') {
      return NextResponse.json({ error: 'Registration is closed' }, { status: 400 });
    }

    // Check player count
    const { count } = await supabase
      .from('tournament_players')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', id);

    if (count >= tournament.max_players) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 });
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', id)
      .eq('user_id', playerId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already registered' }, { status: 400 });
    }

    // Register
    const { error: insertErr } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: id,
        user_id: playerId,
        display_name: (displayName || 'Player').slice(0, 20),
        seed: (count || 0) + 1,
      });

    if (insertErr) throw insertErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Tournament join error:', err);
    return NextResponse.json({ error: 'Failed to join tournament' }, { status: 500 });
  }
}
