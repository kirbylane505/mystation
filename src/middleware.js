import { NextResponse } from 'next/server';

// Password protection DISABLED - site is now public
// Force redeploy: 2026-02-04
export function middleware(request) {
  // Allow all access - no password required
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
