/**
 * KICKBACK LOUNGE — Rooms API
 * GET: List open rooms | POST: Create a new room
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateRoomCode } from '@/lib/games/deck';
import { GAME_TYPES } from '@/lib/games/constants';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ rooms: [] });
    }

    const { data: rooms } = await supabase
      .from('game_rooms')
      .select('id, code, game_type, status, host_name, max_players, created_at')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(20);

    // Get player counts per room
    const roomIds = (rooms || []).map(r => r.id);
    let playerCounts = {};

    if (roomIds.length > 0) {
      const { data: counts } = await supabase
        .from('game_players')
        .select('room_id')
        .in('room_id', roomIds);

      for (const row of (counts || [])) {
        playerCounts[row.room_id] = (playerCounts[row.room_id] || 0) + 1;
      }
    }

    const enrichedRooms = (rooms || []).map(r => ({
      ...r,
      playerCount: playerCounts[r.id] || 0,
      gameName: GAME_TYPES[r.game_type]?.name || r.game_type,
      gameIcon: GAME_TYPES[r.game_type]?.icon || '🎮',
    }));

    return NextResponse.json({ rooms: enrichedRooms });
  } catch (err) {
    console.error('Rooms GET error:', err);
    return NextResponse.json({ rooms: [] });
  }
}

export async function POST(request) {
  try {
    const { gameType, displayName, playerId: clientPlayerId } = await request.json();

    if (!gameType || !GAME_TYPES[gameType]) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    if (GAME_TYPES[gameType].comingSoon) {
      return NextResponse.json({ error: `${GAME_TYPES[gameType].name} is coming soon!` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const code = generateRoomCode();
    const userId = clientPlayerId || `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const name = (displayName || 'Player').slice(0, 20);

    // Create room
    const { data: room, error: roomErr } = await supabase
      .from('game_rooms')
      .insert({
        code,
        game_type: gameType,
        host_id: userId,
        host_name: name,
        max_players: GAME_TYPES[gameType].maxPlayers,
      })
      .select()
      .single();

    if (roomErr) throw roomErr;

    // Add host as first player
    const { data: player, error: playerErr } = await supabase
      .from('game_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        display_name: name,
        seat: 0,
        ready: false,
      })
      .select()
      .single();

    if (playerErr) throw playerErr;

    return NextResponse.json({
      room,
      players: [player],
      myPlayerId: userId,
    });
  } catch (err) {
    console.error('Rooms POST error:', err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
