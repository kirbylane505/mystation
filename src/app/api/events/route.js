/**
 * MYTICKETSLIVE - Events API
 * GET: List active events with ticket_types (supports ?org= filter)
 * POST: Admin create event (requires AUDIO_SECRET)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const AUDIO_SECRET = process.env.AUDIO_SECRET;

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');

    let query = supabase
      .from('events')
      .select('*, ticket_types(*)')
      .eq('is_active', true)
      .eq('ticket_types.is_active', true)
      .order('date', { ascending: true });

    if (org) {
      query = query.eq('organization', org);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('[Events API] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ success: true, events });
  } catch (err) {
    console.error('[Events API] GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Admin auth via AUDIO_SECRET
    const { searchParams } = new URL(request.url);
    const key = request.headers.get('x-admin-key') || searchParams.get('key');
    if (!AUDIO_SECRET || key !== AUDIO_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      name, slug, description, date, end_date,
      venue, address, city, state, zip,
      organization, cover_image_url
    } = body;

    if (!name || !slug || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, date' },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        slug,
        description: description || null,
        date,
        end_date: end_date || null,
        venue: venue || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        organization: organization || null,
        cover_image_url: cover_image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Events API] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create event', detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err) {
    console.error('[Events API] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
