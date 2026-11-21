/**
 * MYSTATION - Local Catalog Search
 *
 * Nov 21 2026: Deezer integration REMOVED per Mike's directive.
 * Search is MyStation-only now — only Mike Page + IDMG roster tracks
 * surface. No external music catalogs, no previews from strangers.
 *
 * Returns the same shape the frontend expects so no page-level changes
 * are required: { tracks: [...], artists: [], query, sources: {} }.
 */

import { NextResponse } from "next/server";
import { tracks as CATALOG } from "@/data/tracks";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
      50,
    );

    if (q.length < 1) {
      return NextResponse.json({
        tracks: [],
        artists: [],
        query: "",
        sources: { mystation: true },
      });
    }

    // Local catalog scan — title, artist, album
    const scored = [];
    for (const t of CATALOG) {
      const title = (t.title || "").toLowerCase();
      const artist = (t.artist || "").toLowerCase();
      const album = (t.album || "").toLowerCase();

      let score = 0;
      if (title.startsWith(q)) score += 100;
      else if (title.includes(q)) score += 50;
      if (artist.startsWith(q)) score += 60;
      else if (artist.includes(q)) score += 25;
      if (album.includes(q)) score += 10;

      if (score > 0) {
        scored.push({
          score,
          track: {
            id: t.id,
            title: t.title,
            artist: t.artist || "",
            album: t.album || "",
            albumArt: t.coverArt || t.albumArt || null,
            albumArtSmall: t.coverArt || t.albumArt || null,
            previewUrl: t.audioUrl || null,
            duration: (t.duration || 0) * 1000,
            durationFormatted: formatDuration(t.duration || 0),
            source: "mystation",
            onMyStation: true,
          },
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, limit).map((s) => s.track);

    return NextResponse.json({
      tracks: results,
      artists: [],
      query: q,
      sources: { mystation: true },
    });
  } catch (error) {
    console.error("MyStation search error:", error.message);
    return NextResponse.json(
      { error: "Search temporarily unavailable", detail: error.message },
      { status: 500 },
    );
  }
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
