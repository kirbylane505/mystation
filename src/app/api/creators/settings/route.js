import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('creators')
    .select('display_name, bio, avatar_url, banner_url, genre_tags, social_links, category, slug')
    .eq('email', email)
    .maybeSingle();

  return NextResponse.json({ settings: data });
}

export async function PATCH(request) {
  try {
    const { email, ...updates } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Whitelist allowed fields
    const allowed = ['display_name', 'bio', 'avatar_url', 'banner_url', 'genre_tags', 'social_links'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('creators')
      .update(safeUpdates)
      .eq('email', email);

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
