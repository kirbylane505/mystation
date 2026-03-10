/**
 * KICKBACK LOUNGE — Move API (THE CORE)
 * POST: Submit a game move — validates, applies, broadcasts
 * Server-authoritative: all game logic runs here
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { GAME_POINTS } from '@/lib/games/constants';
import { applyBlackjackMove, sanitizeBlackjackState } from '@/lib/games/blackjack';
import { applyPoolMove, sanitizePoolState } from '@/lib/games/pool';
import { applySpadesMove, sanitizeSpadesState } from '@/lib/games/spades';
import { applyDominoesMove, sanitizeDominoesState } from '@/lib/games/dominoes';
import { applyQuizMove, sanitizeQuizState } from '@/lib/games/quiz';

export async function POST(request) {
  try {
    const { roomId, playerId, action, ...moveData } = await request.json();

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
      case 'pool': {
        // In solo mode, use the current turn player (may be AI)
        const poolPlayer = gameState.turnOrder?.[gameState.currentPlayerIndex] === 'ai_opponent'
          ? 'ai_opponent' : playerId;
        result = applyPoolMove(gameState, poolPlayer, action);
        break;
      }
      case 'spades':
        result = applySpadesMove(gameState, playerId, action);
        break;
      case 'dominoes': {
        if (action === 'ai_move') {
          // Client requested server-side AI move
          const aiPid = gameState.playerOrder[gameState.currentTurnIndex];
          if (!aiPid?.startsWith('ai_')) {
            return NextResponse.json({ error: 'Not AI turn' }, { status: 400 });
          }
          result = playDominoesAI(gameState, aiPid);
        } else {
          result = applyDominoesMove(gameState, playerId, action, moveData);
        }
        break;
      }
      case 'quiz':
        result = applyQuizMove(gameState, playerId, action, moveData);
        break;
      case 'galaga': {
        // Galaga runs client-side — moves report score/gameover to server
        const newGalagaState = { ...gameState };
        if (action === 'score') {
          newGalagaState.scores = { ...newGalagaState.scores, [playerId]: moveData.score || 0 };
        } else if (action === 'gameover') {
          newGalagaState.scores = { ...newGalagaState.scores, [playerId]: moveData.score || 0 };
          newGalagaState.phase = 'finished';
          newGalagaState.winner = Object.entries(newGalagaState.scores)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || playerId;
          newGalagaState.results = Object.fromEntries(
            Object.entries(newGalagaState.scores).map(([id, score]) => [id, {
              outcome: id === newGalagaState.winner ? 'win' : 'loss',
              score,
              reason: id === newGalagaState.winner ? 'High score!' : 'Game over',
            }])
          );
        }
        result = { valid: true, state: newGalagaState };
        break;
      }
      default:
        return NextResponse.json({ error: 'Game type not supported' }, { status: 400 });
    }

    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    let newState = result.state;

    // Auto-play AI turns (Dominoes)
    if (room.game_type === 'dominoes') {
      let safety = 0;
      while (newState.phase !== 'finished' && safety < 100) {
        const nextPlayer = newState.playerOrder[newState.currentTurnIndex];
        if (!nextPlayer?.startsWith('ai_')) break;

        const aiResult = playDominoesAI(newState, nextPlayer);
        if (!aiResult.valid) break;
        newState = aiResult.state;
        safety++;
      }
    }

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
      case 'pool':
        broadcastState = sanitizePoolState(newState);
        break;
      case 'spades':
        broadcastState = sanitizeSpadesState(newState, '__broadcast__');
        break;
      case 'dominoes':
        broadcastState = sanitizeDominoesState(newState, '__broadcast__');
        break;
      case 'quiz':
        broadcastState = sanitizeQuizState(newState, '__broadcast__');
        break;
    }

    const event = newState.phase === 'finished' ? 'game:end' : 'game:state';

    // For games with hidden info, send personalized state per player
    const hiddenInfoGames = ['blackjack', 'spades', 'dominoes', 'quiz'];
    if (hiddenInfoGames.includes(room.game_type)) {
      const { data: roomPlayers } = await supabase
        .from('game_players')
        .select('user_id')
        .eq('room_id', roomId);

      for (const rp of (roomPlayers || [])) {
        let personalState;
        switch (room.game_type) {
          case 'blackjack': personalState = sanitizeBlackjackState(newState, rp.user_id); break;
          case 'spades': personalState = sanitizeSpadesState(newState, rp.user_id); break;
          case 'dominoes': personalState = sanitizeDominoesState(newState, rp.user_id); break;
          case 'quiz': personalState = sanitizeQuizState(newState, rp.user_id); break;
        }
        channel.send({
          type: 'broadcast',
          event: `${event}:${rp.user_id}`,
          payload: { gameState: personalState },
        });
      }
    }

    // Also send generic broadcast for spectators + games without hidden info
    channel.send({
      type: 'broadcast',
      event,
      payload: { gameState: broadcastState },
    });

    // Send game event message to chat channel
    const gameEvent = getGameEventMessage(room.game_type, action, result, newState, playerId);
    if (gameEvent) {
      const chatChannel = supabase.channel(`chat:${roomId}`);
      chatChannel.send({
        type: 'broadcast',
        event: 'chat:message',
        payload: {
          message: {
            id: `event_${Date.now()}`,
            sender: 'system',
            senderId: 'system',
            text: gameEvent,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({ ok: true, moveDetails: result.moveDetails });
  } catch (err) {
    console.error('Move error:', err);
    return NextResponse.json({ error: 'Failed to process move' }, { status: 500 });
  }
}

/**
 * Simple AI for Dominoes — plays first valid tile, draws if stuck, passes if blocked
 */
