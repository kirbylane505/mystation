/**
 * MYSTATION - Vault Session Verify
 * Checks if the user has a valid vault session cookie
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  const vaultSecret = process.env.VAULT_SECRET;
  if (!vaultSecret) {
    return NextResponse.json({ valid: false });
  }

  const cookie = request.cookies.get('mystation_vault');
  if (!cookie?.value) {
    return NextResponse.json({ valid: false });
  }

  try {
    const [timestamp, signature] = cookie.value.split('.');
    if (!timestamp || !signature) {
      return NextResponse.json({ valid: false });
    }

    // Verify signature
    const expected = crypto
      .createHmac('sha256', vaultSecret)
      .update(timestamp)
      .digest('hex')
      .slice(0, 32);

    if (signature !== expected) {
      return NextResponse.json({ valid: false });
    }

    // Check expiry (24 hours)
    const issued = parseInt(timestamp);
    const now = Date.now();
    if (now - issued > 24 * 60 * 60 * 1000) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
