/**
 * MYTICKETSLIVE - Ticket Purchase API
 * POST: Create a ticket order (pending payment verification)
 * Generates order_ref, stores order, upserts contact, returns payment instructions
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function generateOrderRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LOTL-${code}`;
}

const PAYMENT_INSTRUCTIONS = {
  cashapp: {
    method: 'cashapp',
    handle: '$RIDE4PAGEMUSIC847',
    instructions: 'Send payment to $RIDE4PAGEMUSIC847 on CashApp. Include your order reference in the note.',
  },
  zelle: {
    method: 'zelle',
    handle: 'idmgatl@gmail.com',
    instructions: 'Send payment to idmgatl@gmail.com via Zelle. Include your order reference in the note.',
  },
  applepay: {
    method: 'applepay',
    handle: 'idmgatl@gmail.com',
    instructions: 'Send payment to idmgatl@gmail.com via Apple Pay. Include your order reference in the note.',
  },
};

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      event_id,
      ticket_type_id,
      quantity,
      purchaser_name,
      purchaser_email,
      purchaser_phone,
      payment_method,
    } = body;

    // Validate required fields
    if (!event_id || !ticket_type_id || !quantity || !purchaser_name || !purchaser_email || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, ticket_type_id, quantity, purchaser_name, purchaser_email, payment_method' },
        { status: 400 }
      );
    }

    if (!['cashapp', 'zelle', 'applepay'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment_method. Must be: cashapp, zelle, or applepay' },
        { status: 400 }
      );
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Fetch ticket type to get price and check availability
    const { data: ticketType, error: ttError } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('id', ticket_type_id)
      .single();

    if (ttError || !ticketType) {
      return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });
    }

    // Verify ticket type belongs to the event
    if (ticketType.event_id !== event_id) {
      return NextResponse.json({ error: 'Ticket type does not belong to this event' }, { status: 400 });
    }

    // Check availability
    const remaining = (ticketType.quantity_available || 0) - (ticketType.quantity_sold || 0);
    if (remaining < quantity) {
      return NextResponse.json(
        { error: `Only ${remaining} tickets remaining for this type` },
        { status: 409 }
      );
    }

    // Generate unique order ref
    let order_ref = generateOrderRef();
    // Ensure uniqueness (retry up to 5 times)
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase
        .from('ticket_orders')
        .select('id')
        .eq('order_ref', order_ref)
        .single();
      if (!existing) break;
      order_ref = generateOrderRef();
    }

    const total_amount = ticketType.price * quantity;
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('ticket_orders')
      .insert({
        order_ref,
        event_id,
        ticket_type_id,
        quantity,
        total_amount,
        purchaser_name,
        purchaser_email: purchaser_email.toLowerCase().trim(),
        purchaser_phone: purchaser_phone || null,
        payment_method,
        status: 'pending',
        expires_at,
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Tickets Purchase] Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to create order', detail: orderError.message }, { status: 500 });
    }

    // Upsert contact
    const emailNorm = purchaser_email.toLowerCase().trim();
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', emailNorm)
      .single();

    if (existingContact) {
      await supabase
        .from('contacts')
        .update({
          name: purchaser_name,
          phone: purchaser_phone || existingContact.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('email', emailNorm);
    } else {
      await supabase
        .from('contacts')
        .insert({
          email: emailNorm,
          name: purchaser_name,
          phone: purchaser_phone || null,
          source: 'ticket_purchase',
          ticket_count: 0,
          total_spent: 0,
        });
    }

    // Build payment info
    const paymentInfo = PAYMENT_INSTRUCTIONS[payment_method];

    return NextResponse.json({
      success: true,
      order_ref: order.order_ref,
      total_amount,
      quantity,
      ticket_type: ticketType.name,
      expires_at,
      payment: {
        ...paymentInfo,
        amount: `$${(total_amount / 100).toFixed(2)}`,
        note: `Order: ${order.order_ref}`,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[Tickets Purchase] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
