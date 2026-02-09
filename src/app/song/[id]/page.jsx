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
    return { title: 'Song Not Found | MyStation' };
  }

  const album = albums.find(a => a.id === track.albumId);
  const title = `${track.title}${track.featured ? ` ft. ${track.featured}` : ''} - Mike Page`;
  const description = `Stream "${track.title}" by Mike Page${track.featured ? ` ft. ${track.featured}` : ''}${track.producer ? ` | Prod. ${track.producer}` : ''} | ${track.album} (${track.year}) | Free on MyStation`;
  const url = `https://mystationlive.com/song/${track.id}`;
  const ogParams = new URLSearchParams({
    title: track.title,
    artist: `Mike Page${track.featured ? ` ft. ${track.featured}` : ''}`,
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

// Generate static params for all tracks
export async function generateStaticParams() {
  return tracks.map(t => ({ id: String(t.id) }));
}

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

  return <SongClient track={track} allTracks={tracks} albumArt={albumArt} />;
}
