/**
 * Create a new Mux live stream
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Admin only — only Mike Page can create live streams
  const adminKey = request.headers.get('x-admin-key');
  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title } = await request.json();

    // Check if Mux is configured
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      // Demo mode - return mock stream data
      return NextResponse.json({
        success: true,
        demo: true,
        streamId: 'demo-stream-id',
        streamKey: 'demo-stream-key-configure-mux',
        playbackId: 'demo-playback-id',
        rtmpUrl: 'rtmps://global-live.mux.com:443/app',
        message: 'Demo mode - configure Mux API keys to go live',
      });
    }

    // Dynamic import Mux only when configured
    const Mux = (await import('@mux/mux-node')).default;
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });

    // Create live stream
    const stream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'],
      },
      reduced_latency: true,
    });

    return NextResponse.json({
      success: true,
      streamId: stream.id,
      streamKey: stream.stream_key,
      playbackId: stream.playback_ids?.[0]?.id,
      rtmpUrl: 'rtmps://global-live.mux.com:443/app',
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create stream' },
      { status: 500 }
    );
  }
}
