/**
 * MYSTATION - Referral API
 * Online Street Team referral tracking engine
 *
 * POST — Create a referral entry (new user signs up via ref link)
 * GET  — Get referral stats for a code
 */

import { NextResponse } from 'next/server';
import { generateReferralCode, calculateTier } from '@/lib/referral';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Helper: make authenticated Supabase REST call
 */
async function supabaseRest(path, options = {}) {
  if (!supabaseUrl || !supabaseKey) {
    return { data: null, error: 'Supabase not configured' };
  }

  const url = `${supabaseUrl}/rest/v1/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Prefer': options.prefer || 'return=representation',
  };

  try {
    const resp = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Supabase REST error [${resp.status}]:`, text);
      return { data: null, error: text };
    }

    const data = await resp.json();
    return { data, error: null };
  } catch (err) {
    console.error('Supabase REST exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * POST /api/referral
 * Body: { referrerCode, email }
 * Creates referral record, generates new code for the referred user
 */
export async function POST(request) {
  try {
    const { referrerCode, email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if this email already has a referral code
    const { data: existing } = await supabaseRest(
      `referrals?referrer_email=eq.${encodeURIComponent(cleanEmail)}&limit=1`
    );

    if (existing && existing.length > 0) {
      // User already registered — return their existing code + stats
      const userCode = existing[0].code;
      const { data: referrals } = await supabaseRest(
        `referrals?referrer_code=eq.${encodeURIComponent(userCode)}&select=id`
      );
      const referralCount = referrals ? referrals.length : 0;
      const tierInfo = calculateTier(referralCount);

      return NextResponse.json({
        code: userCode,
        tier: tierInfo.tier,
        reward: tierInfo.reward,
        referralCount,
        existing: true,
      });
    }

    // Generate a unique code for this new user
    let newCode = generateReferralCode();

    // Ensure uniqueness (retry up to 5 times)
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: codeCheck } = await supabaseRest(
        `referrals?code=eq.${encodeURIComponent(newCode)}&limit=1`
      );
      if (!codeCheck || codeCheck.length === 0) break;
      newCode = generateReferralCode();
    }

    // Build the referral record
    const record = {
      code: newCode,
      referrer_email: cleanEmail,
      referrer_code: referrerCode || null,
      referred_email: null,
    };

    // If there was a referrer, also create the "referred by" link
    if (referrerCode) {
      record.referred_email = cleanEmail;
    }

    const { data: inserted, error } = await supabaseRest('referrals', {
      method: 'POST',
      body: record,
      prefer: 'return=representation',
    });

    if (error) {
      // Table might not exist yet — log and return graceful fallback
      console.error('Referral insert error (table may not exist):', error);
      return NextResponse.json({
        code: newCode,
        tier: 'Recruit',
        reward: 'Exclusive wallpaper',
        referralCount: 0,
        fallback: true,
      });
    }

    // If there was a referrer code, credit them by inserting a record
    if (referrerCode) {
      await supabaseRest('referrals', {
        method: 'POST',
        body: {
          referrer_code: referrerCode,
          referred_email: cleanEmail,
          referrer_email: referrerCode, // placeholder — will be the referrer's code
          code: `REF-${newCode}`, // tracking record, not a user code
        },
        prefer: 'return=minimal',
      });
    }

    return NextResponse.json({
      code: newCode,
      tier: 'Recruit',
      reward: 'Exclusive wallpaper',
      referralCount: 0,
    });
  } catch (err) {
    console.error('Referral POST error:', err);
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}

/**
 * GET /api/referral?code=ABC123
 * Returns referral stats and tier info for a code
 * Also supports ?leaderboard=true for top 10
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const leaderboard = searchParams.get('leaderboard');

    // Leaderboard mode — top 10 referrers
    if (leaderboard === 'true') {
      const { data: allReferrals } = await supabaseRest(
        'referrals?referred_email=not.is.null&select=referrer_code'
      );

      if (!allReferrals || allReferrals.length === 0) {
        return NextResponse.json({ leaderboard: [] });
      }

      // Count referrals per code
      const counts = {};
      for (const row of allReferrals) {
        if (row.referrer_code) {
          counts[row.referrer_code] = (counts[row.referrer_code] || 0) + 1;
        }
      }

      // Sort by count descending, take top 10
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([refCode, count], index) => ({
          rank: index + 1,
          code: refCode,
          referralCount: count,
          tier: calculateTier(count).tier,
        }));

      return NextResponse.json({ leaderboard: sorted });
    }

    // Single code lookup
    if (!code) {
      return NextResponse.json({ error: 'Code parameter required' }, { status: 400 });
    }

    // Find the owner of this code
    const { data: owner } = await supabaseRest(
      `referrals?code=eq.${encodeURIComponent(code)}&limit=1`
    );

    if (!owner || owner.length === 0) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // Count how many people this code has referred
    const { data: referrals } = await supabaseRest(
      `referrals?referrer_code=eq.${encodeURIComponent(code)}&referred_email=not.is.null&select=id`
    );

    const referralCount = referrals ? referrals.length : 0;
    const tierInfo = calculateTier(referralCount);

    return NextResponse.json({
      code,
      email: owner[0].referrer_email,
      referralCount,
      tier: tierInfo.tier,
      reward: tierInfo.reward,
    });
  } catch (err) {
    console.error('Referral GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}
