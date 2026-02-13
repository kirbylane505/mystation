/**
 * KICKBACK LOUNGE — Start Game API
 * POST: Host starts the game (all players must be ready)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { GAME_TYPES } from '@/lib/games/constants';
import { initBlackjack, sanitizeBlackjackState } from '@/lib/games/blackjack';
import { initSlidesLadders, sanitizeSlidesLaddersState } from '@/lib/games/slidesLadders';

export async function POST(request) {
  try {
    const { roomId, playerId } = await request.json();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Verify room and host
    const { data: room } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.host_id !== playerId) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Game already started' }, { status: 400 });
    }

    // Get players
    const { data: players } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', roomId)
      .order('seat', { ascending: true });

    if (!players || players.length < (GAME_TYPES[room.game_type]?.minPlayers || 1)) {
      return NextResponse.json({
        error: `Need at least ${GAME_TYPES[room.game_type]?.minPlayers || 1} players`,
      }, { status: 400 });
    }

    // Check all players ready (host is auto-ready)
    const notReady = players.filter(p => !p.ready && p.user_id !== room.host_id);
    if (notReady.length > 0) {
      return NextResponse.json({ error: 'Not all players are ready' }, { status: 400 });
    }

    // Initialize game based on type
    const playerIds = players.map(p => p.user_id);
    let gameState;

    switch (room.game_type) {
      case 'blackjack':
        gameState = initBlackjack(playerIds);
        break;
      case 'slidesLadders':
        gameState = initSlidesLadders(playerIds);
        break;
      default:
        return NextResponse.json({ error: 'Game type not yet implemented' }, { status: 400 });
    }

    // Store full state in DB
    await supabase.from('game_state').upsert({
      room_id: roomId,
      state: gameState,
      updated_at: new Date().toISOString(),
    });

    // Update room status
    await supabase
      .from('game_rooms')
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', roomId);

    // Broadcast sanitized state to each player
    const channel = supabase.channel(`game:${roomId}`);

    // For games with hidden info (blackjack), each player gets their own view
    // For broadcast, send a generic view — clients will fetch their own state
    let broadcastState;
    switch (room.game_type) {
      case 'blackjack':
        broadcastState = sanitizeBlackjackState(gameState, '__broadcast__');
        break;
      case 'slidesLadders':
        broadcastState = sanitizeSlidesLaddersState(gameState);
        break;
    }

    channel.send({
      type: 'broadcast',
      event: 'game:start',
      payload: { gameState: broadcastState },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Start error:', err);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}
