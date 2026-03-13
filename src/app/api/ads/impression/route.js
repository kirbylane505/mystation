import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { createHash } from 'crypto';

export async function POST(request) {
  try {
    const { adId, completed, clicked, sessionId } = await request.json();
    if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Hash IP for privacy
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const ipHash = createHash('sha256').update(ip + process.env.STRIPE_WEBHOOK_SECRET).digest('hex').slice(0, 16);

    // Log impression
    await supabase.from('ad_impressions').insert({
      ad_id: adId,
      user_ip_hash: ipHash,
      session_id: sessionId || null,
      completed: completed || false,
      clicked: clicked || false,
    });

    // Increment counters on ad record
    if (clicked) {
      await supabase.rpc('exec_sql', {
        sql: `UPDATE ads SET clicks = clicks + 1, impressions = impressions + 1 WHERE id = '${adId}'`
      });
    } else {
      await supabase.rpc('exec_sql', {
        sql: `UPDATE ads SET impressions = impressions + 1 WHERE id = '${adId}'`
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ad-impression] Error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
