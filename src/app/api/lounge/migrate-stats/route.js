/**
 * KICKBACK LOUNGE — Migrate Stats API
 * POST: One-time merge of anonymous player stats into subscriber account
 * Validates subscriber via httpOnly cookie
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

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('mystation-email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { subscriberPlayerId, anonymousPlayerId } = await request.json();

    if (!subscriberPlayerId || !anonymousPlayerId) {
      return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    // Verify subscriber ID matches cookie email
    const hash = await hashEmail(email);
    const expectedId = `sub_${hash}`;
    if (subscriberPlayerId !== expectedId) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });
    }

    // Fetch anonymous stats
    const { data: anonStats } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', anonymousPlayerId);

    if (!anonStats || anonStats.length === 0) {
      // No anonymous stats to migrate — that's OK
      return NextResponse.json({ migrated: 0 });
    }

    let migrated = 0;

    for (const anonRow of anonStats) {
      // Check if subscriber already has stats for this game type
      const { data: existing } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', expectedId)
        .eq('game_type', anonRow.game_type)
        .single();

      if (existing) {
        // Merge: sum counts, take max streak
        await supabase
          .from('game_stats')
          .update({
            wins: existing.wins + anonRow.wins,
            losses: existing.losses + anonRow.losses,
            games_played: existing.games_played + anonRow.games_played,
            best_streak: Math.max(existing.best_streak, anonRow.best_streak),
            points_earned: existing.points_earned + anonRow.points_earned,
            subscriber_email: email,
          })
          .eq('id', existing.id);
      } else {
        // Transfer: update user_id to subscriber ID
        await supabase
          .from('game_stats')
          .update({
            user_id: expectedId,
            subscriber_email: email,
          })
          .eq('id', anonRow.id);
      }
      migrated++;
    }

    // Clean up: delete any remaining anonymous rows that were merged (not transferred)
    await supabase
      .from('game_stats')
      .delete()
      .eq('user_id', anonymousPlayerId);

    // Update game_players references
    await supabase
      .from('game_players')
      .update({ user_id: expectedId })
      .eq('user_id', anonymousPlayerId);

    return NextResponse.json({ migrated });
  } catch (err) {
    console.error('migrate-stats error:', err);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
