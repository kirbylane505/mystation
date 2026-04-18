/**
 * MYSTATION - Cross-app Premium check
 * Called by MyTicketsLive (and other Empire apps) to confirm a phone owns
 * an active Premium sub. Gated by MYSTATION_SHARED_SECRET (timing-safe compare).
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createRateLimiter } from '@/lib/rateLimit';

const US_CA_REGEX = /^\+1\d{10}$/;
const checkPremiumLimiter = createRateLimiter('check-premium', 60, 60000); // 60 req/IP/min

function verifySharedSecret(header) {
  const expected = process.env.MYSTATION_SHARED_SECRET;
  if (!expected || !header || header.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(request) {
  const limited = checkPremiumLimiter(request);
  if (limited) return limited;

  if (!verifySharedSecret(request.headers.get('x-shared-secret'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const phone = new URL(request.url).searchParams.get('phone');
  if (!phone || !US_CA_REGEX.test(phone)) {
    return NextResponse.json({ error: 'Missing or invalid phone.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (!profile) return NextResponse.json({ is_premium: false });

  const { data: sub } = await supabase
    .from('subscribers')
    .select('tier, status, current_period_end')
    .eq('user_id', profile.id)
    .maybeSingle();

  const isPremium = sub?.tier === 'premium' && sub?.status === 'active';

  return NextResponse.json({
    is_premium: isPremium,
    current_period_end: sub?.current_period_end || null,
  });
}
