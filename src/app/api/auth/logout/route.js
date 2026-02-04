/**
 * MYSTATION - Logout API Route
 * Signs out user from Supabase Auth
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
