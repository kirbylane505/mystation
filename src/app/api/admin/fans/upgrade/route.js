/**
 * MYSTATION — Admin Fan Tier Upgrade API
 * Upgrade a fan's subscription tier and send congratulations email
 * Protected by admin key
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
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

const VALID_TIERS = ['listener', 'supporter', 'premium', 'diamond', 'vip'];

const TIER_CONFIG = {
  listener: {
    label: 'Listener',
    color: '#94a3b8',
    price: 'Free',
    benefits: [
      '4 free songs per session',
      'Access to the Kickback Lounge',
      'Community access',
    ],
  },
  supporter: {
    label: 'Supporter',
    color: '#3b82f6',
    price: '$4.99/mo',
    benefits: [
      'Unlimited streaming',
      'Full music library access',
      'Comment on tracks',
      'First month FREE',
    ],
  },
  premium: {
    label: 'Premium',
    color: '#a855f7',
    price: '$9.99/mo',
    benefits: [
      'Everything in Supporter',
      'Vault access (exclusive tracks)',
      'Priority support',
      'Early access to new releases',
      'First month FREE',
    ],
  },
  diamond: {
    label: 'Diamond',
    color: '#f59e0b',
    price: '$14.99/mo',
    benefits: [
      'Everything in Premium',
      'VIP event access',
      'Direct line to Mike Page',
      'Exclusive merch drops',
      'Name in credits',
      'First month FREE',
    ],
  },
  vip: {
    label: 'VIP',
    color: '#ef4444',
    price: 'Invite Only',
    benefits: [
      'Everything in Diamond',
      'Personal shoutouts',
      'Studio session invites',
      'Backstage at LOTL',
      'Lifetime access',
      'Custom MyStation profile',
    ],
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, newTier, key } = body;

    // Admin auth (timing-safe)
    if (!verifyAdminKey(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email || !newTier) {
      return NextResponse.json({ error: 'Missing email or newTier' }, { status: 400 });
    }

    if (!VALID_TIERS.includes(newTier)) {
      return NextResponse.json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Check if subscriber exists
    const { data: existing, error: lookupError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1)
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Subscriber lookup error:', lookupError);
      return NextResponse.json({ error: 'Database lookup failed' }, { status: 500 });
    }

    const tierConfig = TIER_CONFIG[newTier];
    const now = new Date().toISOString();

    if (existing) {
      // Update existing subscriber
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({
          tier: newTier,
          status: newTier === 'listener' ? existing.status : 'active',
          updated_at: now,
        })
        .eq('email', email.toLowerCase());

      if (updateError) {
        console.error('Tier update error:', updateError);
        return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
      }
    } else {
      // Create new subscriber record with tier
      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({
          email: email.toLowerCase(),
          tier: newTier,
          status: newTier === 'listener' ? 'free' : 'active',
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error('Subscriber insert error:', insertError);
        return NextResponse.json({ error: 'Failed to create subscriber record' }, { status: 500 });
      }
    }

    // Send congratulations email
    if (resend && newTier !== 'listener') {
      const benefitsList = tierConfig.benefits
        .map(b => `<li style="margin: 8px 0; color: #e2e8f0; font-size: 14px;">${b}</li>`)
        .join('');

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `You've been upgraded to ${tierConfig.label}!`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0e1a; color: #fff; padding: 0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1a1f36 0%, #0a0e1a 50%, #1a1f36 100%); padding: 40px 32px; text-align: center; border-bottom: 2px solid ${tierConfig.color};">
                <p style="color: ${tierConfig.color}; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px;">Tier Upgrade</p>
                <h1 style="color: #fff; margin: 0; font-size: 32px; font-weight: 900;">${tierConfig.label}</h1>
                <p style="color: ${tierConfig.color}; font-size: 16px; font-weight: 600; margin: 8px 0 0;">${tierConfig.price}</p>
              </div>

              <div style="padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0;">
                    Your loyalty hasn't gone unnoticed. You've been personally upgraded by Mike Page.
                  </p>
                </div>

                <div style="background: #1a1f36; padding: 24px; border-radius: 12px; border: 1px solid ${tierConfig.color}33; margin-bottom: 24px;">
                  <h3 style="color: ${tierConfig.color}; margin: 0 0 16px; font-size: 16px;">Your ${tierConfig.label} Benefits</h3>
                  <ul style="margin: 0; padding: 0 0 0 20px;">
                    ${benefitsList}
                  </ul>
                </div>

                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="https://mystationlive.com/music" style="display: inline-block; background: ${tierConfig.color}; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">Start Streaming</a>
                </div>

                <div style="text-align: center;">
                  <p style="color: #f59e0b; font-size: 14px; font-style: italic; margin: 0;">Independence lives in you.</p>
                  <p style="color: rgba(255,255,255,0.3); font-size: 12px; margin: 8px 0 0;">&mdash; Mike Page, Founder</p>
                </div>
              </div>

              <div style="text-align: center; padding: 16px 32px 24px; border-top: 1px solid #2a2f46;">
                <p style="color: #475569; font-size: 11px; margin: 0;">MyStation &mdash; mystationlive.com</p>
                <p style="color: #475569; font-size: 11px; margin: 4px 0 0;">Every stream supports the Mike Page Foundation 501(c)(3)</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Upgrade email failed (non-blocking):', emailErr);
        // Non-blocking — tier was still updated
      }
    }

    console.log('Fan tier upgraded:', email, '→', newTier);
    return NextResponse.json({ success: true, tier: newTier, label: tierConfig.label });
  } catch (err) {
    console.error('Admin fan upgrade error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
