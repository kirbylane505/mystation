/**
 * MYSTATION - Premium Track List
 * Navy blue theme
 */

'use client';

import { usePlayerStore } from '@/store/playerStore';
import { Play, Pause, Heart, MoreHorizontal, Clock, Music } from 'lucide-react';
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
      <div className="grid grid-cols-12 gap-4 px-6 py-3 text-white/30 text-xs uppercase tracking-wider border-b border-white/5 mb-2">
        {showNumber && <div className="col-span-1">#</div>}
        <div className={showNumber ? 'col-span-5' : 'col-span-6'}>Title</div>
        {showAlbum && <div className="col-span-3">Album</div>}
        <div className="col-span-2">Year</div>
        <div className="col-span-1 text-right"><Clock size={14} /></div>
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
              <div className="col-span-1 text-white/30 font-mono text-sm">
                <span className="group-hover:hidden">
                  {isPlayingThis ? (
                    <span className="text-blue-400 flex items-center">
                      <span className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                    </span>
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                <span className="hidden group-hover:block">
                  {isPlayingThis ? (
                    <Pause size={16} className="text-blue-400" />
                  ) : (
                    <Play size={16} className="text-white" />
                  )}
                </span>
              </div>
            )}

            {/* Title & Artist */}
            <div className={showNumber ? 'col-span-5' : 'col-span-6'}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-blue-900/30 rounded-lg flex items-center justify-center shrink-0 border border-white/5">
                  {track.isNew ? (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">NEW</span>
                  ) : (
                    <Music size={18} className="text-blue-400/60" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`font-medium truncate ${isCurrentTrack ? 'text-blue-400' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <p className="text-sm text-white/40 truncate">
                    Mike Page{track.featured && <span className="text-white/30"> • {track.featured}</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Album */}
            {showAlbum && (
              <div className="col-span-3 text-white/40 text-sm truncate">
                {track.album}
              </div>
            )}

            {/* Year */}
            <div className="col-span-2 text-white/40 text-sm">
              {track.year}
              {track.isExclusive && (
                <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Exclusive
                </span>
              )}
            </div>

            {/* Duration & Actions */}
            <div className="col-span-1 flex items-center justify-end gap-4">
              <button className="text-white/20 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition">
                <Heart size={16} />
              </button>
              <span className="text-white/30 text-sm font-mono">
                {track.duration}
              </span>
              <button className="text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
