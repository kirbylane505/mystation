/**
 * MYSTATION - Send OTP API Route
 * Sends a 6-digit SMS OTP to a US/CA phone number via Supabase Phone Auth.
 * Rate limited: 1 OTP per phone per 60 seconds.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const US_CA_REGEX = /^\+1\d{10}$/;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const lastSentByPhone = new Map();

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { phone } = body;

  if (!phone || !US_CA_REGEX.test(phone)) {
    return NextResponse.json(
      { error: 'Phone number must be US or CA (+1XXXXXXXXXX).' },
      { status: 400 }
    );
  }

  const now = Date.now();
  const last = lastSentByPhone.get(phone) || 0;
  if (now - last < 60_000) {
    return NextResponse.json(
      { error: 'Too many requests. Wait 60 seconds.' },
      { status: 429 }
    );
  }

  // Set rate-limit timestamp BEFORE the call so failures can't be hammered.
  lastSentByPhone.set(phone, now);

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error('[send-otp]', error);
    return NextResponse.json({ error: 'Failed to send code.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
