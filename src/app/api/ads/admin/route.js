import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

const ADMIN_KEY = process.env.ADMIN_KEY || 'mystation-admin-2026';

function checkAdmin(request) {
  const auth = request.headers.get('x-admin-key');
  return auth === ADMIN_KEY;
}

// List all ads
export async function GET(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ ads: ads || [] });
}

// Create new ad
export async function POST(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, audio_url, banner_url, click_url, start_date, end_date } = await request.json();

    if (!title || !audio_url || !banner_url) {
      return NextResponse.json({ error: 'title, audio_url, and banner_url required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: ad, error } = await supabase
      .from('ads')
      .insert({
        title,
        audio_url,
        banner_url,
        click_url: click_url || null,
        start_date: start_date || null,
        end_date: end_date || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create ad' }, { status: 500 });
    }

    return NextResponse.json({ ad });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update ad
export async function PATCH(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const allowed = ['title', 'audio_url', 'banner_url', 'click_url', 'active', 'start_date', 'end_date'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('ads')
      .update(safeUpdates)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete ad
export async function DELETE(request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  await supabase.from('ads').delete().eq('id', id);

  return NextResponse.json({ success: true });
}
