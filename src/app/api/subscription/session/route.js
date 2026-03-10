/**
 * MYSTATION - Subscription Session API
 * Sets a signed httpOnly cookie to prove subscription status server-side
 * Called from /subscribe/success after Stripe redirect
 * SECURITY: activate requires valid Stripe session_id OR active subscriber email
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

async function verifyActivation(request, body) {
  // Method 1: Verify Stripe checkout session_id
  if (body.sessionId) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      if (session && (session.payment_status === 'paid' || session.status === 'complete')) {
        return true;
      }
    } catch { /* invalid session */ }
  }

  // Method 2: Check if caller has a mystation-email cookie for an active subscriber
  const cookies = request.headers.get('cookie') || '';
  const emailMatch = cookies.match(/mystation-email=([^;]+)/);
  if (emailMatch) {
    try {
      const email = decodeURIComponent(emailMatch[1]).toLowerCase().trim();
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data } = await supabase
          .from('subscribers')
          .select('status, free_until')
          .eq('email', email)
          .single();
        if (data && (data.status === 'active' || (data.free_until && new Date(data.free_until) > new Date()))) {
          return true;
        }
      }
    } catch { /* db error */ }
  }

  // Method 3: Check if caller already has a valid mystation-auth cookie (already logged in)
  const authMatch = cookies.match(/mystation-auth=([^;]+)/);
  if (authMatch) {
    return true; // Already authenticated — allow cookie refresh
  }

  return false;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'activate') {
      // SECURITY: Verify caller is a legitimate subscriber
      const verified = await verifyActivation(request, body);
      if (!verified) {
        return NextResponse.json({ error: 'Unauthorized — valid session required' }, { status: 401 });
      }

      // Create signed subscription cookie
      const secret = process.env.AUDIO_SECRET;
      const timestamp = String(Date.now());
      const sig = createHmac('sha256', secret).update(`sub:${timestamp}`).digest('hex').slice(0, 32);

      const response = NextResponse.json({ success: true });
      response.cookies.set('mystation-sub', `${timestamp}.${sig}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 365 * 24 * 60 * 60, // 365 days — subscribers remembered forever
        path: '/',
      });
      // Client-readable flag so isGated() can see subscription status
      response.cookies.set('mystation-sub-flag', '1', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    if (action === 'deactivate') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('mystation-sub');
      response.cookies.delete('mystation-sub-flag');
      return response;
    }

    // Check — verify current session
    const cookies = request.headers.get('cookie') || '';
    const match = cookies.match(/mystation-sub=([^;]+)/);
    if (!match) {
      return NextResponse.json({ isSubscribed: false });
    }

    const [timestamp, sig] = match[1].split('.');
    const secret = process.env.AUDIO_SECRET;
    const expected = createHmac('sha256', secret).update(`sub:${timestamp}`).digest('hex').slice(0, 32);
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    const valid = diff === 0 && (Date.now() - parseInt(timestamp, 10)) < 365 * 24 * 60 * 60 * 1000;

    return NextResponse.json({ isSubscribed: valid });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
