import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// Follow a creator
export async function POST(request) {
  try {
    const { creatorSlug, followerEmail, pushSubscription } = await request.json();
    if (!creatorSlug || !followerEmail) {
      return NextResponse.json({ error: 'creatorSlug and followerEmail required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('slug', creatorSlug)
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    // Upsert follow (idempotent)
    await supabase
      .from('creator_followers')
      .upsert(
        {
          creator_id: creator.id,
          follower_email: followerEmail.toLowerCase(),
          ...(pushSubscription ? { push_subscription: pushSubscription } : {}),
        },
        { onConflict: 'creator_id,follower_email' }
      );

    // Update follower count
    const { count } = await supabase
      .from('creator_followers')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', creator.id);

    await supabase
      .from('creators')
      .update({ follower_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', creator.id);

    return NextResponse.json({ following: true, followerCount: count || 0 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Unfollow a creator
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const creatorSlug = searchParams.get('creatorSlug');
  const followerEmail = searchParams.get('followerEmail');

  if (!creatorSlug || !followerEmail) {
    return NextResponse.json({ error: 'creatorSlug and followerEmail required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('slug', creatorSlug)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  await supabase
    .from('creator_followers')
    .delete()
    .eq('creator_id', creator.id)
    .eq('follower_email', followerEmail.toLowerCase());

  // Update follower count
  const { count } = await supabase
    .from('creator_followers')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creator.id);

  await supabase
    .from('creators')
    .update({ follower_count: count || 0, updated_at: new Date().toISOString() })
    .eq('id', creator.id);

  return NextResponse.json({ following: false, followerCount: count || 0 });
}
