import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

const AUDIO_SECRET = process.env.AUDIO_SECRET || 'ms-audio-2026-idmg';

// Generate a signed token for audio streaming
export function generateAudioToken(trackId) {
  const expires = Date.now() + 30 * 60 * 1000; // 30 min
  const payload = `${trackId}:${expires}`;
  const signature = crypto.createHmac('sha256', AUDIO_SECRET).update(payload).digest('hex').slice(0, 16);
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

// Verify token
function verifyToken(token, trackId) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [tid, expires, sig] = decoded.split(':');
    if (parseInt(tid) !== trackId) return false;
    if (Date.now() > parseInt(expires)) return false;
    const expected = crypto.createHmac('sha256', AUDIO_SECRET).update(`${tid}:${expires}`).digest('hex').slice(0, 16);
    return sig === expected;
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const trackId = parseInt(searchParams.get('id'));
  const token = searchParams.get('t');

  if (!trackId || !token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  if (!verifyToken(token, trackId)) {
    return new NextResponse('Invalid or expired token', { status: 403 });
  }

  // Import tracks data to find the file
  const { tracks } = await import('@/data/tracks');
  const track = tracks.find(t => t.id === trackId);

  if (!track || !track.audioFile) {
    return new NextResponse('Track not found', { status: 404 });
  }

  try {
    const filePath = join(process.cwd(), 'public', track.audioFile);
    const fileBuffer = await readFile(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Content-Length', fileBuffer.length.toString());
    headers.set('Accept-Ranges', 'bytes');
    // Anti-download headers
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    // Block embedding/hotlinking
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
