/**
 * MYSTATION - Verify OTP API Route
 * Verifies a 6-digit SMS OTP via Supabase Phone Auth, creates a session,
 * upserts profile row (phone, auth_method='phone'), looks up tier,
 * and sets mystation-auth + mystation-sub cookies.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CODE_REGEX = /^\d{6}$/;

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  const accessToken = data.session.access_token;

  // Upsert profile row — service role bypasses RLS intentionally
  try {
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          phone,
          auth_method: 'phone',
          email_auth_retired: false,
        },
        { onConflict: 'id' }
      );
    if (upsertErr) console.error('[verify-otp] profile upsert:', upsertErr);
  } catch (err) {
    console.error('[verify-otp] profile upsert exception:', err);
  }

  // Look up tier from subscribers table
  let tier = 'free';
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscribers')
      .select('tier')
      .eq('user_id', userId)
      .single();
    if (sub?.tier) tier = sub.tier;
  } catch {}

  const response = NextResponse.json({
    success: true,
    user: { id: userId, phone },
  });

  // Session cookie (30 days) — httpOnly, mirrors login flags
  response.cookies.set('mystation-auth', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  // Tier cookie (30 days) — client-readable per spec
  response.cookies.set('mystation-sub', tier, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  return response;
}
