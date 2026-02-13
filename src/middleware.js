import { NextResponse } from 'next/server';

/**
 * MYSTATION SECURITY MIDDLEWARE
 * Protects against common web attacks + token-gated audio streaming
 */

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';
if (!process.env.AUDIO_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: AUDIO_SECRET env var is not set');
}

// Routes that require subscription after trial expires
const LOCKED_ROUTES = [
  '/music', '/search', '/playlists', '/fan-zone', '/lounge',
  '/make-a-hit', '/news', '/rewards', '/artists', '/station', '/vault',
];

// Rate limiting store (in-memory, resets on deploy)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // 100 requests per minute

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Verify audio token using Web Crypto API (Edge-compatible HMAC-SHA256)
async function verifyAudioToken(token, pathname) {
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const decoded = atob(base64 + pad);

    // Token format: audioFilePath:expires:signature
    const lastColon = decoded.lastIndexOf(':');
    const sig = decoded.slice(lastColon + 1);
    const rest = decoded.slice(0, lastColon);
    const secondLastColon = rest.lastIndexOf(':');
    const expires = rest.slice(secondLastColon + 1);
    const audioPath = rest.slice(0, secondLastColon);

    // Verify path matches and token not expired (decode %20 → spaces for comparison)
    if (audioPath !== decodeURIComponent(pathname)) return false;
    if (Date.now() > parseInt(expires)) return false;

    // Verify HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(AUDIO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${audioPath}:${expires}`));
    const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    // Timing-safe comparison to prevent timing attacks
    const expected = hex.slice(0, 32);
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Admin analytics access — header-based auth only (page uses client-side fetch with header)
  if (pathname.startsWith('/admin/analytics')) {
    const adminKey = request.headers.get('x-admin-key');
    if (process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY) {
      // Authorized admin — skip password gate, proceed to security headers
    } else if (!pathname.startsWith('/api/')) {
      // Page request without key — allow page load (auth happens client-side via API)
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Block all other /admin routes — redirect to home
  else if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ─── AUDIO FILE PROTECTION ───
  // Token-gated: valid signed token = serve from CDN, no token = 403
  if (pathname.match(/\.(mp3|wav|m4a|flac|ogg|aac)$/i)) {
    const token = searchParams.get('_t');
    if (token && await verifyAudioToken(token, pathname)) {
      // Valid token — serve static file with anti-download headers
      const response = NextResponse.next();
      response.headers.set('Content-Disposition', 'inline');
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
      response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
      return response;
    }
    return new NextResponse('Access Denied', { status: 403 });
  }

  // ─── PAGE ACCESS GATING ───
  // Check if this is a locked route that requires active trial or subscription
  const isLockedRoute = LOCKED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  if (isLockedRoute) {
    const cookies = request.headers.get('cookie') || '';

    // 1. Check subscription cookie
    let hasAccess = false;
    const subMatch = cookies.match(/mystation-sub=([^;]+)/);
    if (subMatch) {
      try {
        const [ts, sig] = subMatch[1].split('.');
        if (ts && sig) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw', encoder.encode(AUDIO_SECRET),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
          );
          const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`sub:${ts}`));
          const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
          const expected = hex.slice(0, 32);
          if (expected.length === sig.length) {
            let diff = 0;
            for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
            if (diff === 0 && (Date.now() - parseInt(ts, 10)) < 30 * 24 * 60 * 60 * 1000) {
              hasAccess = true;
            }
          }
        }
      } catch {}
    }

    // 2. Check trial cookie (email:timestamp:hmac) — must be <24hr
    if (!hasAccess) {
      const trialMatch = cookies.match(/mystation-trial=([^;]+)/);
      if (trialMatch) {
        try {
          const decoded = decodeURIComponent(trialMatch[1]);
          const parts = decoded.split(':');
          if (parts.length >= 3) {
            const sig = parts[parts.length - 1];
            const timestamp = parts[parts.length - 2];
            const email = parts.slice(0, parts.length - 2).join(':');
            const payload = `${email}:${timestamp}`;

            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
              'raw', encoder.encode(AUDIO_SECRET),
              { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
            );
            const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`trial:${payload}`));
            const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
            const expected = hex.slice(0, 32);
            if (expected.length === sig.length) {
              let diff = 0;
              for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
              const ts = parseInt(timestamp, 10);
              // Valid signature AND within 24hr window
              if (diff === 0 && !isNaN(ts) && (Date.now() - ts) < 24 * 60 * 60 * 1000) {
                hasAccess = true;
              }
            }
          }
        } catch {}
      }
    }

    // No valid access — redirect to home with locked flag
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/?locked=1', request.url));
    }
  }

  const response = NextResponse.next();
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Security Headers
  const headers = response.headers;

  // Prevent clickjacking - don't allow site in iframes
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy - don't leak full URLs
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy - restrict browser features
  headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

  // Content Security Policy - prevent XSS and data injection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live https://www.youtube.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://vercel.live https://p.scdn.co wss:",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://buy.stripe.com",
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  // Strict Transport Security - force HTTPS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)'],
};
