/**
 * QuickPlay — 5-song shareable player for friends, fans, and family.
 *
 * This root route renders the default volume (vol-1). Named volumes live at
 * /quickplay/[slug] (vol-1, vol-2, etc). Volumes are defined in
 * src/data/quickplayVolumes.js using track TITLES, not IDs, so new catalog
 * additions never break existing shared links.
 *
 * Open Graph metadata is configured for inline iMessage / Twitter / Facebook
 * play buttons. og:audio points to the first track on R2 so iMessage shows
 * a play control directly in the rich link preview.
 */
import { getDefaultVolume } from '@/data/quickplayVolumes';
import QuickPlayClient from './QuickPlayClient';

export const dynamic = 'force-dynamic';

const R2_BASE = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev';

function resolveAudioUrl(track) {
  if (!track?.audioFile) return '';
  if (track.audioFile.startsWith('http')) return track.audioFile;
  return `${R2_BASE}${track.audioFile.replace(/^\/audio/, '/audio')}`;
}

export async function generateMetadata() {
  const volume = getDefaultVolume();
  const firstTrack = volume.tracks[0];
  const firstAudio = resolveAudioUrl(firstTrack);

  const url = 'https://mystationlive.com/quickplay';
  const title = volume.name;
  const description = volume.description;

  const ogParams = new URLSearchParams({
    title: volume.tagline || '5 Track QuickPlay',
    artist: 'Mike Page · IDMG',
    album: volume.albumLine,
    year: '2026',
  });
  const ogImage = `https://mystationlive.com/api/og/quickplay?${ogParams.toString()}`;

  return {
    metadataBase: new URL('https://mystationlive.com'),
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'MyStation',
      type: 'music.playlist',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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
      title,
      description,
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
      'music:album': 'IDMG Mixtape',
      'al:web:url': url,
    },
  };
}

export default function QuickPlayPage() {
  const volume = getDefaultVolume();
  const audioUrls = volume.tracks.map(resolveAudioUrl);

  const playlistJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: volume.name,
    url: 'https://mystationlive.com/quickplay',
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
