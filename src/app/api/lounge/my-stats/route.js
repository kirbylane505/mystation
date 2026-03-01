/**
 * KICKBACK LOUNGE — My Stats API
 * GET: Fetch aggregate game stats for subscriber
 * Uses httpOnly mystation-email cookie for identity
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('mystation-email')?.value;

    if (!email) {
      return NextResponse.json({ wins: 0, bestStreak: 0, points: 0, gamesPlayed: 0 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ wins: 0, bestStreak: 0, points: 0, gamesPlayed: 0 });
    }

    const hash = await hashEmail(email);
    const subId = `sub_${hash}`;

    // Aggregate across all game types
    const { data: rows } = await supabase
      .from('game_stats')
      .select('wins, losses, games_played, best_streak, points_earned')
      .eq('user_id', subId);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ wins: 0, bestStreak: 0, points: 0, gamesPlayed: 0 });
    }

    const aggregate = rows.reduce((acc, row) => ({
      wins: acc.wins + (row.wins || 0),
      bestStreak: Math.max(acc.bestStreak, row.best_streak || 0),
      points: acc.points + (row.points_earned || 0),
      gamesPlayed: acc.gamesPlayed + (row.games_played || 0),
    }), { wins: 0, bestStreak: 0, points: 0, gamesPlayed: 0 });

    return NextResponse.json(aggregate);
  } catch (err) {
    console.error('my-stats error:', err);
    return NextResponse.json({ wins: 0, bestStreak: 0, points: 0, gamesPlayed: 0 });
  }
}
