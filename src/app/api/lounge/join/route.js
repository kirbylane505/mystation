/**
 * KICKBACK LOUNGE — Join Room API
 * POST: Join a room by code
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { GAME_TYPES } from '@/lib/games/constants';

export async function POST(request) {
  try {
    const { code, displayName, playerId: clientPlayerId } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Room code required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Find room
    const { data: room, error: roomErr } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    }

    // Check player count
    const { data: existingPlayers } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', room.id);

    const maxPlayers = GAME_TYPES[room.game_type]?.maxPlayers || 4;
    if ((existingPlayers || []).length >= maxPlayers) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    const userId = clientPlayerId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const name = (displayName || 'Player').slice(0, 20);

    // Add player
    const { data: player, error: playerErr } = await supabase
      .from('game_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        display_name: name,
        seat: (existingPlayers || []).length,
        ready: false,
      })
      .select()
      .single();

    if (playerErr) throw playerErr;

    const allPlayers = [...(existingPlayers || []), player];

    // Broadcast player joined
    supabase.channel(`room:${room.id}`).send({
      type: 'broadcast',
      event: 'room:players',
      payload: { players: allPlayers },
    });

    return NextResponse.json({
      room,
      players: allPlayers,
      myPlayerId: userId,
    });
  } catch (err) {
    console.error('Join error:', err);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
