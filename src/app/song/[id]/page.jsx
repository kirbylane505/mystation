/**
 * MYSTATION - Song Landing Page
 * Dynamic OG tags per song for rich iMessage/social previews
 * Auto-plays the track when opened
 */

import { tracks, albums } from '@/data/tracks';
import SongClient from './SongClient';

// Dynamic OG metadata per song
export async function generateMetadata({ params }) {
  const { id } = params;
  const track = tracks.find(t => String(t.id) === String(id));

  if (!track) {
    return { title: 'Song Not Found' };
  }

  const album = albums.find(a => a.id === track.albumId);
  const artistName = track.artist || 'Mike Page';
  const title = `${track.title}${track.featured ? ` ft. ${track.featured}` : ''} - ${artistName}`;
  const description = `🎵 "${track.title}" - ${artistName}. Stream now on MyStation.`;
  const url = `https://mystationlive.com/song/${track.id}`;
  const ogParams = new URLSearchParams({
    title: track.title,
    artist: `${track.artist || 'Mike Page'}${track.featured ? ` ft. ${track.featured}` : ''}`,
    album: track.album || '',
    year: track.year || '2026',
  });
  const ogImage = `https://mystationlive.com/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'MyStation',
      type: 'music.song',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      audio: track.audioFile ? [{ url: `https://mystationlive.com${track.audioFile}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

// Dynamic rendering — too many tracks to statically generate all at build time
export const dynamic = 'force-dynamic';

export default function SongPage({ params }) {
  const { id } = params;
  const track = tracks.find(t => String(t.id) === String(id));
  const album = albums.find(a => a.id === track?.albumId);
  const albumArt = album?.coverImage || null;

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50 text-lg">Song not found</p>
      </div>
    );
  }

  const songJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "name": track.title,
    "url": `https://mystationlive.com/song/${track.id}`,
    "duration": track.duration || undefined,
    "byArtist": {
      "@type": "MusicGroup",
      "name": track.artist || "Mike Page",
    },
    "inAlbum": track.album ? {
      "@type": "MusicAlbum",
      "name": track.album,
      "image": albumArt ? `https://mystationlive.com${albumArt}` : undefined,
    } : undefined,
    "datePublished": track.year || "2026",
    "genre": "Hip-Hop",
    ...(track.featured && { "contributor": { "@type": "Person", "name": track.featured } }),
    ...(track.producer && { "producer": { "@type": "Person", "name": track.producer } }),
    "isAccessibleForFree": true,
    "publisher": {
      "@type": "Organization",
      "name": "IDMG - Impossible Dreamz Music Group",
      "url": "https://mystationlive.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(songJsonLd) }}
      />
      <SongClient track={track} allTracks={tracks} albumArt={albumArt} />
    </>
  );
}
