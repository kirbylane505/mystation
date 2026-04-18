/**
 * MYSTATION - Verify OTP API Route
 * Verifies a 6-digit SMS OTP via Supabase Phone Auth, creates a session,
 * upserts the profile row, looks up tier, and sets the same cookie scheme
 * the email login uses — keyed on phone instead of email so session route
 * + middleware + client gates recognize phone users identically to email users.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const CODE_REGEX = /^\d{6}$/;
const AUDIO_SECRET = process.env.AUDIO_SECRET;

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mirrors src/app/api/auth/login/route.js createAuthCookie but keyed on phone
function createAuthCookie(phone) {
  const timestamp = Date.now();
  const payload = `${phone}:${timestamp}`;
  const sig = createHmac('sha256', AUDIO_SECRET).update(`auth:${payload}`).digest('hex').slice(0, 32);
  return `${payload}:${sig}`;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { phone, code } = body || {};

  if (!phone || !code || !CODE_REGEX.test(code)) {
    return NextResponse.json({ error: 'Invalid code format.' }, { status: 400 });
  }

  const { data, error } = await supabaseAnon.auth.verifyOtp({
    phone,
    token: code,
    type: 'sms',
  });

  if (error || !data?.session || !data?.user) {
    console.error('[verify-otp]', error);
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 401 });
  }

  const userId = data.user.id;

  // Upsert profile — service role bypasses RLS intentionally
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: userId, phone, auth_method: 'phone', email_auth_retired: false },
        { onConflict: 'id' }
      );
  } catch (err) {
    console.error('[verify-otp] profile upsert:', err);
  }

  // Look up tier from subscribers
  let tier = 'free';
  let isSubscribed = false;
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscribers')
      .select('tier, status, free_until')
      .eq('user_id', userId)
      .single();
    if (sub) {
      if (sub.status === 'active') {
        isSubscribed = true;
        tier = sub.tier || 'premium';
      } else if (sub.free_until && new Date(sub.free_until) > new Date()) {
        isSubscribed = true;
        tier = sub.tier || 'free';
      }
    }
  } catch {}

  const response = NextResponse.json({
    success: true,
    user: { id: userId, phone, tier, isSubscribed },
  });

  const COOKIE_DEFAULTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  };

  // HMAC auth cookie — same format as login route, keyed on phone
  response.cookies.set('mystation-auth', createAuthCookie(phone), COOKIE_DEFAULTS);

  // Phone identity cookie — parallel to mystation-email. Session route reads either.
  response.cookies.set('mystation-phone', phone, COOKIE_DEFAULTS);

  // Subscription cookies — only if actually subscribed (mirror login flow)
  if (isSubscribed) {
    const subTs = Date.now();
    const subSig = createHmac('sha256', AUDIO_SECRET).update(`sub:${subTs}`).digest('hex').slice(0, 32);
    response.cookies.set('mystation-sub', `${subTs}.${subSig}`, COOKIE_DEFAULTS);
    response.cookies.set('mystation-sub-flag', '1', { ...COOKIE_DEFAULTS, httpOnly: false });
  }

  return response;
}
