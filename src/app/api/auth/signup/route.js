/**
 * MYSTATION - Signup API Route
 * Creates new user account with Supabase Auth
 */

import { NextResponse } from 'next/server';
import { signUp } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    const { data, error } = await signUp(email, password, name);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Format user data
    const user = data?.user ? {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || name || email.split('@')[0],
      tier: 'free',
      joinedAt: data.user.created_at,
    } : null;

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
