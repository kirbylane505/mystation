/**
 * MYSTATION - Unified Global Music Search
 * Spotify metadata + Deezer audio previews (invisible to user)
 * UI shows Spotify branding only — Deezer is the silent audio engine
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

    // ─── PARALLEL: Spotify metadata + Deezer audio ───
    const [spotifyResult, deezerResult] = await Promise.allSettled([
      searchSpotify(q, limit),
      searchDeezer(q, Math.min(limit + 10, 25)),
    ]);

    const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : { tracks: [], artists: [] };
    const deezer = deezerResult.status === 'fulfilled' ? deezerResult.value : { tracks: [] };

    // Enrich Spotify tracks with Deezer preview audio
    const enrichedTracks = mergeResults(spotify.tracks, deezer.tracks);

    // Unmatched Deezer tracks — label as "spotify" so UI stays clean
    const usedDeezerIds = new Set(enrichedTracks.filter(t => t.deezerId).map(t => t.deezerId));
    const deezerOnly = deezer.tracks
      .filter(dt => !usedDeezerIds.has(dt.deezerId))
      .map(dt => ({ ...dt, source: 'spotify' })); // Hide Deezer branding

    const allTracks = [...enrichedTracks, ...deezerOnly];
    allTracks.sort((a, b) => {
      const aPlayable = a.previewUrl ? 1 : 0;
      const bPlayable = b.previewUrl ? 1 : 0;
      if (bPlayable !== aPlayable) return bPlayable - aPlayable;
      return (b.popularity || b.rank || 0) - (a.popularity || a.rank || 0);
    });

    const result = {
      tracks: allTracks.slice(0, limit),
      artists: spotify.artists || [],
      query: q,
      sources: { spotify: true },
    };

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

// ─── DEEZER SEARCH (silent audio engine) ───
async function searchDeezer(q, limit) {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { tracks: [] };
    const data = await res.json();

    const tracks = (data.data || []).map(t => ({
      deezerId: t.id,
      title: t.title_short || t.title,
      artist: t.artist?.name || 'Unknown',
      album: t.album?.title || '',
      albumArt: t.album?.cover_xl || t.album?.cover_big || null,
      albumArtSmall: t.album?.cover_medium || t.album?.cover_small || null,
      previewUrl: t.preview || null,
      duration: t.duration * 1000,
      durationFormatted: `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}`,
      explicit: t.explicit_lyrics || false,
      rank: t.rank || 0,
      source: 'spotify', // Always label as spotify — Deezer is invisible
    }));

    return { tracks };
  } catch (err) {
    console.error('Deezer search failed:', err.message);
    return { tracks: [] };
  }
}

// ─── MERGE: Spotify metadata + Deezer audio ───
function mergeResults(spotifyTracks, deezerTracks) {
  const deezerByTitle = new Map();
  const deezerByTitleArtist = new Map();
  for (const dt of deezerTracks) {
    const titleKey = normalize(dt.title);
    const titleArtistKey = normalize(`${dt.title} ${dt.artist.split(',')[0]}`);
    if (!deezerByTitle.has(titleKey)) deezerByTitle.set(titleKey, dt);
    if (!deezerByTitleArtist.has(titleArtistKey)) deezerByTitleArtist.set(titleArtistKey, dt);
  }

  const usedDeezerIds = new Set();

  const merged = spotifyTracks.map(st => {
    const titleKey = normalize(st.title);
    const firstArtist = st.artist.split(',')[0].trim();
    const titleArtistKey = normalize(`${st.title} ${firstArtist}`);

    const deezerMatch = deezerByTitleArtist.get(titleArtistKey) || deezerByTitle.get(titleKey);

    if (deezerMatch && !usedDeezerIds.has(deezerMatch.deezerId)) {
      usedDeezerIds.add(deezerMatch.deezerId);
      return {
        ...st,
        previewUrl: st.previewUrl || deezerMatch.previewUrl,
        deezerId: deezerMatch.deezerId,
        source: 'spotify', // Always spotify branding
      };
    }

    return st;
  });

  return merged;
}

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/feat\.?/gi, '')
    .replace(/ft\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
