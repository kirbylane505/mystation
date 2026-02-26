/**
 * MYSTATION - Shared Rate Limiter
 * In-memory per-IP rate limiting with auto-cleanup
 */

import { timingSafeEqual } from 'crypto';

const stores = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [, store] of stores) {
    for (const [ip, record] of store) {
      if (now - record.firstAt > 3600000) store.delete(ip);
    }
  }
}, 300000);

/**
 * Create a rate limiter for a specific route
 * @param {string} name — unique name for this limiter
 * @param {number} maxRequests — max requests allowed in window
 * @param {number} windowMs — time window in milliseconds
 */
export function createRateLimiter(name, maxRequests, windowMs) {
  if (!stores.has(name)) stores.set(name, new Map());
  const store = stores.get(name);

  return function checkLimit(request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const now = Date.now();
    const record = store.get(ip);

    if (!record || now - record.firstAt > windowMs) {
      store.set(ip, { count: 1, firstAt: now });
      return null; // allowed
    }

    if (record.count >= maxRequests) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    record.count++;
    return null; // allowed
  };
}

/** Validate email format — strict regex */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Timing-safe admin key comparison */
export function verifyAdminKey(request) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const key = request.headers.get('x-admin-key');
  if (!key || key.length !== adminKey.length) return false;
  try {
    return timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
  } catch {
    return false;
  }
}
