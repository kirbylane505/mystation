/**
 * MYSTATION - Vault Auth API
 * Server-side PIN verification — PIN never exposed to client
 */

import { NextResponse } from 'next/server';

// Rate limit vault attempts per IP
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Check lockout
  const record = attempts.get(ip);
  if (record && record.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - record.lastAttempt;
    if (elapsed < LOCKOUT_MS) {
      const remainingMin = Math.ceil((LOCKOUT_MS - elapsed) / 60000);
      return NextResponse.json(
        { success: false, error: `Too many attempts. Try again in ${remainingMin} minutes.` },
        { status: 429 }
      );
    }
    // Lockout expired, reset
    attempts.delete(ip);
  }

  try {
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN required' },
        { status: 400 }
      );
    }

    const vaultPin = process.env.VAULT_PIN;
    if (!vaultPin) {
      return NextResponse.json(
        { success: false, error: 'Vault not configured' },
        { status: 503 }
      );
    }

    if (pin === vaultPin) {
      // Success — clear attempts
      attempts.delete(ip);
      return NextResponse.json({ success: true });
    }

    // Wrong PIN — track attempts
    const current = attempts.get(ip) || { count: 0, lastAttempt: 0 };
    current.count++;
    current.lastAttempt = Date.now();
    attempts.set(ip, current);

    const remaining = MAX_ATTEMPTS - current.count;
    return NextResponse.json(
      { success: false, error: remaining > 0 ? `Wrong PIN. ${remaining} attempts remaining.` : 'Too many attempts. Locked for 15 minutes.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
