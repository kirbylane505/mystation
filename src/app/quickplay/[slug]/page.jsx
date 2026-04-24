/**
 * QuickPlay · Volume Route — /quickplay/[slug]
 *
 * Renders a named QuickPlay volume (vol-1, vol-2, etc.) by looking up
 * the volume config in src/data/quickplayVolumes.js. Track list is
 * resolved from TITLES, not IDs, so catalog changes don't break shares.
 */
import { notFound } from 'next/navigation';
import { getVolume, getAllVolumeSlugs } from '@/data/quickplayVolumes';
import QuickPlayClient from '../QuickPlayClient';

export const dynamic = 'force-dynamic';

const R2_BASE = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev';

function resolveAudioUrl(track) {
  if (!track?.audioFile) return '';
  if (track.audioFile.startsWith('http')) return track.audioFile;
  return `${R2_BASE}${track.audioFile.replace(/^\/audio/, '/audio')}`;
}

export async function generateStaticParams() {
  return getAllVolumeSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const volume = getVolume(slug);
  if (!volume) return { title: 'QuickPlay — Not Found' };

  const firstTrack = volume.tracks[0];
  const firstAudio = resolveAudioUrl(firstTrack);
  const url = `https://mystationlive.com/quickplay/${slug}`;

  const ogParams = new URLSearchParams({
    title: `${volume.tagline || volume.name}`,
    artist: 'Mike Page · IDMG',
    album: volume.albumLine,
    year: '2026',
  });
  const ogImage = `https://mystationlive.com/api/og/quickplay?${ogParams.toString()}`;

  return {
    metadataBase: new URL('https://mystationlive.com'),
    title: volume.name,
    description: volume.description,
    openGraph: {
      title: volume.name,
      description: volume.description,
      url,
      siteName: 'MyStation',
      type: 'music.playlist',
      images: [{ url: ogImage, width: 1200, height: 630, alt: volume.name }],
      audio: [
        {
          url: firstAudio,
          secureUrl: firstAudio,
          type: 'audio/mp4',
        },
      ],
    },
    twitter: {
      card: 'player',
      title: volume.name,
      description: volume.description,
      images: [ogImage],
      players: [
        {
          playerUrl: `https://mystationlive.com/embed/${firstTrack?.id || 500}`,
          streamUrl: firstAudio,
          width: 480,
          height: 80,
        },
      ],
    },
    other: {
      'music:song': firstAudio,
      'music:musician': 'Mike Page',
      'music:album': 'IDMG',
      'al:web:url': url,
    },
  };
}

export default async function QuickPlayVolumePage({ params }) {
  const { slug } = await params;
  const volume = getVolume(slug);
  if (!volume || volume.tracks.length === 0) notFound();

  const audioUrls = volume.tracks.map(resolveAudioUrl);

  const playlistJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: volume.name,
    url: `https://mystationlive.com/quickplay/${slug}`,
    numTracks: volume.tracks.length,
    track: volume.tracks.map((t, i) => ({
      '@type': 'MusicRecording',
      position: i + 1,
      name: t.title,
      url: `https://mystationlive.com/song/${t.id}`,
      byArtist: { '@type': 'MusicGroup', name: t.artist || 'Mike Page' },
      duration: t.duration,
      audio: audioUrls[i],
      isAccessibleForFree: true,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(playlistJsonLd) }}
      />
      <QuickPlayClient tracks={volume.tracks} volume={volume} />
    </>
  );
}
