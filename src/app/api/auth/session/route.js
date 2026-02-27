/**
 * MYSTATION - Session API Route
 * Returns current authenticated user with subscription status
 * Uses httpOnly cookies to identify user — never forgets subscribers
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const emailCookie = cookieStore.get('mystation-email');
    const authCookie = cookieStore.get('mystation-auth');
    const subCookie = cookieStore.get('mystation-sub');

    // No email cookie = not logged in
    if (!emailCookie?.value) {
      return NextResponse.json({ user: null });
    }

    const email = emailCookie.value.trim().toLowerCase();

    // Check subscription status from database
    let isSubscribed = false;
    let tier = 'free';
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: sub } = await supabase
          .from('subscribers')
          .select('status, tier, free_until')
          .eq('email', email)
          .single();
        if (sub) {
          if (sub.status === 'active') {
            isSubscribed = true;
            tier = sub.tier || 'regular';
          } else if (sub.free_until && new Date(sub.free_until) > new Date()) {
            isSubscribed = true;
            tier = sub.tier || 'free';
          }
        }
      }
    } catch {}

    const user = {
      email,
      name: email.split('@')[0],
      tier,
      isSubscribed,
      isLoggedIn: !!authCookie?.value,
    };

    // If subscribed but missing sub cookie, refresh it
    if (isSubscribed && !subCookie?.value) {
      const { createHmac } = await import('crypto');
      const AUDIO_SECRET = process.env.AUDIO_SECRET;
      if (AUDIO_SECRET) {
        const subTs = Date.now();
        const subSig = createHmac('sha256', AUDIO_SECRET).update(`sub:${subTs}`).digest('hex').slice(0, 32);
        const response = NextResponse.json({ user });
        response.cookies.set('mystation-sub', `${subTs}.${subSig}`, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 365 * 24 * 60 * 60,
        });
        // Client-readable flag so isGated() can see subscription status
        response.cookies.set('mystation-sub-flag', '1', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 365 * 24 * 60 * 60,
        });
        return response;
      }
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Session error:', err);
    return NextResponse.json({ user: null });
  }
}
