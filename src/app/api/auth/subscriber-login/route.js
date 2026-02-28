/**
 * MYSTATION - Subscriber Email-Only Login
 * If you're a subscriber, just enter your email. No password needed.
 * Checks Supabase subscribers table — if active, logs you in immediately.
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createRateLimiter, isValidEmail } from '@/lib/rateLimit';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const loginLimiter = createRateLimiter('sub-login', 15, 900000); // 15 per IP per 15 min

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
    const { email } = await request.json();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Valid email required' },
        { status: 400 }
      );
    }

    // Check if they're an active subscriber in Supabase
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { data: sub } = await supabase
      .from('subscribers')
      .select('status, tier, free_until, email')
      .eq('email', cleanEmail)
      .single();

    if (!sub) {
      return NextResponse.json(
        { success: false, notFound: true, error: 'No subscription found for this email. Sign up to get started!' },
        { status: 404 }
      );
    }

    const isActive = sub.status === 'active' || (sub.free_until && new Date(sub.free_until) > new Date());

    if (!isActive) {
      return NextResponse.json(
        { success: false, expired: true, error: 'Your subscription has expired. Resubscribe to continue!' },
        { status: 403 }
      );
    }

    const tier = sub.tier || 'regular';
    const user = {
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      tier,
      isSubscribed: true,
      joinedAt: new Date().toISOString(),
    };

    const response = NextResponse.json({ success: true, user, isSubscribed: true, tier });

    // Set auth cookie (365 days)
    response.cookies.set('mystation-auth', createAuthCookie(cleanEmail), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    // Set persistent email cookie (365 days)
    response.cookies.set('mystation-email', cleanEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });

    // Set sub cookies (365 days)
    const subTs = Date.now();
    const subSig = createHmac('sha256', AUDIO_SECRET).update(`sub:${subTs}`).digest('hex').slice(0, 32);
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
  } catch (err) {
    console.error('Subscriber login error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    );
  }
}
