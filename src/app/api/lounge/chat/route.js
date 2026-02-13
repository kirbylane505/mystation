/**
 * KICKBACK LOUNGE — Chat API
 * POST: Send a message or emote in a game room
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { roomId, playerId, text, emote } = await request.json();

    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'roomId and playerId required' }, { status: 400 });
    }

    if (!text && !emote) {
      return NextResponse.json({ error: 'text or emote required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get player info
    const { data: player } = await supabase
      .from('game_players')
      .select('display_name')
      .eq('room_id', roomId)
      .eq('user_id', playerId)
      .single();

    if (!player) {
      return NextResponse.json({ error: 'Player not in room' }, { status: 403 });
    }

    const message = {
      room_id: roomId,
      player_id: playerId,
      display_name: player.display_name,
      text: text ? text.slice(0, 200) : null, // limit message length
      emote: emote || null,
    };

    // Save to DB
    const { data: saved } = await supabase
      .from('game_messages')
      .insert(message)
      .select()
      .single();

    // Broadcast
    supabase.channel(`chat:${roomId}`).send({
      type: 'broadcast',
      event: 'chat:message',
      payload: {
        message: {
          id: saved?.id || Date.now(),
          sender: player.display_name,
          senderId: playerId,
          text: message.text,
          emote: message.emote,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
