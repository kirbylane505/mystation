import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { getWebPush } from '@/lib/push';

// Step 1: Create a signed upload URL for Supabase Storage
export async function POST(request) {
  try {
    const { email, title, description, filename, contentType } = await request.json();

    if (!email || !title || !filename) {
      return NextResponse.json({ error: 'email, title, and filename required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug, subscription_status')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Active creator account required' }, { status: 403 });
    }

    const ext = filename.split('.').pop() || 'mp4';
    const key = `${creator.slug}/${Date.now()}.${ext}`;

    // Create signed upload URL (valid 15 min)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('creator-content')
      .createSignedUploadUrl(key);

    if (uploadError) {
      console.error('[upload-video] Signed URL error:', uploadError);
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('creator-content')
      .getPublicUrl(key);

    // Insert video record
    const { data: video, error: dbError } = await supabase
      .from('creator_videos')
      .insert({
        creator_id: creator.id,
        title,
        description: description || null,
        video_url: publicUrl,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[upload-video] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save video' }, { status: 500 });
    }

    // Notify followers
    notifyFollowers(creator.id, creator.slug, `New video: ${title}`);

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: key,
      videoUrl: publicUrl,
      video,
    });
  } catch (err) {
    console.error('[upload-video] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

async function notifyFollowers(creatorId, creatorSlug, body) {
  try {
    const webpush = getWebPush();
    if (!webpush) return;

    const supabase = getSupabaseAdmin();
    const { data: followers } = await supabase
      .from('creator_followers')
      .select('push_subscription')
      .eq('creator_id', creatorId)
      .not('push_subscription', 'is', null);

    if (!followers || followers.length === 0) return;

    const payload = JSON.stringify({
      title: 'New on MyStation',
      body,
      url: `/artist/${creatorSlug}`,
      image: '/images/mystation-logo.png',
    });

    await Promise.allSettled(
      followers.map(f => webpush.sendNotification(f.push_subscription, payload).catch(() => null))
    );
  } catch (err) {
    console.error('Follower notification error:', err);
  }
}
