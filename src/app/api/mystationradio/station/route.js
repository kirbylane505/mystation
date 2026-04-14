import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';

export const dynamic = 'force-dynamic';

const QUEUE_SIZE = 200;
const R2_BASE = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/';

function normalizeMikePageTrack(t) {
  const audioFile = t.audioFile?.startsWith('http')
    ? t.audioFile
    : `${R2_BASE}${(t.audioFile || '').replace(/^\/audio\//, '')}`;
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
  const supabase = getSupabaseAdmin();

  // Primary track pool
  let primaryPool = [];
  if (slug === 'mike-page') {
    primaryPool = mikePageTracks
      .filter((t) => t.audioFile)
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

  // Other creators pool (for smart mix)
  const otherPool = await getAllCreatorTracksExcept(supabase, slug);
  // Also mix mike-page into non-mike-page stations
  if (slug !== 'mike-page') {
    otherPool.push(...mikePageTracks.filter((t) => t.audioFile).map(normalizeMikePageTrack));
  }

  // Smart mix ratio: 80/20 default, 60/40 if primary < 10 tracks
  const ratio = primaryPool.length < 10 ? 0.6 : 0.8;
  const primaryCount = Math.round(QUEUE_SIZE * ratio);
  const otherCount = QUEUE_SIZE - primaryCount;

  // Fill with shuffled picks (cycle pools to avoid duplicates until forced)
  const queue = [];
  const primary = shuffle(primaryPool);
  const other = shuffle(otherPool);
  let pi = 0;
  let oi = 0;
  for (let i = 0; i < QUEUE_SIZE; i++) {
    const isPrimary = (i % 5) < Math.round(ratio * 5); // 4 of every 5 = primary at 80%
    if (isPrimary && primary.length) {
      queue.push(primary[pi % primary.length]);
      pi++;
    } else if (other.length) {
      queue.push(other[oi % other.length]);
      oi++;
    } else if (primary.length) {
      queue.push(primary[pi % primary.length]);
      pi++;
    }
  }

  return NextResponse.json({
    station: { slug, name: slug === 'mike-page' ? 'Mike Page' : slug },
    queue: shuffle(queue).slice(0, QUEUE_SIZE),
    primaryCount,
    otherCount,
  });
}
