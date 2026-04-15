import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';
import { radioDrops, DROPS_EVERY_N } from '@/data/radioDrops';

export const dynamic = 'force-dynamic';

const QUEUE_SIZE = 200;
const R2_BASE = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/';

// Some audioFile strings in tracks.js come pre-encoded (%20), others raw.
// Decode first, then encode — idempotent for both shapes.
function encodeFilename(filename) {
  let decoded = filename;
  try { decoded = decodeURIComponent(filename); } catch { /* not valid % encoding — use raw */ }
  return encodeURIComponent(decoded);
}

function normalizeMikePageTrack(t) {
  let audioFile;
  if (t.audioFile?.startsWith('http')) {
    audioFile = t.audioFile;
  } else {
    // R2 bucket is flat — use filename only, matching /api/audio/stream
    const filename = (t.audioFile || '').split('/').pop();
    audioFile = `${R2_BASE}${encodeFilename(filename)}`;
  }
  return {
    id: `mp-${t.id}`,
    title: t.title,
    artist: t.artist || 'Mike Page',
    album: t.album || 'Mike Page',
    duration: t.duration || null,
    audioFile,
    coverArt: '/images/albums/idmg-mixtape-cover.png',
    stationArtist: 'mike-page',
  };
}

function normalizeCreatorTrack(t, creator) {
  return {
    id: `cr-${t.id}`,
    title: t.title,
    artist: t.artist || creator.display_name,
    album: t.album || '',
    duration: t.duration || null,
    audioFile: t.audio_url,
    coverArt: t.cover_url || creator.avatar_url || '/images/idmg-logo-white.png',
    stationArtist: creator.slug,
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getAllCreatorTracksExcept(supabase, excludeSlug) {
  const { data: creators } = await supabase
    .from('creators')
    .select('id, slug, display_name, avatar_url')
    .eq('subscription_status', 'active')
    .neq('slug', excludeSlug);
  if (!creators?.length) return [];
  const creatorMap = new Map(creators.map((c) => [c.id, c]));
  const ids = creators.map((c) => c.id);
  const { data: rows } = await supabase
    .from('creator_tracks')
    .select('id, title, artist, album, duration, audio_url, cover_url, creator_id')
    .in('creator_id', ids)
    .eq('status', 'active')
    .not('audio_url', 'is', null);
  return (rows || []).map((t) => normalizeCreatorTrack(t, creatorMap.get(t.creator_id)));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('artist') || 'mike-page';
  const excludeParam = searchParams.get('exclude') || '';
  const excludeSet = new Set(excludeParam.split(',').filter(Boolean));
  const supabase = getSupabaseAdmin();

  // Primary track pool
  let primaryPool = [];
  if (slug === 'mike-page') {
    primaryPool = mikePageTracks
      .filter((t) => t.audioFile && !t.isComingSoon)
      .map(normalizeMikePageTrack);
  } else {
    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug, display_name, avatar_url')
      .eq('slug', slug)
      .eq('subscription_status', 'active')
      .maybeSingle();
    if (creator) {
      const { data: rows } = await supabase
        .from('creator_tracks')
        .select('id, title, artist, album, duration, audio_url, cover_url, creator_id')
        .eq('creator_id', creator.id)
        .eq('status', 'active')
        .not('audio_url', 'is', null);
      primaryPool = (rows || []).map((t) => normalizeCreatorTrack(t, creator));
    }
  }

  if (primaryPool.length === 0) {
    return NextResponse.json({ queue: [], error: 'No tracks for station' }, { status: 404 });
  }

  // Exclude previously-played tracks from both pools
  primaryPool = primaryPool.filter((t) => !excludeSet.has(String(t.id)));

  // Other creators pool (for smart mix)
  let otherPool = await getAllCreatorTracksExcept(supabase, slug);
  // Also mix mike-page into non-mike-page stations
  if (slug !== 'mike-page') {
    otherPool.push(
      ...mikePageTracks
        .filter((t) => t.audioFile && !t.isComingSoon)
        .map(normalizeMikePageTrack)
    );
  }
  otherPool = otherPool.filter((t) => !excludeSet.has(String(t.id)));

  // If both pools are exhausted after exclusion, reset exclusion (loop catalog)
  const everythingExcluded = primaryPool.length === 0 && otherPool.length === 0;
  if (everythingExcluded) {
    // Re-hydrate primary pool from scratch without exclusion so the radio never goes silent
    if (slug === 'mike-page') {
      primaryPool = mikePageTracks
        .filter((t) => t.audioFile && !t.isComingSoon)
        .map(normalizeMikePageTrack);
    } else {
      const { data: creator } = await supabase
        .from('creators')
        .select('id, slug, display_name, avatar_url')
        .eq('slug', slug)
        .maybeSingle();
      if (creator) {
        const { data: rows } = await supabase
          .from('creator_tracks')
          .select('id, title, artist, album, duration, audio_url, cover_url, creator_id')
          .eq('creator_id', creator.id)
          .eq('status', 'active')
          .not('audio_url', 'is', null);
        primaryPool = (rows || []).map((t) => normalizeCreatorTrack(t, creator));
      }
    }
  }

  // Smart mix ratio: 80/20 default, 60/40 if primary < 10 tracks
  const ratio = primaryPool.length < 10 ? 0.6 : 0.8;

  // Build the queue using each pool as a NO-REPEAT shuffled source.
  // Take each track only once until a pool is drained, then skip to the other.
  const primary = shuffle(primaryPool);
  const other = shuffle(otherPool);
  let pi = 0;
  let oi = 0;
  const queue = [];
  const seen = new Set();

  for (let i = 0; i < QUEUE_SIZE; i++) {
    if (pi >= primary.length && oi >= other.length) break; // both drained
    const wantPrimary = (i % 5) < Math.round(ratio * 5);
    let picked = null;
    if (wantPrimary && pi < primary.length) {
      picked = primary[pi++];
    } else if (oi < other.length) {
      picked = other[oi++];
    } else if (pi < primary.length) {
      picked = primary[pi++];
    }
    if (picked && !seen.has(picked.id)) {
      seen.add(picked.id);
      queue.push(picked);
    }
  }

  // Interleave IDMG drops — short vocal tags/bumpers between tracks.
  // Format: drops look like regular queue entries with isDrop: true
  // If no drops configured, queue passes through unchanged.
  const withDrops = [];
  if (radioDrops.length > 0) {
    for (let i = 0; i < queue.length; i++) {
      withDrops.push(queue[i]);
      if ((i + 1) % DROPS_EVERY_N === 0 && i < queue.length - 1) {
        const drop = radioDrops[Math.floor(Math.random() * radioDrops.length)];
        withDrops.push({
          id: `drop-${drop.id}-${i}`,
          title: drop.title,
          artist: 'IDMG',
          album: 'Drops',
          duration: drop.duration || '0:04',
          audioFile: drop.audioFile,
          coverArt: '/images/idmg-logo-white.png',
          stationArtist: slug,
          isDrop: true,
        });
      }
    }
  }
  const finalQueue = withDrops.length > 0 ? withDrops : queue;

  return NextResponse.json({
    station: { slug, name: slug === 'mike-page' ? 'Mike Page' : slug },
    queue: finalQueue,
    primaryCount: queue.filter((t) => t.stationArtist === slug).length,
    otherCount: queue.filter((t) => t.stationArtist !== slug).length,
    dropCount: finalQueue.length - queue.length,
  });
}
