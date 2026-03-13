import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// List creator's merch
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  const { data: merch } = await supabase
    .from('creator_merch')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ merch: merch || [] });
}

// Create merch item
export async function POST(request) {
  try {
    const { email, title, description, price, image_url, variants } = await request.json();
    if (!email || !title || !price) {
      return NextResponse.json({ error: 'email, title, and price required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, subscription_status')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Active creator account required' }, { status: 403 });
    }

    const { data: item, error } = await supabase
      .from('creator_merch')
      .insert({
        creator_id: creator.id,
        title,
        description: description || null,
        price,
        image_url: image_url || null,
        variants: variants || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create merch' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update merch item
export async function PATCH(request) {
  try {
    const { email, id, ...updates } = await request.json();
    if (!email || !id) return NextResponse.json({ error: 'email and id required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const allowed = ['title', 'description', 'price', 'image_url', 'variants', 'status'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('creator_merch')
      .update(safeUpdates)
      .eq('id', id)
      .eq('creator_id', creator.id);

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete merch item
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');
  if (!email || !id) return NextResponse.json({ error: 'email and id required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  await supabase
    .from('creator_merch')
    .delete()
    .eq('id', id)
    .eq('creator_id', creator.id);

  return NextResponse.json({ success: true });
}
