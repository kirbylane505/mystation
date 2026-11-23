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

/** A track is safe to expose via /p/[slug] only if it's not in the vault,
 *  not marked coming-soon, and has an audio file that will actually play.
 *
 *  Nov 23 2026 investigation found all 36 `/audio/*` relative paths in
 *  the catalog return 404 on prod — only the 170 R2-hosted (http*) files
 *  are actually served. So the public player REQUIRES an http audioFile.
 *  Tracks with dead local paths stay invisible until the masters land on R2.
 *
 *  Public shareable links must NEVER leak unreleased, gated, or broken content. */
export function isPubliclyPlayable(track) {
  if (!track) return false;
  if (track.isVault) return false;
  if (track.comingSoon) return false;
  if (!track.audioFile) return false;
  // Only R2-hosted tracks are proven to play on prod. Local /audio/* paths
  // are broken (verified Nov 23 2026).
  if (!/^https?:\/\//i.test(track.audioFile)) return false;
  return true;
}

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

/** Return every valid slug (for generateStaticParams). Vault + comingSoon
 *  tracks are excluded — those must never be reachable via /p/. */
export function allTrackSlugs() {
  const publicTracks = tracks.filter(isPubliclyPlayable);
  const counts = new Map();
  for (const t of publicTracks) {
    const s = slugifyTitle(t.title);
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  const slugs = [];
  for (const t of publicTracks) {
    const base = slugifyTitle(t.title);
    if (!base) continue;
    const slug = counts.get(base) > 1 ? `${base}-${t.id}` : base;
    slugs.push({ slug });
  }
  return slugs;
}

/** Resolve a URL slug back to a track. Only returns PUBLICLY PLAYABLE
 *  tracks — vault + coming-soon tracks always return null, no matter
 *  how the slug is constructed. */
export function findTrackBySlug(slug) {
  if (!slug) return null;
  const lower = String(slug).toLowerCase();

  // Search only within the public catalog — vault/comingSoon invisible
  const publicTracks = tracks.filter(isPubliclyPlayable);

  const counts = new Map();
  for (const t of publicTracks) {
    const s = slugifyTitle(t.title);
    counts.set(s, (counts.get(s) || 0) + 1);
  }

  // 1. direct base-slug match (only if unique OR the only hit we find)
  const direct = publicTracks.find((t) => slugifyTitle(t.title) === lower);
  if (direct && counts.get(lower) === 1) return direct;

  // 2. slug ends with -ID → extract and match
  const m = lower.match(/^(.*)-(\d+)$/);
  if (m) {
    const base = m[1];
    const id = parseInt(m[2], 10);
    const t = publicTracks.find(
      (t) => t.id === id && slugifyTitle(t.title) === base,
    );
    if (t) return t;
    // id-suffixed match even if base disagrees — but only if still public
    const byId = publicTracks.find((t) => t.id === id);
    if (byId) return byId;
  }

  // 3. First track with that base slug (collision — pick first stable)
  if (direct) return direct;

  // 4. numeric-only slug: treat as id (still only public)
  if (/^\d+$/.test(lower)) {
    const byId = publicTracks.find((t) => String(t.id) === lower);
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
  // Nov 23 2026: companions must be truly PLAYABLE, not just "has an audioFile
  // string." 35 tracks in the catalog still reference dead `/audio/*` paths
  // that 404 on prod — those were leaking in as companions and breaking the
  // auto-advance. Mike's directive: "only use track with real audio."
  // isPubliclyPlayable requires http(s) audioFile and no vault/comingSoon flags.
  if (!isPubliclyPlayable(hero)) return [];
  const chosen = [hero];
  const seen = new Set([hero.id]);
  const heroArtist = hero.artist || "Mike Page";

  const playable = (t) => isPubliclyPlayable(t);

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
