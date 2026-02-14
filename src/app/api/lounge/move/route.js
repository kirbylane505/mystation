/**
 * KICKBACK LOUNGE — Move API (THE CORE)
 * POST: Submit a game move — validates, applies, broadcasts
 * Server-authoritative: all game logic runs here
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { GAME_POINTS } from '@/lib/games/constants';
import { applyBlackjackMove, sanitizeBlackjackState } from '@/lib/games/blackjack';
import { applySlidesLaddersMove, sanitizeSlidesLaddersState } from '@/lib/games/slidesLadders';
import { applyPoolMove, sanitizePoolState } from '@/lib/games/pool';
import { applySpadesMove, sanitizeSpadesState } from '@/lib/games/spades';

export async function POST(request) {
  try {
    const { roomId, playerId, action } = await request.json();

    if (!roomId || !playerId || !action) {
      return NextResponse.json({ error: 'roomId, playerId, action required' }, { status: 400 });
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

    if (!room || room.status !== 'playing') {
      return NextResponse.json({ error: 'Game not in progress' }, { status: 400 });
    }

    // Get current state
    const { data: stateRow } = await supabase
      .from('game_state')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (!stateRow) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 });
    }

    let gameState = stateRow.state;
    let result;

    // Apply move based on game type
    switch (room.game_type) {
      case 'blackjack':
        result = applyBlackjackMove(gameState, playerId, action);
        break;
      case 'slidesLadders':
        result = applySlidesLaddersMove(gameState, playerId);
        break;
      case 'pool':
        result = applyPoolMove(gameState, playerId, action);
        break;
      case 'spades':
        result = applySpadesMove(gameState, playerId, action);
        break;
      default:
        return NextResponse.json({ error: 'Game type not supported' }, { status: 400 });
    }

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const newState = result.state;

    // Log the move
    const { data: moveCount } = await supabase
      .from('game_moves')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId);

    await supabase.from('game_moves').insert({
      room_id: roomId,
      player_id: playerId,
      action,
      data: result.moveDetails || {},
      move_number: (moveCount?.length || 0) + 1,
    });

    // Save updated state
    await supabase
      .from('game_state')
      .update({
        state: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', roomId);

    // If game ended, update room + award points
    if (newState.phase === 'finished') {
      await supabase
        .from('game_rooms')
        .update({
          status: 'finished',
          finished_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      // Award points
      await awardGamePoints(supabase, room, newState);
    }

    // Broadcast updated state
    const channel = supabase.channel(`game:${roomId}`);
    let broadcastState;

    switch (room.game_type) {
      case 'blackjack':
        broadcastState = sanitizeBlackjackState(newState, '__broadcast__');
        break;
      case 'slidesLadders':
        broadcastState = sanitizeSlidesLaddersState(newState);
        break;
      case 'pool':
        broadcastState = sanitizePoolState(newState);
        break;
      case 'spades':
        broadcastState = sanitizeSpadesState(newState, '__broadcast__');
        break;
    }

    const event = newState.phase === 'finished' ? 'game:end' : 'game:state';
    channel.send({
      type: 'broadcast',
      event,
      payload: { gameState: broadcastState },
    });

    return NextResponse.json({ ok: true, moveDetails: result.moveDetails });
  } catch (err) {
    console.error('Move error:', err);
    return NextResponse.json({ error: 'Failed to process move' }, { status: 500 });
  }
}

/**
 * Award points to players when game ends
 */
async function awardGamePoints(supabase, room, gameState) {
  try {
    const players = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', room.id);

    for (const player of (players.data || [])) {
      const userId = player.user_id;
      let isWinner = false;
      let pointsEarned = GAME_POINTS.gameLoss; // participation

      // Determine winner
      if (room.game_type === 'blackjack' && gameState.results) {
        const result = gameState.results[userId];
        if (result?.outcome === 'win' || result?.outcome === 'blackjack') {
          isWinner = true;
          pointsEarned = GAME_POINTS.gameWin;
          if (result.outcome === 'blackjack') {
            pointsEarned += GAME_POINTS.perfectBlackjack;
          }
        }
      } else if (room.game_type === 'spades' && gameState.results) {
        const result = gameState.results[userId];
        if (result?.outcome === 'win') {
          isWinner = true;
          pointsEarned = GAME_POINTS.gameWin;
        }
      } else if (room.game_type === 'slidesLadders' || room.game_type === 'pool') {
        if (gameState.winner === userId) {
          isWinner = true;
          pointsEarned = GAME_POINTS.gameWin;
        }
      }

      // Upsert stats
      const { data: existing } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('game_type', room.game_type)
        .single();

      if (existing) {
        const newStreak = isWinner ? existing.current_streak + 1 : 0;

        // Check streak bonuses
        if (newStreak === 3) pointsEarned += GAME_POINTS.winStreak3;
        if (newStreak === 5) pointsEarned += GAME_POINTS.winStreak5;

        await supabase
          .from('game_stats')
          .update({
            wins: existing.wins + (isWinner ? 1 : 0),
            losses: existing.losses + (isWinner ? 0 : 1),
            games_played: existing.games_played + 1,
            current_streak: newStreak,
            best_streak: Math.max(existing.best_streak, newStreak),
            points_earned: existing.points_earned + pointsEarned,
            last_played_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('game_stats')
          .insert({
            user_id: userId,
            game_type: room.game_type,
            wins: isWinner ? 1 : 0,
            losses: isWinner ? 0 : 1,
            games_played: 1,
            current_streak: isWinner ? 1 : 0,
            best_streak: isWinner ? 1 : 0,
            points_earned: pointsEarned,
          });
      }
    }
  } catch (err) {
    console.error('Award points error:', err);
  }
}
