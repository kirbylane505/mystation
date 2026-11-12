/**
 * MYSTATION - Unified Global Music Search
 * Deezer-sourced catalog discovery with 30s previews.
 */

import { NextResponse } from "next/server";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 200;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
      25,
    );

    if (q.length < 1) {
      return NextResponse.json(
        { error: "Search query required" },
        { status: 400 },
      );
    }

    const cacheKey = `unified:${q.toLowerCase()}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const deezer = await searchDeezer(q, limit);

    const result = {
      tracks: deezer.tracks.slice(0, limit),
      artists: [],
      query: q,
      sources: { deezer: true },
    };

    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    cache.set(cacheKey, { data: result, ts: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Unified search error:", error.message);
    return NextResponse.json(
      { error: "Search temporarily unavailable", detail: error.message },
      { status: 500 },
    );
  }
}

async function searchDeezer(q, limit) {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return { tracks: [] };
    const data = await res.json();

    const tracks = (data.data || []).map((t) => ({
      deezerId: t.id,
      title: t.title_short || t.title,
      artist: t.artist?.name || "Unknown",
      album: t.album?.title || "",
      albumArt: t.album?.cover_xl || t.album?.cover_big || null,
      albumArtSmall: t.album?.cover_medium || t.album?.cover_small || null,
      previewUrl: t.preview || null,
      duration: t.duration * 1000,
      durationFormatted: `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}`,
      explicit: t.explicit_lyrics || false,
      rank: t.rank || 0,
      source: "deezer",
    }));

    return { tracks };
  } catch (err) {
    console.error("Deezer search failed:", err.message);
    return { tracks: [] };
  }
}