function playDominoesAI(state, aiPlayerId) {
  const hand = state.hands[aiPlayerId];
  if (!hand || hand.length === 0) {
    return { state, valid: false, error: 'AI has no tiles' };
  }

  // First tile (empty chain) — play highest pip tile
  if (state.chain.length === 0) {
    let bestIdx = 0;
    let bestPips = hand[0].a + hand[0].b;
    for (let i = 1; i < hand.length; i++) {
      const pips = hand[i].a + hand[i].b;
      if (pips > bestPips) { bestPips = pips; bestIdx = i; }
    }
    return applyDominoesMove(state, aiPlayerId, 'play', { tileId: hand[bestIdx].id, end: 'right' });
  }

  // Try to play a tile — prefer higher pip count to shed heavy tiles
  let bestTile = null;
  let bestEnd = null;
  let bestPips = -1;
  for (const tile of hand) {
    const pips = tile.a + tile.b;
    if (tile.a === state.leftEnd || tile.b === state.leftEnd) {
      if (pips > bestPips) { bestTile = tile; bestEnd = 'left'; bestPips = pips; }
    }
    if (tile.a === state.rightEnd || tile.b === state.rightEnd) {
      if (pips > bestPips) { bestTile = tile; bestEnd = 'right'; bestPips = pips; }
    }
  }

  if (bestTile) {
    return applyDominoesMove(state, aiPlayerId, 'play', { tileId: bestTile.id, end: bestEnd });
  }

  // Can't play — draw from boneyard
  if (state.boneyard.length > 0) {
    return applyDominoesMove(state, aiPlayerId, 'draw', {});
  }

  // Can't play + no boneyard — pass
  return applyDominoesMove(state, aiPlayerId, 'pass', {});
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
      } else if (room.game_type === 'dominoes' && gameState.results) {
        const result = gameState.results[userId];
        if (result?.outcome === 'win') {
          isWinner = true;
          pointsEarned = GAME_POINTS.gameWin;
        }
      } else if (room.game_type === 'pool') {
        if (gameState.winner === userId) {
          isWinner = true;
          pointsEarned = GAME_POINTS.gameWin;
        }
      } else if (room.game_type === 'quiz') {
        const results = Object.entries(gameState.players)
          .sort((a, b) => b[1].score - a[1].score);
        if (results[0] && results[0][0] === userId) {
          isWinner = true;
          pointsEarned = GAME_POINTS.gameWin;
          // Perfect quiz bonus
          const pData = gameState.players[userId];
          if (pData.answers.length === gameState.questions.length && pData.answers.every(a => a.correct)) {
            pointsEarned += GAME_POINTS.quizPerfect || 0;
          }
          // 7+ streak bonus
          if (pData.longestStreak >= 7) {
            pointsEarned += GAME_POINTS.quizStreak7 || 0;
          }
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
            ...(userId.startsWith('sub_') && !existing.subscriber_email ? { subscriber_email: userId } : {}),
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

      // Check and award badges
      try {
        const { checkAndAwardBadges } = await import('@/lib/profiles/awardBadge');
        await checkAndAwardBadges(supabase, userId, {
          type: 'game_result',
          gameType: room.game_type,
          isWinner,
          stats: existing || { wins: 0 },
          newStreak: isWinner ? (existing ? existing.current_streak + 1 : 1) : 0,
          perfectQuiz: room.game_type === 'quiz' && isWinner && (() => {
            const pData = gameState.players?.[userId];
            return pData?.answers?.length === gameState.questions?.length && pData?.answers?.every(a => a.correct);
          })(),
        });
      } catch (badgeErr) {
        console.error('Badge check error:', badgeErr);
      }
    }
  } catch (err) {
    console.error('Award points error:', err);
  }
}

/**
 * Generate game event messages for notable plays
 */
function getGameEventMessage(gameType, action, result, state, playerId) {
  const details = result.moveDetails || {};

  switch (gameType) {
    case 'blackjack':
      if (action === 'hit' && state.results?.[playerId]?.outcome === 'blackjack') return 'Blackjack! 21!';
      if (action === 'hit' && state.results?.[playerId]?.outcome === 'bust') return 'Bust! Over 21.';
      return null;

    case 'dominoes':
      if (action === 'play' && details.isDouble) return 'Slammed a double!';
      if (state.phase === 'finished') return 'Dominoes! Game over!';
      return null;

    case 'quiz':
      if (action === 'answer' && details.answerIndex !== undefined) {
        const pData = state.players?.[playerId];
        if (pData?.streak >= 5) return `${pData.streak} in a row! On fire!`;
      }
      return null;

    case 'spades':
      if (details.booksTaken) return `Won the book!`;
      return null;

    default:
      return null;
  }
}
