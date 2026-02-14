/**
 * MYSTATION - Email Capture API
 * Stores emails in Supabase for marketing
 * Also credits referrer if a ref cookie is present (Street Team engine)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateReferralCode } from '@/lib/referral';

export async function POST(request) {
  try {
    const { email, source } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Store in Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/email_subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email: cleanEmail,
          source: source || 'popup',
          discount_code: 'WELCOME10',
          subscribed_at: new Date().toISOString(),
        }),
      });
    }

    // ─── STREET TEAM REFERRAL TRACKING ───
    // Check for referral cookie — if present, credit the referrer
    try {
      const cookieStore = await cookies();
      const refCookie = cookieStore.get('mystation_ref');

      if (refCookie?.value && supabaseUrl && supabaseKey) {
        const referrerCode = refCookie.value;

        // Generate a code for the new referred user
        const newUserCode = generateReferralCode();

        // Insert referral record — credit the referrer
        const referralResp = await fetch(`${supabaseUrl}/rest/v1/referrals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            referrer_code: referrerCode,
            referred_email: cleanEmail,
            referrer_email: cleanEmail,
            code: newUserCode,
          }),
        });

        if (!referralResp.ok) {
          // Table may not exist yet — log but don't fail the request
          console.warn('Referral tracking insert failed (table may not exist):', await referralResp.text());
        }

        // Clear the ref cookie after crediting — one-time use
        const response = NextResponse.json({ success: true, referralCode: newUserCode });

        response.cookies.set('mystation_ref', '', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0, // Immediately expire
        });

        // Still send welcome email before returning
        await sendWelcomeEmail(cleanEmail);

        return response;
      }
    } catch (refErr) {
      // Referral tracking is non-critical — don't block email capture
      console.error('Referral tracking error:', refErr);
    }

    // Also send welcome email via Resend if configured
    await sendWelcomeEmail(cleanEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email capture error:', error);
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
  }
}

/**
 * Send welcome email with discount code via Resend
 */
async function sendWelcomeEmail(email) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'MyStation <hello@mystationlive.com>',
        to: email,
        subject: 'Welcome to MyStation! Here\'s your 10% off code',
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0f1e; color: white; padding: 40px; border-radius: 16px;">
            <h1 style="text-align: center; font-size: 28px; margin-bottom: 8px;">Welcome to MyStation!</h1>
            <p style="text-align: center; color: #9ca3af; margin-bottom: 32px;">Thanks for joining the fam. Here's your exclusive discount.</p>

            <div style="background: linear-gradient(135deg, #22c55e22, #10b98122); border: 2px dashed #22c55e88; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">Your 10% off code:</p>
              <p style="font-size: 32px; font-weight: 900; color: #22c55e; letter-spacing: 4px;">WELCOME10</p>
            </div>

            <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-bottom: 24px;">Use this code at checkout on any merch purchase at mystationlive.com/merch</p>

            <div style="text-align: center;">
              <a href="https://mystationlive.com/merch" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #10b981); color: white; font-weight: bold; padding: 14px 32px; border-radius: 12px; text-decoration: none;">Shop Merch Now</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 32px;">Mike Page Foundation | All proceeds support youth music programs</p>
          </div>
        `,
      }),
    });
  } catch (emailErr) {
    // Don't fail the whole request if email fails
    console.error('Welcome email failed:', emailErr);
  }
}
