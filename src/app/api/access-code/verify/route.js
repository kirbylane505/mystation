/**
 * MYSTATION - Friend Access Code Verification
 * Grants free unlimited access when valid code is entered
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code required' },
        { status: 400 }
      );
    }

    // Access code from env — no hardcoded fallback
    const validCode = process.env.FRIEND_ACCESS_CODE;
    if (!validCode) {
      return NextResponse.json(
        { success: false, error: 'Access codes not configured' },
        { status: 503 }
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const inputNorm = code.toUpperCase().trim();
    const expectedNorm = validCode.toUpperCase().trim();
    const isValid = inputNorm.length === expectedNorm.length &&
      timingSafeEqual(Buffer.from(inputNorm), Buffer.from(expectedNorm));

    if (isValid) {
      return NextResponse.json({ success: true, message: 'Welcome to the family!' });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid code' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
