import { NextResponse } from 'next/server';
import crypto from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';

export async function POST(request) {
  try {
    const { trackId } = await request.json();
    if (!trackId) {
      return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
    }

    const expires = Date.now() + 30 * 60 * 1000; // 30 min
    const payload = `${trackId}:${expires}`;
    const signature = crypto.createHmac('sha256', AUDIO_SECRET).update(payload).digest('hex').slice(0, 16);
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');

    return NextResponse.json({ token, expires });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
