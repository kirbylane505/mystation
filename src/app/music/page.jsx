/**
 * MYSTATION - Music Browse Page
 * Dynamic OG tags for link previews with album art
 */

import { tracks, albums } from '@/data/tracks';
import MusicPageClient from './MusicPageClient';

// Dynamic metadata for link previews
export async function generateMetadata({ searchParams }) {
  const trackId = searchParams?.track;

  if (trackId) {
    const track = tracks.find(t => t.id === parseInt(trackId));
    if (track) {
      const album = albums.find(a => a.id === track.albumId);
      const imageUrl = album?.coverImage || '/images/albums/cindys-son.jpg';

      return {
        title: `${track.title} - Mike Page | MyStation`,
        description: `Listen to "${track.title}" by Mike Page. Stream free on MyStation - all donations support the Mike Page Foundation.`,
        openGraph: {
          title: `🎵 ${track.title} - Mike Page`,
          description: `Tap to listen & drop a 🔥 if it's fire!\n\nStream free on MyStation`,
          images: [
            {
              url: `https://mystation.vercel.app${imageUrl}`,
              width: 1200,
              height: 630,
              alt: `${track.title} - Mike Page`,
            }
          ],
          type: 'music.song',
          siteName: 'MyStation',
        },
        twitter: {
          card: 'summary_large_image',
          title: `🎵 ${track.title} - Mike Page`,
          description: `Tap to listen & drop a 🔥 if it's fire!`,
          images: [`https://mystation.vercel.app${imageUrl}`],
        },
      };
    }
  }

  // Default metadata
  return {
    title: 'Browse Music | MyStation',
    description: 'Stream Mike Page music for free. All donations support the Mike Page Foundation.',
    openGraph: {
      title: 'MyStation - Mike Page Music',
      description: 'Stream free. Support the Foundation.',
      images: [
        {
          url: 'https://mystation.vercel.app/images/albums/cindys-son.jpg',
          width: 1200,
          height: 630,
        }
      ],
    },
  };
}

export default function MusicPage({ searchParams }) {
  const trackId = searchParams?.track;
  return <MusicPageClient initialTrackId={trackId} />;
}
