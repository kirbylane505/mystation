/**
 * MYSTATION - Premium Track List
 * Navy blue theme with sharing & reactions
 * Perf: React.memo TrackRow, zustand selectors
 */

'use client';

import { useState, memo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePlayerStore, isGated } from '@/store/playerStore';
import { Play, Pause, Clock, Music, ExternalLink, MessageCircle } from 'lucide-react';
import { tracks, albums } from '@/data/tracks';
import { ShareButton } from './ShareTrack';
import SongReactions from './SongReactions';
import TrackHeart from './TrackHeart';
import CommentSection from './CommentSection';
import AddToPlaylist from './AddToPlaylist';
import Image from 'next/image';

const IDMG_LOGO = '/images/idmg-logo-white.png';

function getTrackArt(track) {
  if (track.albumArt) return track.albumArt;
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || IDMG_LOGO;
}

function artClass(src) {
  return src === IDMG_LOGO ? 'object-contain p-1.5 bg-[#0a1628]' : 'object-cover';
}

// Memoized track row — only re-renders when its own state changes
const TrackRow = memo(function TrackRow({ track, index, isCurrentTrack, isPlayingThis, showNumber, showAlbum, showComments, onTrackClick, onCommentClick }) {
  return (
    <div
      className={`track-item track-list-item group ${isCurrentTrack ? 'playing' : ''}`}
      onClick={() => onTrackClick(track, index)}
    >
      {/* Mobile Layout */}
      <div className="flex md:hidden items-center gap-2.5 px-3 py-2">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
          <Image src={getTrackArt(track)} alt="" fill className={artClass(getTrackArt(track))} />
          {isPlayingThis ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play size={14} className="text-blue-400" fill="currentColor" />
            </div>
          ) : track.streamOnly ? (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <ExternalLink size={14} className="text-green-400" />
            </div>
          ) : null}{/* clean thumbnail */}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-[14px] leading-tight truncate ${isCurrentTrack ? 'text-blue-400' : 'text-white'}`}>
            {track.title}
          </p>
          <p className="text-[12px] text-white/60 truncate mt-0.5">
            {track.artist || 'Mike Page'}{track.featured ? ` ft. ${track.featured}` : ''}{track.producer ? ` • ${track.producer}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <div className="p-2.5 -m-1" onClick={(e) => e.stopPropagation()}>
            <TrackHeart itemId={`track-${track.id}`} size={16} />
          </div>
          <div className="p-2.5 -m-1" onClick={(e) => e.stopPropagation()}>
            <SongReactions trackId={track.id} size="xs" />
          </div>
          {showComments && (
            <button
              onClick={(e) => { e.stopPropagation(); onCommentClick(track); }}
              className="p-3 -m-1 text-white/40 hover:text-blue-400 transition"
            >
              <MessageCircle size={16} />
            </button>
          )}
          <div className="p-1 -m-1" onClick={(e) => e.stopPropagation()}>
            <AddToPlaylist track={track} size={16} />
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-4 items-center">
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
        <div className={showNumber ? 'col-span-5' : 'col-span-6'}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
              <Image src={getTrackArt(track)} alt="" fill className={artClass(getTrackArt(track))} />
              {track.streamOnly ? (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <ExternalLink size={18} className="text-green-400" />
                </div>
              ) : track.isNew ? (
                <div className="absolute top-0.5 left-0.5">
                  <span className="text-[8px] font-bold bg-blue-500 text-white px-1 py-0.5 rounded">NEW</span>
                </div>
              ) : null}
            </div>
            <div>
              <p className={`font-bold ${isCurrentTrack ? 'text-blue-400' : 'text-white'}`}>
                {track.title}
              </p>
              <p className="text-sm text-white/70">
                {track.artist || 'Mike Page'}{track.featured && <span className="text-white/60"> ft. {track.featured}</span>}
                {track.producer && <span className="text-purple-400"> • Prod by {track.producer}</span>}
              </p>
            </div>
          </div>
        </div>
        {showAlbum && (
          <div className="col-span-3 text-white/40 text-sm">
            {track.album}
          </div>
        )}
        <div className="col-span-2 text-white/40 text-sm">
          {track.year}
          {track.isExclusive && (
            <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Exclusive
            </span>
          )}
        </div>
        <div className="col-span-1 flex items-center justify-end gap-3">
          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
            <TrackHeart itemId={`track-${track.id}`} size={18} />
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
            <SongReactions trackId={track.id} size="sm" />
          </div>
          {showComments && (
            <button
              onClick={(e) => { e.stopPropagation(); onCommentClick(track); }}
              className="p-1.5 text-white/40 hover:text-blue-400 transition"
              title="Comments"
            >
              <MessageCircle size={16} />
            </button>
          )}
          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
            <AddToPlaylist track={track} size={16} />
          </div>
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
});

export default function TrackList({ trackIds, showAlbum = true, showNumber = true, showComments = true }) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const [commentTrack, setCommentTrack] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Preserve trackIds order (filter loses intended ordering)
  // Filter out isComingSoon tracks — they are locked and not playable
  const displayTracks = (trackIds
    ? trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean)
    : tracks
  ).filter(t => !t.isComingSoon);

  const handleTrackClick = useCallback((track, index) => {
    if (track.isComingSoon) return; // locked track
    if (track.streamOnly) {
      window.open(track.spotify || track.apple, '_blank');
      return;
    }
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    // Universal gate — 2 free songs total for non-subscribers
    if (isGated(track)) {
      usePlayerStore.getState().openSubscribeModal(track);
      return;
    }
    setQueue(displayTracks, index);
  }, [currentTrack?.id, togglePlay, setQueue, displayTracks]);

  const handleCommentClick = useCallback((track) => {
    setCommentTrack(track);
  }, []);

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

      {/* Tracks — memoized rows */}
      {displayTracks.map((track, index) => (
        <TrackRow
          key={track.id}
          track={track}
          index={index}
          isCurrentTrack={currentTrack?.id === track.id}
          isPlayingThis={currentTrack?.id === track.id && isPlaying}
          showNumber={showNumber}
          showAlbum={showAlbum}
          showComments={showComments}
          onTrackClick={handleTrackClick}
          onCommentClick={handleCommentClick}
        />
      ))}
    </div>

    {/* Comment Modal — portaled to body to escape parent transforms */}
    {commentTrack && mounted && createPortal(
      <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center pb-[128px] md:pb-0" onClick={() => setCommentTrack(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative w-full md:w-[420px] md:max-h-[80vh] max-h-[65vh] rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden flex flex-col animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <MessageCircle size={14} className="text-blue-400" />
                Comments
              </h3>
              <p className="text-[11px] text-white/30 mt-0.5 truncate">{commentTrack.title}</p>
            </div>
            <button onClick={() => setCommentTrack(null)} className="p-2 text-white/40 hover:text-white transition">
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>

          {/* Comment Section — modal mode */}
          <div className="flex-1 overflow-hidden">
            <CommentSection
              trackId={commentTrack.id}
              trackTitle={commentTrack.title}
              modalMode={true}
            />
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
