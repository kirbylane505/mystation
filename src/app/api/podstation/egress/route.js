import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEgressClient } from '@/lib/livekit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Start recording a room
export async function POST(req) {
  try {
    const { roomName, streamId } = await req.json();
    if (!roomName || !streamId) {
      return NextResponse.json({ error: 'Missing roomName or streamId' }, { status: 400 });
    }

    const egress = getEgressClient();

    const output = {
      fileType: 0,
      filepath: `podstation-replays/${streamId}.mp4`,
      s3: {
        accessKey: process.env.R2_ACCESS_KEY_ID,
        secret: process.env.R2_SECRET_ACCESS_KEY,
        bucket: process.env.R2_BUCKET_NAME,
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
      },
    };

    const info = await egress.startRoomCompositeEgress(roomName, { file: output }, {
      layout: 'grid',
      audioOnly: false,
    });

    // Save egress ID to stream
    await supabaseAdmin
      .from('streams')
      .update({ egress_id: info.egressId })
      .eq('id', streamId);

    return NextResponse.json({ egressId: info.egressId });
  } catch (err) {
    console.error('Egress start error:', err);
    return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 });
  }
}

// Stop recording
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const egressId = searchParams.get('egressId');
    if (!egressId) {
      return NextResponse.json({ error: 'Missing egressId' }, { status: 400 });
    }

    const egress = getEgressClient();
    await egress.stopEgress(egressId);

    return NextResponse.json({ stopped: true });
  } catch (err) {
    console.error('Egress stop error:', err);
    return NextResponse.json({ error: 'Failed to stop recording' }, { status: 500 });
  }
}
