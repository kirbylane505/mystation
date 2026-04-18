/**
 * MYSTATION - Migrate Link API Route
 * Attaches a phone number to an existing (legacy email) auth.users row.
 *
 * Two-phase POST:
 *   Phase A: { user_id, phone }              -> sends OTP via Supabase Phone Auth
 *   Phase B: { user_id, phone, code }        -> verifies OTP, links phone to
 *                                               the original user_id, upserts
 *                                               profiles, sets session cookies
 *                                               (same scheme as verify-otp).
 *
 * Safety:
 *  - If a phone is already on a DIFFERENT profile, Phase A returns 409.
 *  - Phase B's verifyOtp may have auto-created a phone-only auth user; in
 *    that case we delete it and still link the phone to the original user_id.
 *
 * Mirrors the cookie scheme in src/app/api/auth/verify-otp/route.js so the
 * session route / middleware / client gates recognize the user identically.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^\+1\d{10}$/;
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

  const { user_id, phone, code } = body || {};

  if (!user_id || !UUID_REGEX.test(user_id)) {
    return NextResponse.json({ error: 'Invalid user_id.' }, { status: 400 });
  }
  if (!phone || !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone format.' }, { status: 400 });
  }

  // -----------------------------------------------------------
  // Phase A — send OTP for migration
  // -----------------------------------------------------------
  if (code === undefined || code === null || code === '') {
    // Guard: this phone already attached to a DIFFERENT profile?
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, phone')
        .eq('phone', phone)
        .maybeSingle();
      if (existingProfile && existingProfile.id !== user_id) {
        return NextResponse.json(
          { error: 'This phone is already linked to another account.' },
          { status: 409 }
        );
      }
    } catch (err) {
      console.error('[migrate-link] profile guard:', err);
      // Fail open on lookup error — verifyOtp + updateUserById will catch dup anyway.
    }

    const { error } = await supabaseAnon.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });

    if (error) {
      console.error('[migrate-link] signInWithOtp:', error);
      return NextResponse.json({ error: 'Failed to send code.' }, { status: 500 });
    }

    return NextResponse.json({ otp_sent: true });
  }

  // -----------------------------------------------------------
  // Phase B — verify OTP + link phone to original user_id
  // -----------------------------------------------------------
  if (!CODE_REGEX.test(code)) {
    return NextResponse.json({ error: 'Invalid code format.' }, { status: 400 });
  }

  const { data: verifyData, error: verifyErr } = await supabaseAnon.auth.verifyOtp({
    phone,
    token: code,
    type: 'sms',
  });

  if (verifyErr || !verifyData?.session || !verifyData?.user) {
    console.error('[migrate-link] verifyOtp:', verifyErr);
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 401 });
  }

  // If Supabase auto-created a phone user despite shouldCreateUser:false
  // (e.g. the guard was called on an older lookup), clean it up so the
  // phone is free for the real user_id update.
  const verifiedUserId = verifyData.user.id;
  if (verifiedUserId !== user_id) {
    try {
      await supabaseAdmin.auth.admin.deleteUser(verifiedUserId);
    } catch (err) {
      console.error('[migrate-link] cleanup auto-created user:', err);
      // Proceed — updateUserById will fail on dup phone if cleanup didn't work.
    }
  }

  // Link phone to ORIGINAL auth.users row
  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, { phone });
  if (updateErr) {
    console.error('[migrate-link] updateUserById:', updateErr);
    return NextResponse.json(
      { error: 'Phone link failed. Contact support.' },
      { status: 409 }
    );
  }

  // Upsert profile — mark email-auth retired so future email logins return 410
  try {
    await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: user_id, phone, auth_method: 'migrated', email_auth_retired: true },
        { onConflict: 'id' }
      );
  } catch (err) {
    console.error('[migrate-link] profile upsert:', err);
  }

  // Look up email + tier to build the same cookie set as verify-otp
  let email = null;
  try {
    const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(user_id);
    email = userRec?.user?.email || null;
  } catch (err) {
    console.error('[migrate-link] getUserById:', err);
  }

  let tier = 'free';
  let isSubscribed = false;
  try {
    const { data: sub } = await supabaseAdmin
      .from('subscribers')
      .select('tier, status, free_until')
      .eq('user_id', user_id)
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
    user: { id: user_id, phone, tier, isSubscribed },
  });

  const COOKIE_DEFAULTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
  };

  response.cookies.set('mystation-auth', createAuthCookie(phone), COOKIE_DEFAULTS);
  response.cookies.set('mystation-phone', phone, COOKIE_DEFAULTS);
  if (email) {
    response.cookies.set('mystation-email', email, COOKIE_DEFAULTS);
  }

  if (isSubscribed) {
    const subTs = Date.now();
    const subSig = createHmac('sha256', AUDIO_SECRET).update(`sub:${subTs}`).digest('hex').slice(0, 32);
    response.cookies.set('mystation-sub', `${subTs}.${subSig}`, COOKIE_DEFAULTS);
    response.cookies.set('mystation-sub-flag', '1', { ...COOKIE_DEFAULTS, httpOnly: false });
  }

  return response;
}
