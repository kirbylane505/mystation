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

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  // Admin analytics access — allow with correct key, bypass all other gates
  if (pathname.startsWith('/admin/analytics')) {
    const adminKey = searchParams.get('key');
    if (adminKey === 'mpf2026' || adminKey === process.env.ADMIN_KEY) {
      // Authorized admin — skip password gate, proceed to security headers
    } else {
      // No valid key — redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Block all other /admin routes — redirect to home
  else if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const sitePassword = process.env.SITE_PASSWORD;

  // Password gate — if SITE_PASSWORD env var is set, require basic auth
  if (sitePassword) {
    // Whitelisted IPs bypass password (owner's machines)
    const visitorIp = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const whitelist = (process.env.SITE_WHITELIST_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
    const isWhitelisted = whitelist.includes(visitorIp);

    // Allow social media / search crawlers through for OG link previews
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    const isCrawler = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|slackbot|telegrambot|applebot|googlebot|bingbot|discordbot|pinterest|snapchat|redditbot|skypeuripreview/i.test(ua);

    // Skip auth for static assets, whitelisted IPs, crawlers, admin routes, password page, and API routes
    if (!isWhitelisted && !isCrawler && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon') && !pathname.startsWith('/admin') && !pathname.startsWith('/api/') && pathname !== '/password') {
      // Check for access cookie
      const accessCookie = request.cookies.get('mystation_access')?.value;
      if (accessCookie !== 'granted') {
        // Redirect to password page
        return NextResponse.redirect(new URL('/password', request.url));
      }
    }
  }

  // Vault — let users through to see the PIN lock screen
  // The vault page handles authentication client-side via /api/vault/auth
  // No middleware blocking needed — the page itself is the gate

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://vercel.live wss:",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com",
    "media-src 'self' blob: https: http:",
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|mp3|wav|m4a)).*)'],
};
