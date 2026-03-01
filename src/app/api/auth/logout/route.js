/**
 * MYSTATION - Logout API Route
 * Signs out user from Supabase Auth and clears all session cookies
 */

import { NextResponse } from 'next/server';
import { signOut } from '@/lib/supabase';

export async function POST() {
  try {
    const { error } = await signOut();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Clear all MyStation session cookies
    const cookiesToClear = ['mystation-auth', 'mystation-sub', 'mystation-trial'];
    for (const name of cookiesToClear) {
      response.cookies.set(name, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
