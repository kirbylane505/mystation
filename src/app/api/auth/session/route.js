/**
 * MYSTATION - Session API Route
 * Returns current authenticated user with subscription status.
 * Reads identity from either mystation-email (legacy) or mystation-phone (OTP).
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const emailCookie = cookieStore.get('mystation-email');
    const phoneCookie = cookieStore.get('mystation-phone');
    const authCookie = cookieStore.get('mystation-auth');
    const subCookie = cookieStore.get('mystation-sub');

    const email = emailCookie?.value?.trim().toLowerCase() || null;
    const phone = phoneCookie?.value?.trim() || null;

    // Neither identity cookie = not logged in
    if (!email && !phone) {
      return NextResponse.json({ user: null });
    }

    let isSubscribed = false;
    let tier = 'free';
    let resolvedEmail = email;

    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        let sub = null;

        if (email) {
          const { data } = await supabase
            .from('subscribers')
            .select('status, tier, free_until')
            .eq('email', email)
            .single();
          sub = data;
        } else if (phone) {
          // Phone-only users: look up profile by phone → user_id → subscribers
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('phone', phone)
            .single();
          if (profile) {
            resolvedEmail = profile.email || null;
            const { data } = await supabase
              .from('subscribers')
              .select('status, tier, free_until')
              .eq('user_id', profile.id)
              .single();
            sub = data;
          }
        }

        if (sub) {
          if (sub.status === 'active') {
            isSubscribed = true;
            tier = sub.tier || 'premium';
          } else if (sub.free_until && new Date(sub.free_until) > new Date()) {
            isSubscribed = true;
            tier = sub.tier || 'free';
          }
        }
      }
    } catch {}

    const user = {
      email: resolvedEmail,
      phone,
      name: resolvedEmail ? resolvedEmail.split('@')[0] : phone,
      tier,
      isSubscribed,
      isLoggedIn: !!authCookie?.value,
    };

    // Refresh sub cookie if subscribed but missing
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
