/**
 * MYSTATION — Admin Fan Message API
 * Send a personal email to a fan from Mike Page / MyStation
 * Protected by admin key
 */

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { timingSafeEqual } from 'crypto';

function verifyAdminKey(key) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key) return false;
  try {
    return timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
  } catch { return false; }
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'MyStation <notifications@mystationlive.com>';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, subject, message, key } = body;

    // Admin auth (timing-safe)
    if (!verifyAdminKey(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Missing email, subject, or message' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Convert newlines in message to <br> for HTML
    const htmlMessage = message.replace(/\n/g, '<br/>');

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 0; border-radius: 16px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0a0e1a 100%); padding: 32px; text-align: center; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
            <h1 style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">MYSTATION</h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 2px;">A Message From Mike Page</p>
          </div>

          <div style="padding: 32px;">
            <div style="background: #1a1f36; padding: 24px; border-radius: 12px; border-left: 4px solid #3b82f6; margin-bottom: 24px;">
              <p style="color: #e2e8f0; font-size: 15px; line-height: 1.7; margin: 0;">${htmlMessage}</p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <p style="color: #3b82f6; font-size: 14px; font-weight: 700; margin: 0;">
                &mdash; Mike Page
              </p>
              <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 4px 0 0;">
                Founder, MyStation &amp; IDMG
              </p>
            </div>

            <div style="text-align: center;">
              <a href="https://mystationlive.com" style="display: inline-block; background: #3b82f6; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">Visit MyStation</a>
            </div>
          </div>

          <div style="text-align: center; padding: 16px 32px 24px; border-top: 1px solid #2a2f46;">
            <p style="color: #475569; font-size: 11px; margin: 0;">MyStation &mdash; mystationlive.com</p>
            <p style="color: #475569; font-size: 11px; margin: 4px 0 0;">Independent music. Built for the culture.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Fan message send error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log('Fan message sent to:', email, 'emailId:', data?.id);
    return NextResponse.json({ success: true, emailId: data?.id });
  } catch (err) {
    console.error('Admin fan message error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
