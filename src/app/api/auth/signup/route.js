/**
 * MYSTATION - Signup API Route
 * Creates new user account with Supabase Auth + sets mystation-auth cookie
 * First 26 signups get first month free (auto-subscribe)
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { signUp } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';

function createAuthCookie(email) {
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  const sig = createHmac('sha256', AUDIO_SECRET).update(`auth:${payload}`).digest('hex').slice(0, 32);
  return `${payload}:${sig}`;
}

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

    const cleanEmail = email.trim().toLowerCase();

    // Format user data
    const user = data?.user ? {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || name || cleanEmail.split('@')[0],
      tier: 'free',
      joinedAt: data.user.created_at,
    } : null;

    // Check if this user qualifies for first-26 free month
    let isFreeSlot = false;
    let subscriberNumber = 0;
    let isSubscribed = false;

    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // Count existing subscribers
        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true });

        const currentCount = count || 0;

        if (currentCount < 26) {
          // Free slot available — auto-subscribe
          const freeUntil = new Date();
          freeUntil.setDate(freeUntil.getDate() + 30);

          await supabase.from('subscribers').insert({
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0],
            status: 'active',
            tier: 'regular',
            is_free_trial: true,
            free_until: freeUntil.toISOString(),
            created_at: new Date().toISOString(),
          });

          isFreeSlot = true;
          subscriberNumber = currentCount + 1;
          isSubscribed = true;
          if (user) {
            user.tier = 'regular';
            user.isSubscribed = true;
          }
        }
      }
    } catch (err) {
      console.error('First-26 check error:', err);
    }

    // Send welcome email with password (fire-and-forget)
    sendWelcomeEmail({
      customerName: name || cleanEmail.split('@')[0],
      customerEmail: cleanEmail,
      password,
    }).catch(err => console.error('Welcome email failed:', err));

    const response = NextResponse.json({
      success: true,
      user,
      isFreeSlot,
      subscriberNumber,
      isSubscribed,
      needsPayment: !isFreeSlot,
      freeSignupSlots: isFreeSlot ? Math.max(0, 26 - subscriberNumber) : 0,
    });

    // Set auth cookie
    response.cookies.set('mystation-auth', createAuthCookie(cleanEmail), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set sub cookie if free slot
    if (isSubscribed) {
      const subTs = Date.now();
      const subSig = createHmac('sha256', AUDIO_SECRET).update(`sub:${subTs}`).digest('hex').slice(0, 32);
      response.cookies.set('mystation-sub', `${subTs}.${subSig}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
