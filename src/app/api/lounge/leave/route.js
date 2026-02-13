/**
 * KICKBACK LOUNGE — Leave Room API
 * POST: Leave a room
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

    // Remove player
    await supabase
      .from('game_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', playerId);

    // Get remaining players
    const { data: remaining } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat', { ascending: true });

    // If no players left, delete the room
    if (!remaining || remaining.length === 0) {
      await supabase.from('game_rooms').delete().eq('id', roomId);
      return NextResponse.json({ ok: true, roomDeleted: true });
    }

    // If host left, assign new host
    const { data: room } = await supabase
      .from('game_rooms')
      .select('host_id')
      .eq('id', roomId)
      .single();

    if (room && room.host_id === playerId) {
      await supabase
        .from('game_rooms')
        .update({
          host_id: remaining[0].user_id,
          host_name: remaining[0].display_name,
        })
        .eq('id', roomId);
    }

    // Broadcast updated players
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'room:players',
      payload: { players: remaining },
    });

    return NextResponse.json({ ok: true, players: remaining });
  } catch (err) {
    console.error('Leave error:', err);
    return NextResponse.json({ error: 'Failed to leave room' }, { status: 500 });
  }
}
