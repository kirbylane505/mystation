/**
 * MYSTATION - Track List Component
 * Display and play tracks
 */

'use client';

import { usePlayerStore } from '@/store/playerStore';
import { Play, Pause, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { tracks } from '@/data/tracks';

export default function TrackList({ trackIds, showAlbum = true, showNumber = true }) {
  const { currentTrack, isPlaying, setQueue, togglePlay } = usePlayerStore();

  const displayTracks = trackIds
    ? tracks.filter(t => trackIds.includes(t.id))
    : tracks;

  const handleTrackClick = (track, index) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(displayTracks, index);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-white/40 text-sm border-b border-white/10 mb-2">
        {showNumber && <div className="col-span-1">#</div>}
        <div className={showNumber ? 'col-span-5' : 'col-span-6'}>Title</div>
        {showAlbum && <div className="col-span-3">Album</div>}
        <div className="col-span-2">Year</div>
        <div className="col-span-1 text-right"><Clock size={16} /></div>
      </div>

      {/* Tracks */}
      {displayTracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id;
        const isPlayingThis = isCurrentTrack && isPlaying;

        return (
          <div
            key={track.id}
            className={`track-item grid grid-cols-12 gap-4 items-center group ${
              isCurrentTrack ? 'playing' : ''
            }`}
            onClick={() => handleTrackClick(track, index)}
          >
            {/* Number / Play indicator */}
            {showNumber && (
              <div className="col-span-1 text-white/40">
                <span className="group-hover:hidden">
                  {isPlayingThis ? (
                    <span className="text-mystation-gold">▶</span>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden group-hover:block">
                  {isPlayingThis ? (
                    <Pause size={16} className="text-mystation-gold" />
                  ) : (
                    <Play size={16} className="text-white" />
                  )}
                </span>
              </div>
            )}

            {/* Title & Artist */}
            <div className={showNumber ? 'col-span-5' : 'col-span-6'}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-mystation-accent rounded flex items-center justify-center shrink-0">
                  {track.isNew && (
                    <span className="text-xs bg-mystation-gold text-mystation-dark px-1 rounded">NEW</span>
                  )}
                  {!track.isNew && <span className="text-lg">🎵</span>}
                </div>
                <div className="min-w-0">
                  <p className={`font-medium truncate ${isCurrentTrack ? 'text-mystation-gold' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-sm text-white/60 truncate">
                    Mike Page{track.featured && <span className="text-white/40"> ft. {track.featured}</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Album */}
            {showAlbum && (
              <div className="col-span-3 text-white/60 truncate">
                {track.album}
              </div>
            )}

            {/* Year */}
            <div className="col-span-2 text-white/60">
              {track.year}
              {track.isExclusive && (
                <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                  EXCLUSIVE
                </span>
              )}
            </div>

            {/* Duration & Actions */}
            <div className="col-span-1 flex items-center justify-end gap-3">
              <button className="text-white/40 hover:text-mystation-gold opacity-0 group-hover:opacity-100 transition">
                <Heart size={16} />
              </button>
              <span className="text-white/40 text-sm">
                {track.duration}
              </span>
              <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
