/**
 * MYSTATION - Signup Slots API
 * GET: Returns how many of the first 26 free signup slots remain
 * DELETE: Admin cleanup — remove test subscribers (requires admin secret)
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

export async function DELETE(request) {
  try {
    const { secret } = await request.json();
    if (secret !== process.env.AUDIO_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
    }

    // Get all test subscribers to report what's deleted
    const { data: all } = await supabase
      .from('subscribers')
      .select('email, created_at');

    // Delete all test subscribers (emails containing 'test' or 'schema')
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .or('email.ilike.%test%,email.ilike.%schema%');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Verify count after cleanup
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      deleted: all?.filter(s => /test|schema/i.test(s.email)).length || 0,
      remaining: Math.max(0, 26 - (count || 0)),
      total: 26,
      taken: count || 0,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
