/**
 * KICKBACK LOUNGE — Game State API
 * GET: Fetch sanitized game state for a specific player
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeBlackjackState } from '@/lib/games/blackjack';
import { sanitizeSlidesLaddersState } from '@/lib/games/slidesLadders';
import { sanitizePoolState } from '@/lib/games/pool';
import { sanitizeSpadesState } from '@/lib/games/spades';
import { sanitizeDominoesState } from '@/lib/games/dominoes';

export async function GET(request, { params }) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get room info
    const { data: room } = await supabase
      .from('game_rooms')
      .select('game_type, status')
      .eq('id', roomId)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get game state
    const { data: stateRow } = await supabase
      .from('game_state')
      .select('state')
      .eq('room_id', roomId)
      .single();

    if (!stateRow) {
      return NextResponse.json({ gameState: null });
    }

    // Sanitize based on game type
    let gameState;
    switch (room.game_type) {
      case 'blackjack':
        gameState = sanitizeBlackjackState(stateRow.state, playerId);
        break;
      case 'slidesLadders':
        gameState = sanitizeSlidesLaddersState(stateRow.state);
        break;
      case 'pool':
        gameState = sanitizePoolState(stateRow.state);
        break;
      case 'spades':
        gameState = sanitizeSpadesState(stateRow.state, playerId);
        break;
      case 'dominoes':
        gameState = sanitizeDominoesState(stateRow.state, playerId);
        break;
      default:
        gameState = stateRow.state;
    }

    return NextResponse.json({
      gameState,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('State error:', err);
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 });
  }
}
