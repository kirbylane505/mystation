/**
 * MYSTATION - Vault Access Verify
 * Checks if the user has vault access via subscription, friend code, or vault cookie
 */

import { NextResponse } from 'next/server';

export async function GET(request) {
  // Check subscriber cookie
  const subCookie = request.cookies.get('mystation-sub');
  if (subCookie?.value) {
    return NextResponse.json({ valid: true, reason: 'subscriber' });
  }

  // Check friend/access code cookie
  const friendCookie = request.cookies.get('mystation-friend');
  if (friendCookie?.value) {
    return NextResponse.json({ valid: true, reason: 'friend' });
  }

  // Check vault PIN cookie
  const vaultCookie = request.cookies.get('mystation_vault');
  if (vaultCookie?.value) {
    return NextResponse.json({ valid: true, reason: 'vault' });
  }

  return NextResponse.json({ valid: false });
}
