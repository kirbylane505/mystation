import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { getWebPush } from '@/lib/push';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');
  const email = searchParams.get('email');

  const supabase = getSupabaseAdmin();

  let creatorIdToUse = creatorId;
  if (!creatorIdToUse && email) {
    const { data: creator } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
    if (!creator) return NextResponse.json({ videos: [] });
    creatorIdToUse = creator.id;
  }

  if (!creatorIdToUse) return NextResponse.json({ videos: [] });

  const { data: videos } = await supabase
    .from('creator_videos')
    .select('*')
    .eq('creator_id', creatorIdToUse)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ videos: videos || [] });
}

export async function POST(request) {
  try {
    const { email, title, description, videoUrl, thumbnailUrl, duration, streamId } = await request.json();
    if (!email || !title || !videoUrl) {
      return NextResponse.json({ error: 'email, title, and videoUrl required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, subscription_status')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: 'Active creator required' }, { status: 403 });

    const { data: video, error } = await supabase
      .from('creator_videos')
      .insert({
        creator_id: creator.id,
        title,
        description: description || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        duration: duration || null,
        stream_id: streamId || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to save video' }, { status: 500 });

    // Notify followers of new video
    notifyFollowers(creator.id, email, `New video: ${title}`);

    return NextResponse.json({ video });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function notifyFollowers(creatorId, creatorEmail, body) {
  try {
    const webpush = getWebPush();
    if (!webpush) return;

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase.from('creators').select('slug').eq('id', creatorId).maybeSingle();
    if (!creator) return;

    const { data: followers } = await supabase
      .from('creator_followers')
      .select('push_subscription')
      .eq('creator_id', creatorId)
      .not('push_subscription', 'is', null);

    if (!followers || followers.length === 0) return;

    const payload = JSON.stringify({
      title: 'New on MyStation',
      body,
      url: `/artist/${creator.slug}`,
      image: '/images/mystation-logo.png',
    });

    await Promise.allSettled(
      followers.map(f => webpush.sendNotification(f.push_subscription, payload).catch(() => null))
    );
  } catch (err) {
    console.error('Follower notification error:', err);
  }
}

export async function PATCH(request) {
  try {
    const { email, id, ...updates } = await request.json();
    if (!email || !id) return NextResponse.json({ error: 'email and id required' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: creator } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const allowed = ['title', 'description', 'thumbnail_url', 'status'];
    const safe = {};
    for (const k of allowed) { if (updates[k] !== undefined) safe[k] = updates[k]; }
    safe.updated_at = new Date().toISOString();

    await supabase.from('creator_videos').update(safe).eq('id', id).eq('creator_id', creator.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
