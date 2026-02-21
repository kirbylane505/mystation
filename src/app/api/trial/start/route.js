/**
 * MYSTATION - Trial Start API
 * POST { email } → upserts user_trials in Supabase + sets httpOnly trial cookie
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = new Date();

    // Upsert into Supabase user_trials
    let trialStartedAt = now;
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // Check if user already exists
        const { data: existing } = await supabase
          .from('user_trials')
          .select('trial_started_at, purchased_sub_until, stripe_sub_active')
          .eq('email', cleanEmail)
          .single();

        if (existing) {
          // User exists — keep original trial start
          trialStartedAt = new Date(existing.trial_started_at);
        } else {
          // New user — insert
          await supabase.from('user_trials').insert({
            email: cleanEmail,
            trial_started_at: now.toISOString(),
          });
        }
      }
    } catch (e) {
      console.error('Supabase trial upsert error:', e);
      // Continue — cookie-based trial still works without Supabase
    }

    // Create signed trial cookie: email:timestamp:hmac
    const timestamp = String(trialStartedAt.getTime());
    const payload = `${cleanEmail}:${timestamp}`;
    const sig = createHmac('sha256', AUDIO_SECRET).update(`trial:${payload}`).digest('hex').slice(0, 32);
    const cookieValue = `${cleanEmail}:${timestamp}:${sig}`;

    const trialExpiresAt = new Date(trialStartedAt.getTime() + 26 * 60 * 1000);

    const response = NextResponse.json({
      trial_started_at: trialStartedAt.toISOString(),
      trial_expires_at: trialExpiresAt.toISOString(),
    });

    response.cookies.set('mystation-trial', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60, // Keep trial cookie for email lookup (365 days)
      path: '/',
    });

    // Set persistent email cookie — site never forgets who visited (365 days)
    response.cookies.set('mystation-email', cleanEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Trial start error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
