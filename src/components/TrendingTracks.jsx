'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { tracks, albums } from '@/data/tracks';
import { usePlayerStore, isGated } from '@/store/playerStore';
import { Play, Pause, Lock, Flame, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import TrackHeart from './TrackHeart';
import SongReactions from './SongReactions';
import CommentSection from './CommentSection';
import AddToPlaylist from './AddToPlaylist';
import { ShareButton } from './ShareTrack';

function getAlbumArt(track) {
  if (!track) return '/images/idmg-logo-white.png';
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || '/images/idmg-logo-white.png';
}

export default function TrendingTracks() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentTrack, setCommentTrack] = useState(null);
  const [mounted, setMounted] = useState(false);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);
  const togglePlay = usePlayerStore(s => s.togglePlay);

  useEffect(() => { setMounted(true); }, []);

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

  const handleTrackClick = useCallback((track, i) => {
    const gated = isGated(track.id);
    if (gated) {
      usePlayerStore.getState().openSubscribeModal(track);
      return;
    }
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    setQueue(displayTracks, i);
  }, [currentTrack?.id, togglePlay, setQueue, displayTracks]);

  if (loading) return null;
  if (displayTracks.length === 0) return null;

  return (
    <>
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
            <div
              key={track.id}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition group cursor-pointer"
              onClick={() => handleTrackClick(track, i)}
            >
              <span className="text-sm font-bold text-white/30 w-6 text-center shrink-0">
                {playing ? (
                  <span className="visualizer-bars">
                    <span className="visualizer-bar" style={{ animationDelay: '0s' }} />
                    <span className="visualizer-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="visualizer-bar" style={{ animationDelay: '0.4s' }} />
                  </span>
                ) : (
                  i + 1
                )}
              </span>
              <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                <Image src={getAlbumArt(track)} alt={track.title} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${playing ? 'text-blue-400' : 'text-white'}`}>{track.title}</p>
                <p className="text-xs text-white/40 truncate">{track.artist && track.artist !== 'Mike Page' ? track.artist : track.featured ? `ft. ${track.featured}` : 'Mike Page'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {track.plays && <span className="text-xs text-white/30 hidden sm:inline">{track.plays} plays</span>}
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <TrackHeart itemId={`track-${track.id}`} size={16} />
                </div>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <SongReactions trackId={track.id} size="xs" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setCommentTrack(track); }}
                  className="p-2 -m-1 text-white/40 hover:text-blue-400 transition"
                >
                  <MessageCircle size={15} />
                </button>
                <div onClick={(e) => e.stopPropagation()} className="hidden sm:flex items-center">
                  <AddToPlaylist track={track} size={15} />
                </div>
                <div onClick={(e) => e.stopPropagation()} className="hidden sm:flex items-center">
                  <ShareButton track={track} />
                </div>
                {gated ? (
                  <Lock size={14} className="text-white/30" />
                ) : playing ? (
                  <Pause size={16} className="text-blue-400" />
                ) : (
                  <Play size={16} className="text-white/40 group-hover:text-white transition" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>

    {/* Comment Modal */}
    {commentTrack && mounted && createPortal(
      <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center pb-[128px] md:pb-0" onClick={() => setCommentTrack(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div
          className="relative w-full md:w-[420px] md:max-h-[80vh] max-h-[65vh] rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden flex flex-col animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
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
