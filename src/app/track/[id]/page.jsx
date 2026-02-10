/**
 * MYSTATION - Track Page with Dynamic OG Tags
 * Shows OG metadata for link previews, then redirects to player
 */

import { tracks, albums } from '@/data/tracks';
import { redirect } from 'next/navigation';
import TrackRedirect from './TrackRedirect';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const track = tracks.find(t => t.id === parseInt(id));

  if (!track) {
    return { title: 'Track Not Found | MyStation' };
  }

  const album = albums.find(a => a.id === track.albumId);
  const imageUrl = album?.coverImage || '/images/albums/cindys-son.jpg';

  return {
    title: `${track.title} - Mike Page`,
    description: `Listen to "${track.title}" by Mike Page on MyStation`,
    openGraph: {
      title: `🎵 ${track.title} - Mike Page`,
      description: `Tap to listen & drop a 🔥 if it's fire!`,
      url: `https://mystationlive.com/track/${id}`,
      siteName: 'MyStation',
      images: [{
        url: `https://mystationlive.com${imageUrl}`,
        width: 1200,
        height: 630,
        alt: `${track.title} by Mike Page`,
      }],
      type: 'music.song',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: `🎵 ${track.title} - Mike Page`,
      description: `Tap to listen & drop a 🔥 if it's fire!`,
      images: [`https://mystationlive.com${imageUrl}`],
    },
  };
}

export default async function TrackPage({ params }) {
  const { id } = await params;
  const track = tracks.find(t => t.id === parseInt(id));

  // Block direct access to vault tracks — redirect to vault page
  if (track && (track.albumId === 'vault' || track.album === 'Vault')) {
    redirect('/vault');
  }

  return <TrackRedirect trackId={id} trackTitle={track?.title || 'Track'} />;
}
