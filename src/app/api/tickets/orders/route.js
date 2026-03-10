/**
 * MYTICKETSLIVE - Admin Orders API
 * GET: List all ticket orders (admin only, requires AUDIO_SECRET)
 * Supports ?status=pending filter
 * Returns orders joined with events and ticket_types, sorted by created_at desc
 */

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const ADMIN_KEY = process.env.ADMIN_KEY;

function verifyKey(key) {
  if (!key) return false;
  // Accept either ADMIN_KEY or AUDIO_SECRET for backward compatibility
  if (ADMIN_KEY && key.length === ADMIN_KEY.length) {
    try { if (timingSafeEqual(Buffer.from(key), Buffer.from(ADMIN_KEY))) return true; } catch {}
  }
  if (AUDIO_SECRET && key.length === AUDIO_SECRET.length) {
    try { if (timingSafeEqual(Buffer.from(key), Buffer.from(AUDIO_SECRET))) return true; } catch {}
  }
  return false;
}

export async function GET(request) {
  try {
    // Admin auth — timing-safe comparison
    const { searchParams } = new URL(request.url);
    const key = request.headers.get('x-admin-key') || searchParams.get('key');
    if (!verifyKey(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const status = searchParams.get('status');

    let query = supabase
      .from('ticket_orders')
      .select('*, events(*), ticket_types(*)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('[Ticket Orders] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Format response
    const formattedOrders = (orders || []).map(o => ({
      id: o.id,
      order_ref: o.order_ref,
      status: o.status,
      quantity: o.quantity,
      total_amount: o.total_amount,
      payment_method: o.payment_method,
      payment_screenshot_url: o.payment_screenshot_url,
      purchaser_name: o.purchaser_name,
      purchaser_email: o.purchaser_email,
      purchaser_phone: o.purchaser_phone,
      approved_at: o.approved_at,
      approved_by: o.approved_by,
      expires_at: o.expires_at,
      created_at: o.created_at,
      event: o.events ? {
        id: o.events.id,
        name: o.events.name,
        slug: o.events.slug,
        date: o.events.date,
      } : null,
      ticket_type: o.ticket_types ? {
        id: o.ticket_types.id,
        name: o.ticket_types.name,
        price: o.ticket_types.price,
      } : null,
    }));

    // Summary stats
    const stats = {
      total: formattedOrders.length,
      pending: formattedOrders.filter(o => o.status === 'pending').length,
      approved: formattedOrders.filter(o => o.status === 'approved').length,
      cancelled: formattedOrders.filter(o => o.status === 'cancelled').length,
      total_revenue: formattedOrders
        .filter(o => o.status === 'approved')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      stats,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error('[Ticket Orders] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
