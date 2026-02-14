/**
 * MYSTATION - Subscription Validation API
 * Server-side enforcement of 26-minute free trial
 * After 26 minutes from first visit, must subscribe
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

    // Non-subscriber: 26-minute free trial based on IP session
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:${sessionId || 'anon'}`;

    if (!global._trialTracking) global._trialTracking = new Map();
    const tracking = global._trialTracking;

    let session = tracking.get(key);
    if (!session) {
      session = { firstPlay: Date.now(), plays: new Set() };
      tracking.set(key, session);
    }

    // Clean old sessions (>2h)
    const now = Date.now();
    for (const [k, v] of tracking) {
      if (now - v.firstPlay > 2 * 60 * 60 * 1000) tracking.delete(k);
    }

    // Check 26-minute trial
    const elapsed = now - session.firstPlay;
    const trialMs = 26 * 60 * 1000;

    if (elapsed >= trialMs) {
      return NextResponse.json({
        canPlay: false,
        isSubscribed: false,
        reason: 'trial_expired',
        trialStart: session.firstPlay,
        elapsed,
      });
    }

    // Within trial — allow play and track
    session.plays.add(trackId);
    return NextResponse.json({
      canPlay: true,
      isSubscribed: false,
      reason: 'free_trial',
      trialRemaining: trialMs - elapsed,
      playCount: session.plays.size,
    });
  } catch (err) {
    console.error('Subscription validate error:', err);
    // On error, allow play (don't block users due to server issues)
    return NextResponse.json({ canPlay: true, isSubscribed: false, reason: 'error_fallback' });
  }
}
