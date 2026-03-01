import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { timingSafeEqual } from 'crypto';

function verifyAdminKey(key) {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key) return false;
  try {
    return timingSafeEqual(Buffer.from(key), Buffer.from(adminKey));
  } catch { return false; }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = request.headers.get('x-admin-key');
  if (!verifyAdminKey(key)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const statusFilter = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  let query = supabase
    .from('merch_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute stats
  const all = orders || [];
  const stats = {
    total: all.length,
    fulfilled: all.filter(o => o.status === 'fulfilled').length,
    partial: all.filter(o => o.status === 'partial').length,
    failed: all.filter(o => o.status === 'failed').length,
    pending: all.filter(o => o.status === 'pending').length,
    revenue: all.reduce((sum, o) => sum + (o.total_cents || 0), 0),
  };

  return NextResponse.json({ orders: all, stats });
}
