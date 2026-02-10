/**
 * MYSTATION - Subscription Validation API
 * Server-side enforcement of 4-song free limit
 * First 26 subscribers get free first month
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { email, trackId, sessionId } = await request.json();

    // If user has active subscription, allow unlimited
    if (email) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: sub } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', email)
          .eq('status', 'active')
          .single();

        if (sub) {
          return NextResponse.json({ canPlay: true, isSubscribed: true, reason: 'active_subscription' });
        }
      }
    }

    // Non-subscriber: check play count from server-side tracking
    // We use IP + session fingerprint to prevent bypass
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:${sessionId || 'anon'}`;

    // Get or create play tracking for this session
    if (!global._playTracking) global._playTracking = new Map();
    const tracking = global._playTracking;

    let session = tracking.get(key);
    if (!session) {
      session = { plays: new Set(), createdAt: Date.now() };
      tracking.set(key, session);
    }

    // Clean old sessions (>24h)
    const now = Date.now();
    for (const [k, v] of tracking) {
      if (now - v.createdAt > 24 * 60 * 60 * 1000) tracking.delete(k);
    }

    // Already played this track? Allow replay
    if (session.plays.has(trackId)) {
      return NextResponse.json({ canPlay: true, isSubscribed: false, reason: 'replay' });
    }

    // Check limit (4 unique plays)
    if (session.plays.size >= 4) {
      return NextResponse.json({
        canPlay: false,
        isSubscribed: false,
        reason: 'limit_reached',
        playCount: session.plays.size,
        limit: 4,
      });
    }

    // Allow and track
    session.plays.add(trackId);
    return NextResponse.json({
      canPlay: true,
      isSubscribed: false,
      reason: 'free_play',
      playCount: session.plays.size,
      limit: 4,
    });
  } catch (err) {
    console.error('Subscription validate error:', err);
    // On error, allow play (don't block users due to server issues)
    return NextResponse.json({ canPlay: true, isSubscribed: false, reason: 'error_fallback' });
  }
}
