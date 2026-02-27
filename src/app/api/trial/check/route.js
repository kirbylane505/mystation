/**
 * MYSTATION - Trial Check API
 * GET → reads cookies + Supabase → returns access status
 * Priority: mystation-sub > purchased_sub_until > stripe_sub_active > trial window
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;

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
    if (isNaN(ts) || Date.now() - ts > 365 * 24 * 60 * 60 * 1000) return false;
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

    // 2. Get email from trial cookie OR persistent email cookie
    const trial = verifyTrialCookie(cookieStr);
    const emailMatch = cookieStr.match(/mystation-email=([^;]+)/);
    const email = trial?.email || (emailMatch ? decodeURIComponent(emailMatch[1]) : null);

    // 3. If we have email, check Supabase — subscribers table first, then user_trials
    if (email) {
      try {
        const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
        const supabase = getSupabaseAdmin();
        if (supabase) {
          // Check subscribers table (active Stripe subscribers)
          const { data: sub } = await supabase
            .from('subscribers')
            .select('status, tier, email')
            .eq('email', email.toLowerCase())
            .eq('status', 'active')
            .single();

          if (sub) {
            // Active subscriber — refresh their sub cookie so it never expires
            const response = NextResponse.json({
              status: 'subscribed',
              expiresAt: null,
              source: 'subscriber',
              tier: sub.tier,
            });
            // Auto-refresh sub cookie for 365 days
            const timestamp = String(Date.now());
            const sig = createHmac('sha256', AUDIO_SECRET).update(`sub:${timestamp}`).digest('hex').slice(0, 32);
            response.cookies.set('mystation-sub', `${timestamp}.${sig}`, {
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
              maxAge: 365 * 24 * 60 * 60,
              path: '/',
            });
            // Client-readable flag so isGated() can see subscription status
            response.cookies.set('mystation-sub-flag', '1', {
              httpOnly: false,
              secure: true,
              sameSite: 'lax',
              maxAge: 365 * 24 * 60 * 60,
              path: '/',
            });
            return response;
          }

          // Check user_trials table
          const { data } = await supabase
            .from('user_trials')
            .select('purchased_sub_until, stripe_sub_active')
            .eq('email', email.toLowerCase())
            .single();

          if (data) {
            if (data.purchased_sub_until && new Date(data.purchased_sub_until) > new Date()) {
              return NextResponse.json({
                status: 'subscribed',
                expiresAt: data.purchased_sub_until,
                source: 'purchase',
              });
            }
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
    }

    // 4. Check trial window (26 min from start) — only if trial cookie exists
    if (trial?.email) {
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
