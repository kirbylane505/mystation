import { NextResponse } from 'next/server';
import crypto from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';

export async function POST(request) {
  try {
    const { trackId } = await request.json();
    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
    }

    // Look up track to get audio file path
    const { tracks } = await import('@/data/tracks');
    const track = tracks.find(t => t.id === trackId);
    if (!track || !track.audioFile) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const expires = Date.now() + 30 * 60 * 1000; // 30 min
    // Encode the audio file path in the token so middleware can verify it
    const payload = `${track.audioFile}:${expires}`;
    const signature = crypto.createHmac('sha256', AUDIO_SECRET).update(payload).digest('hex').slice(0, 16);
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

    return NextResponse.json({ token, expires });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
