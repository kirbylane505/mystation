/**
 * MYTICKETSLIVE - Single Event API
 * GET: Get event by slug with ticket_types and remaining quantity
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('*, ticket_types(*)')
      .eq('slug', slug)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Calculate remaining quantity for each ticket type
    if (event.ticket_types) {
      event.ticket_types = event.ticket_types.map(tt => ({
        ...tt,
        quantity_remaining: (tt.quantity_available || 0) - (tt.quantity_sold || 0),
      }));
    }

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('[Events API] GET slug error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
