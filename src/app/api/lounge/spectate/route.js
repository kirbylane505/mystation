/**
 * KICKBACK LOUNGE — Spectate API
 * POST: Join a room as a spectator (watch-only, no seat)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { roomId, playerId, displayName } = await request.json();

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'roomId and playerId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get room
    const { data: room } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if already in room
    const { data: existing } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', playerId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already in room' }, { status: 400 });
    }

    const name = (displayName || 'Spectator').slice(0, 20);

    // Add as spectator (seat = -1 means spectator)
    await supabase
      .from('game_players')
      .insert({
        room_id: roomId,
        user_id: playerId,
        display_name: name,
        seat: -1,
        ready: true,
        role: 'spectator',
      });

    // Get all players
    const { data: players } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat', { ascending: true });

    // Get game state (broadcast view for spectators)
    let gameState = null;
    if (room.status === 'playing') {
      const { data: stateRow } = await supabase
        .from('game_state')
        .select('state')
        .eq('room_id', roomId)
        .single();
      gameState = stateRow?.state || null;
    }

    // Broadcast updated player list
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'room:players',
      payload: { players },
    });

    return NextResponse.json({ room, players, gameState });
  } catch (err) {
    console.error('Spectate error:', err);
    return NextResponse.json({ error: 'Failed to spectate' }, { status: 500 });
  }
}
