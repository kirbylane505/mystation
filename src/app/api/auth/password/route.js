import { NextResponse } from 'next/server';

// Simple in-memory rate limiter — resets on cold start (fine for serverless)
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now - record.first > WINDOW_MS) {
    attempts.set(ip, { first: now, count: 1 });
    return false;
  }
  record.count++;
  if (record.count > MAX_ATTEMPTS) return true;
  return false;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    const sitePassword = process.env.SITE_PASSWORD;

    if (!sitePassword || password !== sitePassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('mystation_access', 'granted', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true, // middleware can read httpOnly cookies
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
