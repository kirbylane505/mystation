import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWebhookReceiver } from '@/lib/livekit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const receiver = getWebhookReceiver();
    const event = await receiver.receive(body, authHeader);

    console.log('LiveKit webhook:', event.event, event.room?.name);

    // Host left the room — end stream if no publishers remain
    if (event.event === 'participant_left' && event.participant) {
      const isPublisher = event.participant.permission?.canPublish;
      const roomName = event.room?.name;

      if (isPublisher && roomName?.startsWith('podstation-')) {
        const remainingPublishers = event.room?.numPublishers || 0;

        if (remainingPublishers === 0) {
          const { data } = await supabaseAdmin
            .from('streams')
            .update({ is_live: false, ended_at: new Date().toISOString() })
            .eq('livekit_room_name', roomName)
            .eq('is_live', true)
            .select()
            .single();

          if (data) {
            console.log(`Stream auto-ended: ${data.title} (${roomName})`);
          }

          // Clear creator live status
          if (data?.user_email) {
            await supabaseAdmin
              .from('creators')
              .update({ is_live: false, current_stream_id: null })
              .eq('email', data.user_email);
          }
        }
      }
    }

    // Egress recording finished — save replay URL
    if (event.event === 'egress_ended' && event.egressInfo) {
      const egressId = event.egressInfo.egressId;

      const { data: stream } = await supabaseAdmin
        .from('streams')
        .select('id')
        .eq('egress_id', egressId)
        .single();

      if (stream) {
        const replayUrl = `${process.env.R2_PUBLIC_URL}/podstation-replays/${stream.id}.mp4`;

        // Save replay URL to stream
        await supabaseAdmin
          .from('streams')
          .update({ replay_url: replayUrl })
          .eq('id', stream.id);

        // If streamer is a creator with save_replay, auto-save to their videos
        const { data: streamData } = await supabaseAdmin
          .from('streams')
          .select('user_email, title, save_replay')
          .eq('id', stream.id)
          .single();

        if (streamData?.save_replay) {
          const { data: creator } = await supabaseAdmin
            .from('creators')
            .select('id')
            .eq('email', streamData.user_email)
            .maybeSingle();

          if (creator) {
            await supabaseAdmin
              .from('creator_videos')
              .insert({
                creator_id: creator.id,
                title: streamData.title || 'Live Stream Recording',
                video_url: replayUrl,
                stream_id: stream.id,
              });
            console.log('Creator video saved from stream:', stream.id);
          }
        }

        console.log('Replay saved:', replayUrl);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('LiveKit webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
