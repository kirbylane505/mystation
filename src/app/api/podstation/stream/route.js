import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken } from '@/lib/livekit';
import { getWebPush } from '@/lib/push';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a new stream
export async function POST(req) {
  try {
    const { title, userEmail, userName, userId, saveReplay, isPaid, price, backgroundTrackId } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const roomName = `podstation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: stream, error } = await supabaseAdmin
      .from('streams')
      .insert({
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        user_email: userEmail,
        user_name: userName || userEmail.split('@')[0],
        title: title || 'Untitled Stream',
        is_live: true,
        livekit_room_name: roomName,
        save_replay: saveReplay || false,
        is_paid: isPaid || false,
        price: price || null,
        background_track_id: backgroundTrackId || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // If streamer is a creator, mark them as live
    const { data: streamerCreator } = await supabaseAdmin
      .from('creators')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (streamerCreator) {
      await supabaseAdmin
        .from('creators')
        .update({ is_live: true, current_stream_id: stream.id })
        .eq('id', streamerCreator.id);

      // Send push to creator's followers
      sendCreatorLiveNotification(streamerCreator.id, stream, userName || userEmail.split('@')[0]);
    }

    const token = await createToken(roomName, userName || userEmail.split('@')[0], true);

    // Send push notification to all MyStation users
    sendLiveNotification(stream, userName || userEmail.split('@')[0]);

    // Auto-start recording if saveReplay is enabled
    if (saveReplay) {
      startReplayRecording(roomName, stream.id);
    }

    return NextResponse.json({ stream, token, roomName });
  } catch (err) {
    console.error('PodStation create stream error:', err);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}

// End a stream
export async function PATCH(req) {
  try {
    const { streamId } = await req.json();

    if (!streamId) {
      return NextResponse.json({ error: 'Missing streamId' }, { status: 400 });
    }

    // Check if stream has an active egress recording — stop it
    const { data: current } = await supabaseAdmin
      .from('streams')
      .select('egress_id')
      .eq('id', streamId)
      .single();

    if (current?.egress_id) {
      stopReplayRecording(current.egress_id);
    }

    const { data, error } = await supabaseAdmin
      .from('streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', streamId)
      .select()
      .single();

    if (error) throw error;

    // Clear creator live status
    if (data?.user_email) {
      await supabaseAdmin
        .from('creators')
        .update({ is_live: false, current_stream_id: null })
        .eq('email', data.user_email);
    }

    return NextResponse.json({ stream: data });
  } catch (err) {
    console.error('PodStation end stream error:', err);
    return NextResponse.json({ error: 'Failed to end stream' }, { status: 500 });
  }
}

// Fire-and-forget push notification to all subscribers
async function sendLiveNotification(stream, streamerName) {
  try {
    const webpush = getWebPush();
    if (!webpush) return;

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('active', true);

    if (!subs || subs.length === 0) return;

    const payload = JSON.stringify({
      title: `${streamerName} is LIVE on PodStation!`,
      body: stream.title,
      url: `/podstation/${stream.id}`,
      image: '/images/mystation-logo.png',
    });

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        ).catch(() => null)
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`PodStation LIVE notification sent to ${sent}/${subs.length} subscribers`);
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

// Fire-and-forget egress recording start
async function startReplayRecording(roomName, streamId) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com';
    await fetch(`${baseUrl}/api/podstation/egress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, streamId }),
    });
    console.log('Egress recording started for stream:', streamId);
  } catch (err) {
    console.error('Egress auto-start failed:', err);
  }
}

// Fire-and-forget egress recording stop
async function stopReplayRecording(egressId) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com';
    await fetch(`${baseUrl}/api/podstation/egress?egressId=${egressId}`, {
      method: 'DELETE',
    });
    console.log('Egress recording stopped:', egressId);
  } catch (err) {
    console.error('Egress stop failed:', err);
  }
}

async function sendCreatorLiveNotification(creatorId, stream, streamerName) {
  try {
    const webpush = getWebPush();
    if (!webpush) return;

    const { data: followers } = await supabaseAdmin
      .from('creator_followers')
      .select('push_subscription')
      .eq('creator_id', creatorId)
      .not('push_subscription', 'is', null);

    if (!followers || followers.length === 0) return;

    const payload = JSON.stringify({
      title: `${streamerName} is LIVE!`,
      body: stream.title,
      url: `/podstation/${stream.id}`,
      image: '/images/mystation-logo.png',
    });

    const results = await Promise.allSettled(
      followers.map(f =>
        webpush.sendNotification(f.push_subscription, payload).catch(() => null)
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Creator LIVE push sent to ${sent}/${followers.length} followers`);
  } catch (err) {
    console.error('Creator live push error:', err);
  }
}
