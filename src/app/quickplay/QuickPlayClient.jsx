'use client';

/**
 * QuickPlay client — gold-standard 5-track player UI.
 * - Uses global playerStore for audio (Player.jsx already mounted in layout)
 * - Track list with click-to-play
 * - Star ratings per track (1-5) → POST to /api/quickplay/rank
 * - Subscribe CTA + share buttons
 */

import { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Star, Share2, Copy, Check, Music2 } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import Link from 'next/link';

const ALBUM_ART = '/images/albums/idmg-mixtape-cover.png';

export default function QuickPlayClient({ tracks, volume }) {
  const volumeSlug = volume?.slug || 'vol-1';
  const volumeName = volume?.name || 'Mike Page · QuickPlay';
  const volumeTagline = volume?.tagline || '5-Track QuickPlay · Curated by Mike';
  const volumeDescription =
    volume?.description ||
    '5 hand-picked tracks. Listen. Rank your favorite. Then unlock the full catalog on MyStation.';
  const shareUrl = volume?.slug && volume.slug !== 'vol-1'
    ? `https://mystationlive.com/quickplay/${volume.slug}`
    : 'https://mystationlive.com/quickplay';
  const ranksKey = `quickplay_my_ranks_${volumeSlug}`;

  const { currentTrack, isPlaying, setQueue, setTrack, togglePlay, playNext, playPrev } = usePlayerStore();
  const [rankings, setRankings] = useState({}); // {trackId: {avg, count, mine}}
  const [submittedTracks, setSubmittedTracks] = useState({});
  const [copied, setCopied] = useState(false);

  // Log visitor tracking event (fire-and-forget). Volume is attached so
  // analytics can separate drops by volume slug.
  const logEvent = (eventType, extra = {}) => {
    try {
      fetch('/api/quickplay/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType, volume: volumeSlug, ...extra }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };

  // Load existing rankings + log page view on mount
  useEffect(() => {
    logEvent('page_view');
    const ids = tracks.map((t) => t.id).join(',');
    fetch(`/api/quickplay/rank?ids=${ids}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rankings) setRankings(data.rankings);
      })
      .catch(() => {});
    try {
      const saved = JSON.parse(localStorage.getItem(ranksKey) || '{}');
      setSubmittedTracks(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, volumeSlug]);

  const handlePlayAll = () => {
    setQueue(tracks, 0);
    logEvent('play_all');
    if (tracks[0]) logEvent('play_track', { track_id: tracks[0].id });
  };

  const handlePlayTrack = (idx) => {
    setQueue(tracks, idx);
    if (tracks[idx]) logEvent('play_track', { track_id: tracks[idx].id });
  };

  const handleRank = async (trackId, stars) => {
    setSubmittedTracks((prev) => {
      const next = { ...prev, [trackId]: stars };
      try {
        localStorage.setItem(ranksKey, JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      const res = await fetch('/api/quickplay/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, stars, volume: volumeSlug }),
      });
      const data = await res.json();
      if (data.avg !== undefined) {
        setRankings((prev) => ({
          ...prev,
          [trackId]: { avg: data.avg, count: data.count, mine: stars },
        }));
      }
    } catch {}
    logEvent('rank', { track_id: trackId, stars });
  };

  const handleShare = async () => {
    logEvent('share');
    const url = shareUrl;
    const text = `${volumeDescription} `;
    if (navigator.share) {
      try {
        await navigator.share({ title: volumeName, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isCurrentTrack = (track) => currentTrack?.id === track.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0a1c] to-[#0a0a0a] text-white pb-32">
      {/* Header */}
      <div className="relative">
        <div
          className="absolute inset-0 opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle at 30% 20%, #FFD700 0%, transparent 50%), radial-gradient(circle at 70% 60%, #B8860B 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-8">
          <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-4">
            <Music2 className="w-4 h-4" />
            {volume?.volumeNumber ? `Vol ${volume.volumeNumber} · ` : ''}
            {volumeTagline}
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] bg-clip-text text-transparent">
              MIKE PAGE
            </span>
          </h1>
          <p className="text-xl text-white/70 font-medium mb-6">
            {volumeDescription}
          </p>

          {/* PLAY ALL + Share */}
          <div className="flex items-stretch gap-3 flex-wrap">
            <button
              onClick={handlePlayAll}
              className="group flex items-center justify-center gap-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFE55C] hover:to-[#FFB733] active:scale-[0.98] text-black font-black text-2xl md:text-3xl px-10 md:px-14 py-7 md:py-8 rounded-full shadow-[0_0_50px_rgba(255,215,0,0.5)] hover:shadow-[0_0_80px_rgba(255,215,0,0.7)] transition-all flex-1 min-h-[80px] max-w-full"
            >
              <Play className="w-10 h-10 md:w-12 md:h-12 fill-black" />
              PLAY ALL 5
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-[0.98] backdrop-blur text-white font-bold text-base px-6 py-5 rounded-full transition-all min-h-[80px] min-w-[110px]"
            >
              {copied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="max-w-3xl mx-auto px-6 mt-4">
        <div className="space-y-3">
          {tracks.map((track, idx) => {
            const r = rankings[track.id] || { avg: 0, count: 0 };
            const myRank = submittedTracks[track.id];
            const playing = isCurrentTrack(track);
            return (
              <div
                key={track.id}
                className={`group relative rounded-2xl border transition-all overflow-hidden ${
                  playing
                    ? 'bg-gradient-to-r from-[#FFD700]/10 to-transparent border-[#FFD700]/40 shadow-[0_0_30px_rgba(255,215,0,0.15)]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Track number / play button */}
                  <button
                    onClick={() => (playing ? togglePlay() : handlePlayTrack(idx))}
                    className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-black/40 group/play"
                  >
                    <img
                      src={ALBUM_ART}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        playing ? 'opacity-100 bg-black/60' : 'opacity-0 group-hover/play:opacity-100 bg-black/70'
                      }`}
                    >
                      {playing && isPlaying ? (
                        <Pause className="w-7 h-7 fill-white" />
                      ) : (
                        <Play className="w-7 h-7 fill-white ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Title + artist + stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#FFD700]/60 text-sm font-bold tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className={`text-lg font-bold truncate ${playing ? 'text-[#FFD700]' : 'text-white'}`}>
                        {track.title}
                      </h3>
                    </div>
                    <div className="text-sm text-white/50 truncate">
                      {track.artist || 'Mike Page'}
                      {track.featured && ` · ft. ${track.featured}`}
                      {track.duration && ` · ${track.duration}`}
                    </div>
                    {r.count > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/60">
                        <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                        <span className="font-bold text-[#FFD700]">{r.avg.toFixed(1)}</span>
                        <span>· {r.count} {r.count === 1 ? 'vote' : 'votes'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rank row */}
                <div className="px-4 pb-4 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-wider text-white/40 font-bold">
                    {myRank ? 'Your rating' : 'Rate it'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleRank(track.id, s)}
                        className="p-1 hover:scale-110 transition-transform"
                        aria-label={`Rate ${s} stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            myRank && s <= myRank
                              ? 'fill-[#FFD700] text-[#FFD700]'
                              : 'text-white/30 hover:text-[#FFD700]/60'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscribe CTA */}
      <div className="max-w-3xl mx-auto px-6 mt-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1410] via-[#2a1a05] to-[#1a1410] border border-[#FFD700]/30 shadow-[0_0_60px_rgba(255,215,0,0.15)]">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(circle at 20% 30%, #FFD700 0%, transparent 40%), radial-gradient(circle at 80% 70%, #FF8C00 0%, transparent 40%)',
            }}
          />
          <div className="relative p-8 text-center">
            <div className="text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-3">
              Liked what you heard?
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              Unlock the <span className="text-[#FFD700]">FULL</span> Mike Page Catalog
            </h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              200+ tracks · IDMG Mixtape · Grammy Nights Vol. 1 · Cindy's Son · Singles · Vault. Stream the whole empire on MyStation.
            </p>
            <Link
              href="/access"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFE55C] hover:to-[#FFB733] text-black font-black text-lg px-8 py-4 rounded-full shadow-[0_0_40px_rgba(255,215,0,0.4)] transition-all"
            >
              SUBSCRIBE TO MYSTATION
            </Link>
            <div className="mt-4 text-xs text-white/40">
              Or browse free at{' '}
              <Link href="/music" className="text-[#FFD700] hover:underline">
                mystationlive.com/music
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-6 mt-8 text-center">
        <div className="text-xs text-white/30 tracking-wider">
          MIKE PAGE · IDMG · IMPOSSIBLE DREAMZ MUSIC GROUP
        </div>
      </div>
    </div>
  );
}
