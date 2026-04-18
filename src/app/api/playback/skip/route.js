/**
 * MYSTATION - Skip counter gate
 * Grow mode: always allow. Enforce mode: premium/creator unlimited,
 * free tier subject to a per-hour skip cap (cap enforcement is a
 * month-7 TODO — this route is wired now so the client call site exists).
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isMonetizationEnforced, gateFor } from '@/lib/monetization';

export async function POST() {
  if (!isMonetizationEnforced()) {
    return NextResponse.json({ allowed: true, reason: 'grow_mode' });
  }

  const cookieStore = await cookies();
  const subFlag = cookieStore.get('mystation-sub-flag')?.value === '1';
  const userTier = subFlag ? 'premium' : 'free';

  const { allowed } = gateFor('unlimited_skips', userTier);
  if (allowed) return NextResponse.json({ allowed: true });

  // TODO month-7: per-user skip counter (Redis or daily_plays table)
  // enforcing 6/hour on free tier. For now: warn but allow.
  return NextResponse.json({ allowed: true, reason: 'counter_not_implemented' });
}
