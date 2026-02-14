/**
 * MYTICKETSLIVE - Verify & Check-in Ticket API
 * POST: Verify QR code HMAC, check-in ticket at the gate
 * Validates the HMAC signature, checks ticket status, marks as used
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createHmac } from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET;

function verifyQRCode(qr_code) {
  // Format: MTIX-{ticketId}-{hmac8}
  if (!qr_code || !qr_code.startsWith('MTIX-')) {
    return { valid: false, ticketId: null };
  }

  const parts = qr_code.split('-');
  // MTIX + 5 UUID segments + hmac = 7 parts
  // UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx = 5 segments when split by -
  // So full: MTIX-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-hmac8 = 7 parts
  if (parts.length < 7) {
    return { valid: false, ticketId: null };
  }

  const hmacReceived = parts[parts.length - 1];
  // Reconstruct ticket ID (UUID) from middle parts
  const ticketId = parts.slice(1, parts.length - 1).join('-');

  const expectedHmac = createHmac('sha256', AUDIO_SECRET)
    .update(ticketId)
    .digest('hex')
    .slice(0, 8);

  if (hmacReceived !== expectedHmac) {
    return { valid: false, ticketId: null };
  }

  return { valid: true, ticketId };
}

export async function POST(request) {
  try {
    if (!AUDIO_SECRET) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { qr_code, checked_in_by } = body;

    if (!qr_code) {
      return NextResponse.json({ error: 'qr_code is required' }, { status: 400 });
    }

    // Verify HMAC
    const { valid, ticketId } = verifyQRCode(qr_code);
    if (!valid) {
      return NextResponse.json({
        success: false,
        error: 'INVALID TICKET',
        message: 'QR code signature verification failed. This ticket may be counterfeit.',
      }, { status: 403 });
    }

    // Fetch ticket with event and ticket type details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, events(*), ticket_types(*)')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({
        success: false,
        error: 'TICKET NOT FOUND',
        message: 'No ticket found with this ID.',
      }, { status: 404 });
    }

    // Check if already used
    if (ticket.status === 'used') {
      return NextResponse.json({
        success: false,
        error: 'ALREADY CHECKED IN',
        message: `This ticket was already used at ${ticket.checked_in_at}`,
        ticket: {
          id: ticket.id,
          holder_name: ticket.holder_name,
          holder_email: ticket.holder_email,
          checked_in_at: ticket.checked_in_at,
          checked_in_by: ticket.checked_in_by,
        },
      }, { status: 409 });
    }

    // Check if ticket is valid (not cancelled, expired, etc.)
    if (ticket.status !== 'valid') {
      return NextResponse.json({
        success: false,
        error: 'TICKET INVALID',
        message: `Ticket status is "${ticket.status}". Only "valid" tickets can be checked in.`,
      }, { status: 403 });
    }

    // Mark as used
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checked_in_at: now,
        checked_in_by: checked_in_by || null,
        updated_at: now,
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('[Verify] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to check in ticket' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'TICKET VERIFIED - CHECK IN APPROVED',
      ticket: {
        id: ticket.id,
        holder_name: ticket.holder_name,
        holder_email: ticket.holder_email,
        checked_in_at: now,
        checked_in_by: checked_in_by || null,
      },
      event: ticket.events ? {
        name: ticket.events.name,
        date: ticket.events.date,
        venue: ticket.events.venue,
      } : null,
      ticket_type: ticket.ticket_types ? {
        name: ticket.ticket_types.name,
        price: ticket.ticket_types.price,
      } : null,
    });
  } catch (err) {
    console.error('[Verify] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
