/**
 * MYSTATION - Spotify Search API
 * Server-side search using Client Credentials flow
 * Returns tracks, artists, albums from Spotify's 100M+ catalog
 */

import { NextResponse } from 'next/server';

let cachedToken = null;
let tokenExpiry = 0;

// Search result cache — 5 min TTL, max 100 entries
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 100;

async function getSpotifyToken(retries = 2) {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const clientId = (process.env.SPOTIFY_CLIENT_ID || '').trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!res.ok) {
        if (attempt < retries) continue;
        throw new Error(`Spotify token error: ${res.status}`);
      }

      const data = await res.json();
      cachedToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      return cachedToken;
    } catch (err) {
      if (attempt < retries) continue;
      throw err;
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type') || 'track';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    const trimmed = (q || '').trim();
    if (trimmed.length < 1) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `${trimmed.toLowerCase()}:${type}:${limit}:${offset}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    let token;
    try {
      token = await getSpotifyToken();
    } catch (tokenErr) {
      // Force clear and retry once
      cachedToken = null;
      tokenExpiry = 0;
      token = await getSpotifyToken(1);
    }

    // Build URL manually — searchParams.set encodes commas as %2C which Spotify rejects
    const spotifyUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q.trim())}&type=${encodeURIComponent(type).replace(/%2C/gi, ',')}&limit=${limit}&offset=${offset}&market=US`;

    let res = await fetch(spotifyUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Retry once on 401 with a fresh token
    if (res.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      token = await getSpotifyToken();
      res = await fetch(spotifyUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (!res.ok) {
      throw new Error(`Spotify API error: ${res.status}`);
    }

    const data = await res.json();

    // Format tracks for MyStation consumption
    const tracks = (data.tracks?.items || []).map((t) => ({
      spotifyId: t.id,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(', '),
      artistId: t.artists[0]?.id,
      album: t.album?.name,
      albumId: t.album?.id,
      albumArt: t.album?.images?.[0]?.url || null,
      albumArtSmall: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url || null,
      previewUrl: t.preview_url,
      duration: t.duration_ms,
      durationFormatted: `${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}`,
      spotifyUrl: t.external_urls?.spotify,
      popularity: t.popularity,
      explicit: t.explicit,
      source: 'spotify',
    }));

    const artists = (data.artists?.items || []).map((a) => ({
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

    const albums = (data.albums?.items || []).map((al) => ({
      spotifyId: al.id,
      name: al.name,
      artist: al.artists.map((a) => a.name).join(', '),
      albumArt: al.images?.[0]?.url || null,
      albumArtSmall: al.images?.[2]?.url || al.images?.[0]?.url || null,
      releaseDate: al.release_date,
      totalTracks: al.total_tracks,
      spotifyUrl: al.external_urls?.spotify,
      source: 'spotify',
    }));

    const result = {
      tracks,
      artists,
      albums,
      total: {
        tracks: data.tracks?.total || 0,
        artists: data.artists?.total || 0,
        albums: data.albums?.total || 0,
      },
      query: q,
      offset,
      limit,
    };

    // Store in cache (evict oldest if full)
    if (searchCache.size >= CACHE_MAX) {
      const oldest = searchCache.keys().next().value;
      searchCache.delete(oldest);
    }
    searchCache.set(cacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Spotify search error:', error.message, error.stack);
    // Clear token cache so next request gets a fresh one
    cachedToken = null;
    tokenExpiry = 0;
    return NextResponse.json(
      { error: 'Search temporarily unavailable', detail: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}
