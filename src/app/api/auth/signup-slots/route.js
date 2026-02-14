/**
 * MYSTATION - Signup Slots API
 * GET: Returns how many of the first 26 free signup slots remain
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ remaining: 0 }, { status: 200 });
    }

    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    const currentCount = count || 0;
    const remaining = Math.max(0, 26 - currentCount);

    return NextResponse.json({
      remaining,
      total: 26,
      taken: currentCount,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('Signup slots error:', err);
    return NextResponse.json({ remaining: 0 }, { status: 200 });
  }
}
