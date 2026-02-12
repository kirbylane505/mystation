/**
 * MYSTATION - Subscription Session API
 * Sets a signed httpOnly cookie to prove subscription status server-side
 * Called from /subscribe/success after Stripe redirect
 */

import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

export async function POST(request) {
  try {
    const { action } = await request.json();

    if (action === 'activate') {
      // Create signed subscription cookie
      const secret = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';
      const timestamp = String(Date.now());
      const sig = createHmac('sha256', secret).update(`sub:${timestamp}`).digest('hex').slice(0, 32);

      const response = NextResponse.json({ success: true });
      response.cookies.set('mystation-sub', `${timestamp}.${sig}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      return response;
    }

    if (action === 'deactivate') {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('mystation-sub');
      return response;
    }

    // Check — verify current session
    const cookies = request.headers.get('cookie') || '';
    const match = cookies.match(/mystation-sub=([^;]+)/);
    if (!match) {
      return NextResponse.json({ isSubscribed: false });
    }

    const [timestamp, sig] = match[1].split('.');
    const secret = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';
    const expected = createHmac('sha256', secret).update(`sub:${timestamp}`).digest('hex').slice(0, 32);
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    const valid = diff === 0 && (Date.now() - parseInt(timestamp, 10)) < 30 * 24 * 60 * 60 * 1000;

    return NextResponse.json({ isSubscribed: valid });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
