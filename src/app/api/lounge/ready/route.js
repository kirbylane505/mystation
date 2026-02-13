/**
 * KICKBACK LOUNGE — Ready Toggle API
 * POST: Toggle player ready status
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { roomId, playerId } = await request.json();

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'roomId and playerId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get current ready status
    const { data: player } = await supabase
      .from('game_players')
      .select('ready')
      .eq('room_id', roomId)
      .eq('user_id', playerId)
      .single();

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Toggle
    await supabase
      .from('game_players')
      .update({ ready: !player.ready })
      .eq('room_id', roomId)
      .eq('user_id', playerId);

    // Get all players
    const { data: players } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat', { ascending: true });

    // Broadcast
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'room:ready',
      payload: { players },
    });

    return NextResponse.json({ ok: true, players });
  } catch (err) {
    console.error('Ready error:', err);
    return NextResponse.json({ error: 'Failed to toggle ready' }, { status: 500 });
  }
}
