/**
 * KICKBACK LOUNGE — Tournament API
 * GET: List tournaments | POST: Create a new tournament
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { GAME_TYPES } from '@/lib/games/constants';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'registration';

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ tournaments: [] });
    }

    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('*, tournament_players(count)')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(20);

    const enriched = (tournaments || []).map(t => ({
      ...t,
      gameName: GAME_TYPES[t.game_type]?.name || t.game_type,
      gameIcon: GAME_TYPES[t.game_type]?.icon || '🏆',
      playerCount: t.tournament_players?.[0]?.count || 0,
    }));

    return NextResponse.json({ tournaments: enriched });
  } catch (err) {
    console.error('Tournament GET error:', err);
    return NextResponse.json({ tournaments: [] });
  }
}

export async function POST(request) {
  try {
    const { name, gameType, maxPlayers, createdBy, displayName } = await request.json();

    if (!name || !gameType || !createdBy) {
      return NextResponse.json({ error: 'name, gameType, createdBy required' }, { status: 400 });
    }

    if (!GAME_TYPES[gameType]) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Create tournament
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        name: name.slice(0, 50),
        game_type: gameType,
        max_players: maxPlayers || 8,
        created_by: createdBy,
        bracket: {},
      })
      .select()
      .single();

    if (tErr) throw tErr;

    // Auto-register creator
    await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournament.id,
        user_id: createdBy,
        display_name: (displayName || 'Player').slice(0, 20),
        seed: 1,
      });

    return NextResponse.json({ tournament });
  } catch (err) {
    console.error('Tournament POST error:', err);
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}
