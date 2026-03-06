'use client';

import { useMemo } from 'react';
import { tracks, albums } from '@/data/tracks';
import { usePlayerStore, isGated } from '@/store/playerStore';
import { Play, Pause, Lock } from 'lucide-react';
import Image from 'next/image';

function getAlbumArt(track) {
  if (!track) return '/images/idmg-logo-white.png';
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || '/images/idmg-logo-white.png';
}

export default function RelatedTracks({ trackId, limit = 6 }) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);

  const related = useMemo(() => {
    const source = tracks.find(t => t.id === trackId);
    if (!source) return [];

    const scored = tracks
      .filter(t => t.id !== trackId && !t.isVault && !t.comingSoon)
      .map(t => {
        let score = 0;
        if (t.albumId && t.albumId === source.albumId) score += 50;
        if (t.producer && source.producer && t.producer === source.producer) score += 30;
        if (t.bpm && source.bpm && Math.abs(t.bpm - source.bpm) <= 15) score += 20;
        if (t.key && source.key && t.key === source.key) score += 15;
        if (t.featured && source.featured && t.featured === source.featured) score += 25;
        if (t.hitScore >= 85) score += 10;
        return { ...t, score };
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }, [trackId, limit]);

  if (related.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold text-white mb-4">If You Like This</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {related.map((track, i) => {
          const gated = isGated(track.id);
          const playing = currentTrack?.id === track.id && isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => !gated && setQueue(related, i)}
              className={`text-left rounded-xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] transition group ${
                gated ? 'opacity-50' : ''
              }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={getAlbumArt(track)}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {gated ? <Lock size={24} className="text-white/70" /> : playing ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium text-white truncate">{track.title}</p>
                <p className="text-xs text-white/40 truncate">{track.featured ? `ft. ${track.featured}` : 'Mike Page'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
