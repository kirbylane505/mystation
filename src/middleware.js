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

    // Skip auth for static assets, whitelisted IPs, admin routes (handled above), and API health checks
    if (!isWhitelisted && !pathname.startsWith('/_next') && !pathname.startsWith('/favicon') && !pathname.startsWith('/admin')) {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        try {
          const encoded = authHeader.split(' ')[1] || '';
          const decoded = atob(encoded);
          const pass = decoded.substring(decoded.indexOf(':') + 1);
          if (pass === sitePassword) {
            // Authorized — continue to rest of middleware
          } else {
            return new NextResponse('Invalid password', {
              status: 401,
              headers: { 'WWW-Authenticate': 'Basic realm="MyStation"' },
            });
          }
        } catch {
          return new NextResponse('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="MyStation"' },
          });
        }
      } else {
        return new NextResponse('Site is under construction. Enter password to access.', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="MyStation"' },
        });
      }
    }
  }

  // Vault protection — server-side block, only accessible with secret key
  if (pathname.startsWith('/vault') && !pathname.startsWith('/api/vault')) {
    const vaultSecret = process.env.VAULT_SECRET;
    if (!vaultSecret) {
      // No secret configured — vault locked
      return NextResponse.redirect(new URL('/', request.url));
    }

    const vaultKey = searchParams.get('key');
    const vaultCookie = request.cookies.get('vault_access')?.value;

    if (vaultKey === vaultSecret) {
      // Valid key — set cookie so they don't need the key every time
      const res = NextResponse.redirect(new URL('/vault', request.url));
      res.cookies.set('vault_access', vaultSecret, { httpOnly: true, secure: true, maxAge: 60 * 60 * 24, sameSite: 'strict' }); // 24h
      return res;
    }

    if (vaultCookie !== vaultSecret) {
      // No access — redirect to home
      return NextResponse.redirect(new URL('/', request.url));
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
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy - prevent XSS and data injection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co https://vercel.live wss:",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
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
