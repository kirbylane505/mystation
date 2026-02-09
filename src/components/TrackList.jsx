/**
 * MYSTATION - Premium Track List
 * Navy blue theme with sharing & reactions
 */

'use client';

import { useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useEngagementStore } from '@/store/engagementStore';
import { Play, Pause, Heart, MoreHorizontal, Clock, Music, ExternalLink, MessageCircle } from 'lucide-react';
import { tracks } from '@/data/tracks';
import { ShareButton } from './ShareTrack';
import SongReactions from './SongReactions';
import CommentSection from './CommentSection';

export default function TrackList({ trackIds, showAlbum = true, showNumber = true, showComments = false }) {
  const { currentTrack, isPlaying, setQueue, togglePlay } = usePlayerStore();
  const [commentTrack, setCommentTrack] = useState(null);

  // Preserve trackIds order (filter loses intended ordering)
  const displayTracks = trackIds
    ? trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean)
    : tracks;

  const handleTrackClick = (track, index) => {
    // If stream only, open Spotify
    if (track.streamOnly) {
      window.open(track.spotify || track.apple, '_blank');
      return;
    }

    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setQueue(displayTracks, index);
    }
  };

  return (
    <>
    <div className="w-full">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-white/30 text-xs uppercase tracking-wider border-b border-white/5 mb-2">
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
            className={`track-item track-list-item group ${isCurrentTrack ? 'playing' : ''}`}
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => handleTrackClick(track, index)}
          >
            {/* Mobile Layout - Full names, no truncation */}
            <div className="flex md:hidden items-start gap-3 px-4 py-3">
              {/* Play indicator */}
              {showNumber && (
                <div className="text-white/30 font-mono text-sm w-6 shrink-0 pt-1">
                  {isPlayingThis ? (
                    <Play size={14} className="text-blue-400" fill="currentColor" />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </div>
              )}

              {/* Album art */}
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600/20 to-blue-900/30 rounded-lg flex items-center justify-center shrink-0 border border-white/5">
                {track.streamOnly ? (
                  <ExternalLink size={16} className="text-green-400" />
                ) : (
                  <Music size={16} className="text-blue-400/60" />
                )}
              </div>

              {/* Title & Artist - Full text, wraps naturally */}
              <div className="flex-1">
                <p className={`font-bold text-[15px] leading-tight ${isCurrentTrack ? 'text-blue-400' : 'text-white'}`}>
                  {track.title}
                </p>
                <p className="text-[13px] text-white/80 mt-0.5">
                  Mike Page{track.featured && ` ft. ${track.featured}`}
                </p>
                {track.producer && (
                  <p className="text-[11px] text-purple-400 mt-0.5">
                    Prod by {track.producer}
                  </p>
                )}
                <p className="text-[12px] text-white/60 mt-0.5">
                  {track.album} • {track.year}
                </p>
              </div>

              {/* Actions - Smaller on mobile */}
              <div className="flex items-center gap-1 shrink-0 pt-1">
                <div onClick={(e) => e.stopPropagation()}>
                  <SongReactions trackId={track.id} size="xs" />
                </div>
                {showComments && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCommentTrack(track); }}
                    className="p-1.5 text-white/40 hover:text-blue-400 transition"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareButton track={track} size="sm" />
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
              {/* Number / Play indicator */}
              {showNumber && (
                <div className="col-span-1 text-white/30 font-mono text-sm">
                  <span className="group-hover:hidden">
                    {isPlayingThis ? (
                      <span className="visualizer-bars">
                        <span className="visualizer-bar" style={{ animationDelay: '0s' }} />
                        <span className="visualizer-bar" style={{ animationDelay: '0.2s' }} />
                        <span className="visualizer-bar" style={{ animationDelay: '0.4s' }} />
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
                    {track.streamOnly ? (
                      <ExternalLink size={18} className="text-green-400" />
                    ) : track.isNew ? (
                      <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">NEW</span>
                    ) : (
                      <Music size={18} className="text-blue-400/60" />
                    )}
                  </div>
                  <div>
                    <p className={`font-bold ${isCurrentTrack ? 'text-blue-400' : 'text-white'}`}>
                      {track.title}
                    </p>
                    <p className="text-sm text-white/70">
                      Mike Page{track.featured && <span className="text-white/60"> • {track.featured}</span>}
                      {track.producer && <span className="text-purple-400"> • Prod by {track.producer}</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Album */}
              {showAlbum && (
                <div className="col-span-3 text-white/40 text-sm">
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
              <div className="col-span-1 flex items-center justify-end gap-3">
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <SongReactions trackId={track.id} size="sm" />
                </div>
                {showComments && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCommentTrack(track); }}
                    className="p-1.5 text-white/40 hover:text-blue-400 transition"
                    title="Comments"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <ShareButton track={track} />
                </div>
                <span className="text-white/30 text-sm font-mono hidden sm:inline">
                  {track.duration}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Comment Section Modal */}
    {commentTrack && (
      <CommentSection
        trackId={commentTrack.id}
        trackTitle={commentTrack.title}
        onClose={() => setCommentTrack(null)}
      />
    )}
    </>
  );
}
