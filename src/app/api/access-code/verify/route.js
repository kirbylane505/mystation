/**
 * MYSTATION - Friend Access Code Verification
 * Grants free unlimited access when valid code is entered
 */

import { NextResponse } from 'next/server';

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

    if (code.toUpperCase().trim() === validCode.toUpperCase()) {
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
