/**
 * KICKBACK LOUNGE — Tournament Start API
 * POST: Generate bracket and create first-round game rooms
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateRoomCode } from '@/lib/games/deck';
import { GAME_TYPES } from '@/lib/games/constants';

/**
 * Generate single-elimination bracket
 * Shuffles players, creates matchups, handles byes for non-power-of-2 counts
 */
function generateBracket(players) {
  // Shuffle for random seeding
  const shuffled = [...players].sort(() => Math.random() - 0.5);

  // Find next power of 2
  let bracketSize = 1;
  while (bracketSize < shuffled.length) bracketSize *= 2;

  const totalRounds = Math.log2(bracketSize);
  const bracket = {
    rounds: totalRounds,
    matches: [],
  };

  // First round matchups
  const firstRoundMatches = bracketSize / 2;
  for (let i = 0; i < firstRoundMatches; i++) {
    const p1 = shuffled[i * 2] || null;
    const p2 = shuffled[i * 2 + 1] || null;

    const match = {
      id: `r1_m${i + 1}`,
      round: 1,
      matchNumber: i + 1,
      player1: p1 ? { user_id: p1.user_id, display_name: p1.display_name } : null,
      player2: p2 ? { user_id: p2.user_id, display_name: p2.display_name } : null,
      winner: null,
      roomId: null,
      status: 'pending', // pending | playing | finished
    };

    // If only one player (bye), auto-advance
    if (p1 && !p2) {
      match.winner = p1.user_id;
      match.status = 'finished';
    }

    bracket.matches.push(match);
  }

  // Create placeholder matches for subsequent rounds
  let matchesInPrevRound = firstRoundMatches;
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = matchesInPrevRound / 2;
    for (let i = 0; i < matchesInRound; i++) {
      bracket.matches.push({
        id: `r${round}_m${i + 1}`,
        round,
        matchNumber: i + 1,
        player1: null,
        player2: null,
        winner: null,
        roomId: null,
        status: 'pending',
      });
    }
    matchesInPrevRound = matchesInRound;
  }

  return bracket;
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { playerId } = await request.json();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.created_by !== playerId) {
      return NextResponse.json({ error: 'Only the creator can start the tournament' }, { status: 403 });
    }

    if (tournament.status !== 'registration') {
      return NextResponse.json({ error: 'Tournament already started' }, { status: 400 });
    }

    // Get players
    const { data: players } = await supabase
      .from('tournament_players')
      .select('*')
      .eq('tournament_id', id)
      .order('seed', { ascending: true });

    if (!players || players.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 });
    }

    // Generate bracket
    const bracket = generateBracket(players);

    // Create game rooms for first-round matches that have 2 players
    const gameType = tournament.game_type;
    const maxPlayers = GAME_TYPES[gameType]?.maxPlayers || 2;

    for (const match of bracket.matches) {
      if (match.round === 1 && match.player1 && match.player2 && match.status === 'pending') {
        const code = generateRoomCode();

        const { data: room } = await supabase
          .from('game_rooms')
          .insert({
            code,
            game_type: gameType,
            host_id: match.player1.user_id,
            host_name: match.player1.display_name,
            max_players: maxPlayers,
            tournament_id: id,
          })
          .select()
          .single();

        if (room) {
          match.roomId = room.id;
          match.roomCode = code;
          match.status = 'waiting';

          // Add both players to the room
          await supabase.from('game_players').insert([
            {
              room_id: room.id,
              user_id: match.player1.user_id,
              display_name: match.player1.display_name,
              seat: 0,
              ready: false,
            },
            {
              room_id: room.id,
              user_id: match.player2.user_id,
              display_name: match.player2.display_name,
              seat: 1,
              ready: false,
            },
          ]);
        }
      }
    }

    // Update tournament
    await supabase
      .from('tournaments')
      .update({
        status: 'in_progress',
        bracket,
        started_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({ bracket });
  } catch (err) {
    console.error('Tournament start error:', err);
    return NextResponse.json({ error: 'Failed to start tournament' }, { status: 500 });
  }
}
