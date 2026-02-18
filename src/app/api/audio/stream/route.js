/**
 * MYSTATION - Audio Stream from Cloudflare R2
 * Verifies HMAC token, fetches from R2 public URL, streams back.
 * Supports Range requests for seeking.
 */

const AUDIO_SECRET = process.env.AUDIO_SECRET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

async function verifyToken(token, audioPath) {
  if (!AUDIO_SECRET) return false;
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const decoded = atob(base64 + pad);

    const lastColon = decoded.lastIndexOf(':');
    const sig = decoded.slice(lastColon + 1);
    const rest = decoded.slice(0, lastColon);
    const secondLastColon = rest.lastIndexOf(':');
    const expires = rest.slice(secondLastColon + 1);
    const tokenPath = rest.slice(0, secondLastColon);

    if (tokenPath !== audioPath) return false;
    if (Date.now() > parseInt(expires)) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(AUDIO_SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(`${tokenPath}:${expires}`));
    const hex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const expected = hex.slice(0, 32);
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const audioPath = searchParams.get('path');
  const token = searchParams.get('_t');

  if (!audioPath || !token) {
    return new Response('Missing parameters', { status: 400 });
  }

  if (!R2_PUBLIC_URL) {
    return new Response('R2 not configured', { status: 500 });
  }

  const valid = await verifyToken(token, audioPath);
  if (!valid) {
    return new Response('Access Denied', { status: 403 });
  }

  // Extract filename from path (e.g., /audio/singles/song.mp3 → song.mp3)
  const filename = audioPath.split('/').pop();
  const ext = filename.split('.').pop().toLowerCase();
  const contentType = ext === 'wav' ? 'audio/wav' : 'audio/mpeg';

  try {
    const r2Url = `${R2_PUBLIC_URL}/${encodeURIComponent(decodeURIComponent(filename))}`;

    const fetchHeaders = {};
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const r2Response = await fetch(r2Url, { headers: fetchHeaders });

    if (!r2Response.ok && r2Response.status !== 206) {
      if (r2Response.status === 404) {
        return new Response('Track not found', { status: 404 });
      }
      return new Response('Stream error', { status: 500 });
    }

    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Accept-Ranges': 'bytes',
    };

    const cl = r2Response.headers.get('content-length');
    if (cl) headers['Content-Length'] = cl;

    const cr = r2Response.headers.get('content-range');
    if (cr) headers['Content-Range'] = cr;

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers,
    });
  } catch (err) {
    console.error('[R2 Stream Error]', err.message);
    return new Response('Stream error', { status: 500 });
  }
}
