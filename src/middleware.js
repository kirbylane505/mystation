import { NextResponse } from 'next/server';

// Password protection DISABLED - site is now public
export function middleware(request) {
  // Allow all access - no password required
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
