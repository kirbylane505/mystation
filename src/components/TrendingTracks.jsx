'use client';

import { useState, useEffect } from 'react';
import { tracks, albums } from '@/data/tracks';
import { usePlayerStore, isGated } from '@/store/playerStore';
import { Play, Pause, Lock, Flame } from 'lucide-react';
import Image from 'next/image';

function getAlbumArt(track) {
  if (!track) return '/images/idmg-logo-white.png';
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || '/images/idmg-logo-white.png';
}

export default function TrendingTracks() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(data => {
        const matched = (data.tracks || [])
          .map(t => {
            const track = tracks.find(tr => {
              const filename = tr.audioFile?.split('/').pop() || '';
              return filename === t.title;
            });
            return track ? { ...track, plays: t.plays } : null;
          })
          .filter(Boolean);
        setTrending(matched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fallback: if no analytics data yet, show top hitScore tracks
  const displayTracks = trending.length > 0 ? trending : tracks
    .filter(t => !t.isVault && !t.comingSoon && t.hitScore)
    .sort((a, b) => (b.hitScore || 0) - (a.hitScore || 0))
    .slice(0, 10)
    .map(t => ({ ...t, plays: null }));

  if (loading) return null;
  if (displayTracks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Flame size={20} className="text-orange-400" />
        <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
      </div>
      <div className="glass rounded-2xl divide-y divide-white/[0.04]">
        {displayTracks.slice(0, 10).map((track, i) => {
          const gated = isGated(track.id);
          const playing = currentTrack?.id === track.id && isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => !gated && setQueue(displayTracks, i)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition text-left"
            >
              <span className="text-sm font-bold text-white/30 w-6 text-center">{i + 1}</span>
              <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                <Image src={getAlbumArt(track)} alt={track.title} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{track.title}</p>
                <p className="text-xs text-white/40 truncate">{track.featured ? `ft. ${track.featured}` : 'Mike Page'}</p>
              </div>
              <div className="flex items-center gap-2">
                {track.plays && <span className="text-xs text-white/30">{track.plays} plays</span>}
                {gated ? (
                  <Lock size={14} className="text-white/30" />
                ) : playing ? (
                  <Pause size={16} className="text-blue-400" />
                ) : (
                  <Play size={16} className="text-white/40" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
