/**
 * MYSTATION - Trial Check API
 * GET → reads cookies + Supabase → returns access status
 * Priority: mystation-sub > purchased_sub_until > stripe_sub_active > trial window
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';

function verifySubCookie(cookieStr) {
  const match = cookieStr.match(/mystation-sub=([^;]+)/);
  if (!match) return false;
  try {
    const [timestamp, sig] = match[1].split('.');
    if (!timestamp || !sig) return false;
    const expected = createHmac('sha256', AUDIO_SECRET).update(`sub:${timestamp}`).digest('hex').slice(0, 32);
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return false;
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

function verifyTrialCookie(cookieStr) {
  const match = cookieStr.match(/mystation-trial=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = decodeURIComponent(match[1]);
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    const sig = parts[parts.length - 1];
    const timestamp = parts[parts.length - 2];
    const email = parts.slice(0, parts.length - 2).join(':');

    const payload = `${email}:${timestamp}`;
    const expected = createHmac('sha256', AUDIO_SECRET).update(`trial:${payload}`).digest('hex').slice(0, 32);
    if (expected.length !== sig.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return null;

    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return null;

    return { email, trialStartedAt: ts };
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const cookieStr = request.headers.get('cookie') || '';

    // 1. Check subscription cookie (highest priority)
    if (verifySubCookie(cookieStr)) {
      return NextResponse.json({
        status: 'subscribed',
        expiresAt: null,
      });
    }

    // 2. Check trial cookie
    const trial = verifyTrialCookie(cookieStr);

    // 3. If we have email from trial, check Supabase for purchase-granted sub
    if (trial?.email) {
      try {
        const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data } = await supabase
            .from('user_trials')
            .select('purchased_sub_until, stripe_sub_active')
            .eq('email', trial.email)
            .single();

          if (data) {
            // Check purchased_sub_until
            if (data.purchased_sub_until && new Date(data.purchased_sub_until) > new Date()) {
              return NextResponse.json({
                status: 'subscribed',
                expiresAt: data.purchased_sub_until,
                source: 'purchase',
              });
            }
            // Check stripe_sub_active
            if (data.stripe_sub_active) {
              return NextResponse.json({
                status: 'subscribed',
                expiresAt: null,
                source: 'stripe',
              });
            }
          }
        }
      } catch (e) {
        console.error('Supabase trial check error:', e);
      }

      // 4. Check trial window (26 min from start)
      const elapsed = Date.now() - trial.trialStartedAt;
      const trialMs = 26 * 60 * 1000;

      if (elapsed < trialMs) {
        return NextResponse.json({
          status: 'trial',
          expiresAt: new Date(trial.trialStartedAt + trialMs).toISOString(),
          email: trial.email,
        });
      }

      // Trial expired
      return NextResponse.json({
        status: 'expired',
        email: trial.email,
      });
    }

    // No cookie at all
    return NextResponse.json({ status: 'none' });
  } catch (error) {
    console.error('Trial check error:', error);
    return NextResponse.json({ status: 'none' });
  }
}
