/**
 * MYSTATION - Login API Route
 * Authenticates user with Supabase Auth + sets mystation-auth cookie
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { signIn } from '@/lib/supabase';
import { createRateLimiter, isValidEmail } from '@/lib/rateLimit';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const loginLimiter = createRateLimiter('login', 10, 900000); // 10 per IP per 15 min

function createAuthCookie(email) {
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  const sig = createHmac('sha256', AUDIO_SECRET).update(`auth:${payload}`).digest('hex').slice(0, 32);
  return `${payload}:${sig}`;
}

export async function POST(request) {
  const limited = loginLimiter(request);
  if (limited) return limited;

  try {
    const { email, password } = await request.json();

    if (!email || !password || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email and password required' },
        { status: 400 }
      );
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    // Check subscription status
    let isSubscribed = false;
    let tier = 'free';
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: sub } = await supabase
          .from('subscribers')
          .select('status, tier, free_until')
          .eq('email', email.trim().toLowerCase())
          .single();
        if (sub) {
          if (sub.status === 'active') {
            isSubscribed = true;
            tier = sub.tier || 'supporter';
          } else if (sub.free_until && new Date(sub.free_until) > new Date()) {
            isSubscribed = true;
            tier = sub.tier || 'free';
          }
        }
      }
    } catch {}

    // Format user data
    const cleanEmail = email.trim().toLowerCase();
    const user = data?.user ? {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
      tier,
      isSubscribed,
      joinedAt: data.user.created_at,
    } : null;

    const response = NextResponse.json({ success: true, user, isSubscribed, tier });

    // Set auth cookie (365 days)
    response.cookies.set('mystation-auth', createAuthCookie(cleanEmail), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    // Set persistent email cookie — never forget who they are (365 days)
    response.cookies.set('mystation-email', cleanEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    // Set sub cookie if subscribed (365 days)
    if (isSubscribed) {
      const subTs = Date.now();
      const subSig = createHmac('sha256', AUDIO_SECRET).update(`sub:${subTs}`).digest('hex').slice(0, 32);
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
    }

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
