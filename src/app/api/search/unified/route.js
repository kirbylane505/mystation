/**
 * MYSTATION - Unified Global Music Search
 * Searches local catalog + Spotify
 * Spotify-only — no Deezer
 */

import { NextResponse } from 'next/server';

// ─── SPOTIFY TOKEN CACHE ───
let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;

  const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) return null;
    const data = await res.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return spotifyToken;
  } catch {
    return null;
  }
}

// ─── SEARCH CACHE ───
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 200;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (q.length < 1) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `unified:${q.toLowerCase()}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // ─── SPOTIFY SEARCH ONLY ───
    const spotify = await searchSpotify(q, limit);

    const result = {
      tracks: spotify.tracks.slice(0, limit),
      artists: spotify.artists || [],
      query: q,
      sources: {
        spotify: true,
      },
    };

    // Store in cache
    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    cache.set(cacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unified search error:', error.message);
    return NextResponse.json(
      { error: 'Search temporarily unavailable', detail: error.message },
      { status: 500 }
    );
  }
}

// ─── SPOTIFY SEARCH ───
async function searchSpotify(q, limit) {
  const token = await getSpotifyToken();
  if (!token) return { tracks: [], artists: [] };

  try {
    const [trackRes, artistRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=${limit}&market=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=5&market=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const trackData = trackRes.ok ? await trackRes.json() : {};
    const artistData = artistRes.ok ? await artistRes.json() : {};

    const tracks = (trackData.tracks?.items || []).map(t => ({
      spotifyId: t.id,
      title: t.name,
      artist: t.artists.map(a => a.name).join(', '),
      artistId: t.artists[0]?.id,
      album: t.album?.name,
      albumArt: t.album?.images?.[0]?.url || null,
      albumArtSmall: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || null,
      previewUrl: t.preview_url || null,
      duration: t.duration_ms,
      durationFormatted: `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`,
      spotifyUrl: t.external_urls?.spotify,
      popularity: t.popularity,
      explicit: t.explicit,
      source: 'spotify',
    }));

    const artists = (artistData.artists?.items || []).map(a => ({
      spotifyId: a.id,
      name: a.name,
      image: a.images?.[0]?.url || null,
      imageSmall: a.images?.[2]?.url || a.images?.[0]?.url || null,
      genres: a.genres?.slice(0, 3) || [],
      followers: a.followers?.total || 0,
      popularity: a.popularity,
      spotifyUrl: a.external_urls?.spotify,
      source: 'spotify',
    }));

    return { tracks, artists };
  } catch (err) {
    console.error('Spotify search failed:', err.message);
    return { tracks: [], artists: [] };
  }
}
