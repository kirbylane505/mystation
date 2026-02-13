/**
 * MYSTATION - Analytics Event Ingestion
 * POST endpoint for tracking plays, page views, and purchases
 * Extracts geo from Vercel headers, hashes IP for privacy
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { event_type, track_id, track_title, page_path, amount_cents } = body;

    if (!event_type) {
      return NextResponse.json({ error: 'event_type required' }, { status: 400 });
    }

    const headersList = await headers();

    // Geo data from Vercel edge headers
    const city = headersList.get('x-vercel-ip-city') || null;
    const region = headersList.get('x-vercel-ip-country-region') || null;
    const country = headersList.get('x-vercel-ip-country') || null;

    // Hash IP for privacy (never store raw IP)
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // Use dedicated salt for IP hashing — never mix secrets with user-influenced data
    const hashSalt = process.env.IP_HASH_SALT || 'ms-ip-salt-2026';
    const ip_hash = createHash('sha256').update(ip + hashSalt).digest('hex').slice(0, 16);

    // Parse user agent for device type
    const ua = headersList.get('user-agent') || '';
    const device_type = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile'
      : /Tablet/i.test(ua) ? 'tablet' : 'desktop';

    // Session ID from cookie or generate placeholder
    const session_id = headersList.get('cookie')?.match(/session_id=([^;]+)/)?.[1] || ip_hash;

    const referrer = headersList.get('referer') || null;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Silently succeed if Supabase not configured (don't break the app)
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_type,
      track_id: track_id || null,
      track_title: track_title || null,
      page_path: page_path || null,
      session_id,
      ip_hash,
      city: city ? decodeURIComponent(city) : null,
      region,
      country,
      device_type,
      user_agent: ua.slice(0, 500),
      referrer: referrer?.slice(0, 500) || null,
      amount_cents: amount_cents || null,
    });

    if (error) {
      console.error('Analytics insert error:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Never fail the client — analytics errors should be silent
    console.error('Analytics track error:', err);
    return NextResponse.json({ ok: true });
  }
}
