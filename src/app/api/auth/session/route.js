/**
 * MYSTATION - Session API Route
 * Returns current authenticated user
 */

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase';

export async function GET() {
  try {
    const { user } = await getUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Format user data
    const formattedUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      tier: 'free',
      joinedAt: user.created_at,
    };

    return NextResponse.json({ user: formattedUser });
  } catch (err) {
    console.error('Session error:', err);
    return NextResponse.json({ user: null });
  }
}
