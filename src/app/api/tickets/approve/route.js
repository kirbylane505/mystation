/**
 * MYTICKETSLIVE - Approve Order API
 * POST: Admin approves a pending order, generates tickets with QR codes
 * Requires AUDIO_SECRET for admin auth
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const ADMIN_KEY_ENV = process.env.ADMIN_KEY;

function generateQRCode(ticketId) {
  const hmac = createHmac('sha256', AUDIO_SECRET)
    .update(ticketId)
    .digest('hex')
    .slice(0, 8);
  return `MTIX-${ticketId}-${hmac}`;
}

function verifyAdminKey(key) {
  if (!key) return false;
  if (ADMIN_KEY_ENV && key.length === ADMIN_KEY_ENV.length) {
    try { if (timingSafeEqual(Buffer.from(key), Buffer.from(ADMIN_KEY_ENV))) return true; } catch {}
  }
  if (AUDIO_SECRET && key.length === AUDIO_SECRET.length) {
    try { if (timingSafeEqual(Buffer.from(key), Buffer.from(AUDIO_SECRET))) return true; } catch {}
  }
  return false;
}

export async function POST(request) {
  try {
    // Admin auth — timing-safe comparison (accepts ADMIN_KEY or AUDIO_SECRET)
    const key = request.headers.get('x-admin-key');
    if (!verifyAdminKey(key)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { order_ref, approved_by } = body;

    if (!order_ref) {
      return NextResponse.json({ error: 'order_ref is required' }, { status: 400 });
    }

    // Fetch the order with ticket type details
    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .select('*, ticket_types(*), events(*)')
      .eq('order_ref', order_ref)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order is already ${order.status}. Cannot approve.` },
        { status: 409 }
      );
    }

    // Update order status to approved
    const { error: updateOrderError } = await supabase
      .from('ticket_orders')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approved_by || null,
        updated_at: new Date().toISOString(),
      })
      .eq('order_ref', order_ref);

    if (updateOrderError) {
      console.error('[Approve] Order update error:', updateOrderError);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // Create individual ticket records
    const tickets = [];
    for (let i = 0; i < order.quantity; i++) {
      const ticketId = randomUUID();
      const qr_code = generateQRCode(ticketId);

      tickets.push({
        id: ticketId,
        order_id: order.id,
        event_id: order.event_id,
        ticket_type_id: order.ticket_type_id,
        holder_name: order.purchaser_name,
        holder_email: order.purchaser_email,
        qr_code,
        status: 'valid',
      });
    }

    const { data: createdTickets, error: ticketError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();

    if (ticketError) {
      console.error('[Approve] Ticket creation error:', ticketError);
      // Rollback order status
      await supabase
        .from('ticket_orders')
        .update({ status: 'pending', approved_at: null, approved_by: null })
        .eq('order_ref', order_ref);
      return NextResponse.json({ error: 'Failed to create tickets', detail: ticketError.message }, { status: 500 });
    }

    // Update ticket_types.quantity_sold
    const newQuantitySold = (order.ticket_types?.quantity_sold || 0) + order.quantity;
    const { error: ttUpdateError } = await supabase
      .from('ticket_types')
      .update({ quantity_sold: newQuantitySold })
      .eq('id', order.ticket_type_id);

    if (ttUpdateError) {
      console.error('[Approve] Ticket type quantity update error:', ttUpdateError);
    }

    // Update contacts table
    const emailNorm = order.purchaser_email.toLowerCase().trim();
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', emailNorm)
      .single();

    if (contact) {
      await supabase
        .from('contacts')
        .update({
          ticket_count: (contact.ticket_count || 0) + order.quantity,
          total_spent: (contact.total_spent || 0) + order.total_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('email', emailNorm);
    }

    // Build response with QR code URLs
    const ticketsWithQR = createdTickets.map(t => ({
      id: t.id,
      qr_code: t.qr_code,
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(t.qr_code)}&bgcolor=0a0f1e&color=ffffff`,
      status: t.status,
      holder_name: t.holder_name,
      holder_email: t.holder_email,
    }));

    return NextResponse.json({
      success: true,
      order_ref,
      event: order.events?.name || null,
      ticket_type: order.ticket_types?.name || null,
      quantity: order.quantity,
      total_amount: order.total_amount,
      tickets: ticketsWithQR,
    });
  } catch (err) {
    console.error('[Approve] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
