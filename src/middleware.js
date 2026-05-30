import { NextResponse } from 'next/server';

/**
 * MYSTATION SECURITY MIDDLEWARE
 * Protects against common web attacks
 */

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

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ─── BLOCK SOURCE MAPS & SENSITIVE FILES ───
  if (pathname.endsWith('.map') || pathname.endsWith('.ts') || pathname.endsWith('.tsx') ||
      pathname === '/.env' || pathname === '/.env.local' || pathname.startsWith('/.git')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Admin pages — allow through (each page handles its own auth client-side)
  if (pathname.startsWith('/admin/analytics') || pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/merch-orders') || pathname.startsWith('/admin/check-in') || pathname.startsWith('/admin/listeners') || pathname.startsWith('/admin/fans') || pathname.startsWith('/admin/quickplay')) {
    // Allow page load — auth happens client-side via admin key
  }

  // Block unknown /admin routes — redirect to home
  else if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ─── PAGE ACCESS GATING ───
  // Locked routes are handled client-side by EmailGate + AccessGuard components.
  // Middleware only protects audio files (above) — pages always render so the
  // client-side overlays can show the email gate or subscribe prompt.

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
  headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');

  // Content Security Policy - prevent XSS and data injection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live https://www.youtube.com https://us-assets.i.posthog.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://plausible.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://vercel.live https://p.scdn.co https://us.i.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://analytics.google.com https://connect.facebook.net https://plausible.io wss:",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com",
    "media-src 'self' data: blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://buy.stripe.com",
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  // Strict Transport Security - force HTTPS with preload
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Remove server identity headers
  headers.delete('X-Powered-By');
  headers.delete('Server');

  // Prevent caching of HTML pages (always serve fresh)
  if (!pathname.startsWith('/api/') && !pathname.match(/\.(js|css|png|jpg|svg|ico|woff2?)$/)) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }

  // Cross-Origin policies — prevent embedding and data leaks
  // NOTE: same-origin-allow-popups needed for Stripe checkout and iOS Safari navigation
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)'],
};
