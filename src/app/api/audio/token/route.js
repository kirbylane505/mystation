import { NextResponse } from 'next/server';

const AUDIO_SECRET = process.env.AUDIO_SECRET;
if (!AUDIO_SECRET) {
  console.error('FATAL: AUDIO_SECRET env var is not set');
}

// Use Web Crypto API (same as middleware) for HMAC signing — ensures token compatibility
async function signToken(payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(AUDIO_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 32);
}

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
    const payload = `${track.audioFile}:${expires}`;
    const signature = await signToken(payload);
    // base64url encode: audioPath:expires:signature
    const token = btoa(`${payload}:${signature}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return NextResponse.json({ token, expires });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
