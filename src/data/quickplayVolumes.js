/**
 * QuickPlay Volumes — multi-volume config for /quickplay/[slug].
 *
 * Each volume is a curated 5-track drop identified by TITLES (not IDs),
 * matched against the main tracks catalog at render time. Artist and albumId
 * are optional disambiguators when a title repeats across the catalog.
 */

import { tracks } from './tracks';

function findTrack({ title, artist, albumId }) {
  return tracks.find((t) => {
    if (t.title !== title) return false;
    if (artist && t.artist !== artist) return false;
    if (albumId && t.albumId !== albumId) return false;
    return true;
  });
}

export const QUICKPLAY_VOLUMES = {
  'vol-1': {
    slug: 'vol-1',
    volumeNumber: 1,
    name: 'Mike Page · QuickPlay Vol 1',
    tagline: 'The IDMG Mixtape 5',
    description:
      '5 hand-picked Mike Page tracks from the IDMG Mixtape. Listen, rank, then unlock the full catalog on MyStation.',
    albumLine: "I Want This One · R.U.N · Heaven's Gate · F.I.L.A. · Be Alright",
    trackRefs: [
      { title: 'I Want This One' },
      { title: 'R.U.N or R U Out' },
      { title: "Heaven's Gate" },
      { title: 'F.I.L.A.' },
      { title: 'Be Alright' },
    ],
  },
  'vol-2': {
    slug: 'vol-2',
    volumeNumber: 2,
    name: 'Mike Page · QuickPlay Vol 2',
    tagline: 'The New 5',
    description:
      '5 fresh drops from Mike Page and the IDMG camp. Listen, rank, then unlock the full catalog on MyStation.',
    albumLine:
      "Embellishments · Please Don't · Lizzo · Favorite Person · Having My Way",
    trackRefs: [
      { title: 'Embellishments', artist: 'Mike Page x TKP' },
      { title: "Please Don't", artist: 'Djuan Covington' },
      { title: 'Lizzo', artist: 'Mike Page', albumId: 'singles-2026' },
      { title: 'Favorite Person', albumId: 'singles-2026' },
      { title: 'Having My Way', artist: 'Mike Page', albumId: 'singles-2026' },
    ],
  },
};

export function getVolume(slug) {
  const vol = QUICKPLAY_VOLUMES[slug];
  if (!vol) return null;
  const volumeTracks = vol.trackRefs.map(findTrack).filter(Boolean);
  return { ...vol, tracks: volumeTracks };
}

export function getAllVolumeSlugs() {
  return Object.keys(QUICKPLAY_VOLUMES);
}

export function getDefaultVolume() {
  return getVolume('vol-1');
}
