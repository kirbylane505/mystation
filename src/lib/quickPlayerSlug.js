/**
 * Slug helpers for the shareable quick-player at /p/[slug].
 *
 * The slug is derived from the track title so links are human-readable:
 *   "For Us (Freestyle)"  →  for-us-freestyle
 *   "Heaven's Gate"       →  heavens-gate
 *   "R.U.N or R U Out"    →  run-or-r-u-out
 *
 * On collision (two tracks resolve to the same slug) the track id is
 * appended with a dash so one still wins deterministically:
 *   for-us-freestyle-516
 *
 * A quick-player page shows a 5-track mini-playlist: the hero track
 * from the URL + up to 4 companion picks (same artist, same album, or
 * recent featured drops). pickFiveStartingFrom() builds that list.
 */

import { tracks } from "@/data/tracks";

export function slugifyTitle(title) {
  if (!title) return "";
  return String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Return the canonical shareable slug for a single track. */
export function trackSlug(track) {
  if (!track) return "";
  return slugifyTitle(track.title);
}

/** Return every valid slug (for generateStaticParams). */
export function allTrackSlugs() {
  const counts = new Map();
  for (const t of tracks) {
    const s = slugifyTitle(t.title);
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  const slugs = [];
  for (const t of tracks) {
    const base = slugifyTitle(t.title);
    if (!base) continue;
    const slug = counts.get(base) > 1 ? `${base}-${t.id}` : base;
    slugs.push({ slug });
  }
  return slugs;
}

/** Resolve a URL slug back to a track. Tries the base slug first,
 *  then the id-suffixed form, then falls back to id-only. */
export function findTrackBySlug(slug) {
  if (!slug) return null;
  const lower = String(slug).toLowerCase();

  // Build a counts map to know which titles collide
  const counts = new Map();
  for (const t of tracks) {
    const s = slugifyTitle(t.title);
    counts.set(s, (counts.get(s) || 0) + 1);
  }

  // 1. direct base-slug match (only if unique OR the only hit we find)
  const direct = tracks.find((t) => slugifyTitle(t.title) === lower);
  if (direct && counts.get(lower) === 1) return direct;

  // 2. slug ends with -ID → extract and match
  const m = lower.match(/^(.*)-(\d+)$/);
  if (m) {
    const base = m[1];
    const id = parseInt(m[2], 10);
    const t = tracks.find((t) => t.id === id && slugifyTitle(t.title) === base);
    if (t) return t;
    // Also accept id-suffixed match even if base disagrees — allows callers
    // to construct `${anyTitle}-${id}` and still get the right track.
    const byId = tracks.find((t) => t.id === id);
    if (byId) return byId;
  }

  // 3. First track with that base slug (collision — pick first stable)
  if (direct) return direct;

  // 4. numeric-only slug: treat as id
  if (/^\d+$/.test(lower)) {
    const byId = tracks.find((t) => String(t.id) === lower);
    if (byId) return byId;
  }

  return null;
}

/** Derived display helpers */
export function trackDisplayArtist(track) {
  if (!track) return "";
  if (track.artist) return track.artist;
  if (track.featured) return `Mike Page ft. ${track.featured}`;
  return "Mike Page";
}

export function trackAlbumArt(track, { absolute = false } = {}) {
  if (!track) return null;
  // Explicit album art takes priority
  const art = track.albumArt || "/images/albums/cindys-son.jpg";
  if (!absolute) return art;
  if (art.startsWith("http")) return art;
  return `https://mystationlive.com${art}`;
}

/**
 * Build a 5-track mini-playlist starting from the hero track.
 * Picks companions in this priority order:
 *   1. Same artist tracks (not vault, not coming soon)
 *   2. Same album
 *   3. Featured drops (isFeatured flag)
 *   4. Recent year (2026)
 * Hero is always first. Returns at most 5 tracks.
 */
export function pickFiveStartingFrom(hero) {
  if (!hero) return [];
  const chosen = [hero];
  const seen = new Set([hero.id]);
  const heroArtist = hero.artist || "Mike Page";

  const playable = (t) =>
    t && !t.isVault && !t.comingSoon && (t.audioFile || "").length > 0;

  const addFrom = (pool) => {
    for (const t of pool) {
      if (chosen.length >= 5) return;
      if (seen.has(t.id)) continue;
      if (!playable(t)) continue;
      chosen.push(t);
      seen.add(t.id);
    }
  };

  // 1. Same artist
  addFrom(tracks.filter((t) => (t.artist || "") === heroArtist));
  // 2. Same album
  if (hero.albumId) {
    addFrom(tracks.filter((t) => t.albumId === hero.albumId));
  }
  // 3. Featured drops
  addFrom(tracks.filter((t) => t.isFeatured));
  // 4. Everything else (newest year first)
  addFrom([...tracks].sort((a, b) => (b.year || 0) - (a.year || 0)));

  return chosen.slice(0, 5);
}

export function trackPayload(track) {
  if (!track) return null;
  return {
    id: track.id,
    title: track.title,
    artist: trackDisplayArtist(track),
    album: track.album || "",
    year: track.year || "",
    duration: track.duration || "",
    audioFile: track.audioFile || "",
    albumArt: trackAlbumArt(track),
  };
}
