/**
 * MYSTATION - Referral Landing Page
 * When someone visits mystationlive.com/ref/ABC123:
 * 1. Sets a 'ref' cookie with the referral code (30 day expiry)
 * 2. Redirects to homepage
 * The cookie gets picked up on email capture to credit the referrer.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ReferralLandingPage({ params }) {
  const { code } = await params;

  if (code && code.length >= 4 && code.length <= 10) {
    // Set referral cookie — 30 day expiry
    const cookieStore = await cookies();
    cookieStore.set('mystation_ref', code.toUpperCase(), {
      httpOnly: false, // Readable by client JS for ReferralDetector
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Redirect to homepage with ref param so ReferralDetector can show the banner
  redirect(`/?ref=${encodeURIComponent(code)}`);
}

export const metadata = {
  title: 'Join MyStation',
  description: 'You have been invited to MyStation by a friend. Stream music, shop merch, and join the IDMG movement.',
};
