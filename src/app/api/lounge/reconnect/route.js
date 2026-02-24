/**
 * KICKBACK LOUNGE — Reconnect API
 * POST: Reconnect a player to a room they were in (after page refresh/disconnect)
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

    // Check if player was in this room
    const { data: player } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', playerId)
      .single();

    if (!player) {
      return NextResponse.json({ error: 'Player not found in room' }, { status: 404 });
    }

    // Get room
    const { data: room } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room || room.status === 'finished') {
      return NextResponse.json({ error: 'Room no longer active' }, { status: 400 });
    }

    // Mark player as connected
    await supabase
      .from('game_players')
      .update({ connected: true })
      .eq('room_id', roomId)
      .eq('user_id', playerId);

    // Get all players
    const { data: players } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat', { ascending: true });

    // Broadcast reconnection
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'room:players',
      payload: { players },
    });

    return NextResponse.json({ room, players });
  } catch (err) {
    console.error('Reconnect error:', err);
    return NextResponse.json({ error: 'Failed to reconnect' }, { status: 500 });
  }
}
