/**
 * ALBUM HEADLINER — Full-width premium takeover
 * IDMG Mixtape 2026 — Drops Feb 27
 * Top of homepage. THE feature.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Music, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { tracks } from '@/data/tracks';

const RELEASE_DATE = new Date('2026-02-27T00:00:00-06:00'); // CST

const MIXTAPE_TRACK_IDS = [500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512];

const TRACKLIST = [
  { num: 1, title: "I Want This One", credit: "Mike Page ft. Vincent Berry" },
  { num: 2, title: "R.U.N or R U Out", credit: "Mike Page ft. Vincent Berry • Co-Prod. Shawn Hibbler" },
  { num: 3, title: "Having My Way", credit: "Mike Page ft. Varro" },
  { num: 4, title: "Be Alright", credit: "Mike Page ft. Nyvira" },
  { num: 5, title: "I Might", credit: "Mike Page" },
  { num: 6, title: "No Weapon", credit: "King Deazel ft. Mike Page" },
  { num: 7, title: "I Been On Some Shit", credit: "King Deazel • Co-Prod. Jack Thomas" },
  { num: 8, title: "God Loves Us", credit: "Mike Page ft. Sha Berry" },
  { num: 9, title: "F.I.L.A.", credit: "KOH ft. Mike Page" },
  { num: 10, title: "Heavens Gate", credit: "Mike Page ft. Varro" },
  { num: 11, title: "Thats Facts", credit: "Mike Page" },
  { num: 12, title: "Never Let The Money", credit: "Mike Page ft. Vincent Berry" },
  { num: 13, title: "Crash Out", credit: "Mike Page" },
];

const BIO_SHORT = `For years, Impossible Dreamz Music Group has operated in the spaces most people never see — writing, producing, and engineering records across every corner of the music industry. For the first time, all of that craftsmanship is being channeled into a project that carries our name.`;

const BIO_FULL = `Mike Page anchors the entire project. His presence shapes the direction of every track he touches — there's an attention to detail in his delivery that gives each verse dimension and texture. Standing alongside him is Grammy Award-winning vocalist Vincent Berry, whose songwriting and vocal ability represent a rare level of artistry.

King Deazel represents over two decades of brotherhood and shared history with The Cubist and Mike Page. The bond between JBM and IDMG runs deeper than business — it's family. On "No Weapon," he delivers one of the most emotionally honest performances on the entire project — a record born from real consequences, real accountability, and the courage to face his family through music after time served.

The Cubist produced every track on this tape — from the initial concept to the final master processed through IDMG OPUS. With over 100 million streams and decades of experience behind the boards, this project is the full expression of a career spent perfecting the art of making records.

Thirteen tracks. No skips. Music built to last. This is an instant classic.`;

export default function AlbumHeadliner() {
  const setQueue = usePlayerStore(s => s.setQueue);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isReleased, setIsReleased] = useState(false);
  const [showTracklist, setShowTracklist] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [coverSide, setCoverSide] = useState('front'); // 'front' or 'back'

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = RELEASE_DATE - now;
      if (diff <= 0) {
        setIsReleased(true);
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayAll = () => {
    const playableTracks = MIXTAPE_TRACK_IDS
      .map(id => tracks.find(t => t.id === id))
      .filter(t => t && !t.isComingSoon);
    if (playableTracks.length > 0) {
      setQueue(playableTracks, 0);
    }
  };

  const handlePlayTrack = (index) => {
    const trackObj = tracks.find(t => t.id === MIXTAPE_TRACK_IDS[index]);
    if (trackObj?.isComingSoon) return; // blocked track
    // Build queue from only playable tracks
    const playableTracks = MIXTAPE_TRACK_IDS
      .map(id => tracks.find(t => t.id === id))
      .filter(t => t && !t.isComingSoon);
    const queueIndex = playableTracks.findIndex(t => t.id === MIXTAPE_TRACK_IDS[index]);
    if (playableTracks.length > 0 && queueIndex >= 0) {
      setQueue(playableTracks, queueIndex);
    }
  };

  return (
    <section className="relative overflow-hidden bg-black">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/3 rounded-full blur-[150px]" />

      {/* Gold accent line at top */}
      <div className="relative h-1 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20">

        {/* NEW RELEASE / DROPPING SOON Badge */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C9A84C]" />
            </span>
            <span className="text-[#C9A84C] text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
              {isReleased ? 'OUT NOW' : 'DROPPING SOON'}
            </span>
          </div>
        </div>

        {/* Main layout: Cover + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-start">

          {/* Album Cover with Front/Back Tabs */}
          <div className="flex flex-col items-center">
            {/* Cover Tabs */}
            <div className="flex gap-1 mb-3 w-full max-w-[420px]">
              <button
                onClick={() => setCoverSide('front')}
                className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase rounded-t-lg transition-all ${
                  coverSide === 'front'
                    ? 'bg-white/10 text-[#C9A84C] border-b-2 border-[#C9A84C]'
                    : 'bg-white/5 text-white/30 hover:text-white/50'
                }`}
              >
                Front Cover
              </button>
              <button
                onClick={() => setCoverSide('back')}
                className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase rounded-t-lg transition-all ${
                  coverSide === 'back'
                    ? 'bg-white/10 text-[#C9A84C] border-b-2 border-[#C9A84C]'
                    : 'bg-white/5 text-white/30 hover:text-white/50'
                }`}
              >
                Back Cover
              </button>
            </div>

            {/* Cover Image */}
            <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 group">
              <Image
                src={coverSide === 'front'
                  ? '/images/albums/idmg-mixtape-cover.png'
                  : '/images/albums/idmg-mixtape-tracklist.png'}
                alt={coverSide === 'front' ? 'IDMG Mixtape 2026 — Front Cover' : 'IDMG Mixtape 2026 — Tracklist'}
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-cover transition-opacity duration-300"
                priority
              />
              {/* Play overlay removed — mixtape is locked until release */}
            </div>

            {/* Tracklist toggle on mobile */}
            <div className="mt-4 w-full max-w-[420px] lg:hidden">
              <button
                onClick={() => setShowTracklist(!showTracklist)}
                className="w-full flex items-center justify-center gap-2 py-3 text-white/50 text-sm font-medium hover:text-white/80 transition"
              >
                <Music size={16} />
                <span>{showTracklist ? 'Hide' : 'View'} Full Tracklist</span>
                {showTracklist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* Info Side */}
          <div className="text-center lg:text-left">
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
              IDMG <span className="text-[#C9A84C]">MIXTAPE</span>
            </h1>
            <p className="text-white/50 text-base sm:text-lg mb-2">
              Executive Produced by <span className="text-white/80 font-semibold">The Cubist</span> & <span className="text-white/80 font-semibold">Mike Page</span>
            </p>
            <p className="text-white/30 text-sm mb-6 tracking-widest uppercase">
              Impossible Dreamz Music Group • 2026
            </p>

            {/* Countdown */}
            {!isReleased && (
              <div className="mb-8">
                <p className="text-[#C9A84C] text-xs font-bold tracking-[0.3em] uppercase mb-3">
                  Drops February 27, 2026
                </p>
                <div className="flex justify-center lg:justify-start gap-3 sm:gap-4">
                  {[
                    { val: countdown.days, label: 'DAYS' },
                    { val: countdown.hours, label: 'HRS' },
                    { val: countdown.minutes, label: 'MIN' },
                    { val: countdown.seconds, label: 'SEC' },
                  ].map((unit) => (
                    <div key={unit.label} className="flex flex-col items-center">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                          {String(unit.val).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/30 font-bold tracking-wider mt-1.5">{unit.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
              <Link
                href="/music"
                className="flex items-center gap-2 px-8 py-4 bg-[#C9A84C] text-black font-bold rounded-full hover:bg-[#D4B84C] hover:shadow-lg hover:shadow-[#C9A84C]/30 transition-all text-sm sm:text-base"
              >
                <Music size={20} />
                Full Catalog
              </Link>
            </div>

            {/* Stats Row */}
            <div className="flex justify-center lg:justify-start gap-6 sm:gap-8 mb-8">
              <div className="text-center">
                <p className="text-2xl font-black text-white">13</p>
                <p className="text-white/30 text-xs uppercase tracking-wider">Tracks</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-white">7</p>
                <p className="text-white/30 text-xs uppercase tracking-wider">Artists</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-black text-[#C9A84C]">100M+</p>
                <p className="text-white/30 text-xs uppercase tracking-wider">Streams</p>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <p className="text-white/50 text-sm leading-relaxed">{BIO_SHORT}</p>
              {showFullBio && (
                <div className="mt-4 space-y-3">
                  {BIO_FULL.split('\n\n').map((p, i) => (
                    <p key={i} className="text-white/40 text-sm leading-relaxed">{p}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-[#C9A84C] text-xs font-medium mt-2 hover:underline"
              >
                {showFullBio ? 'Read Less' : 'Read Full Story'}
              </button>
            </div>

            {/* Streaming Links — EVERY PLATFORM for this drop */}
            <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2 text-center lg:text-left">
              {isReleased ? 'Listen Everywhere' : 'Pre-Save & Follow'}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              <a href="https://open.spotify.com/artist/3JwFt4Qb3uAUzipnMyM6G6" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1DB954]/10 text-[#1DB954] text-xs font-medium rounded-full hover:bg-[#1DB954]/20 transition">
                Spotify <ExternalLink size={10} />
              </a>
              <a href="https://music.apple.com/us/artist/mike-page/1515325834" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FC3C44]/10 text-[#FC3C44] text-xs font-medium rounded-full hover:bg-[#FC3C44]/20 transition">
                Apple Music <ExternalLink size={10} />
              </a>
              <a href="https://music.amazon.com/artists/B08F4HKQ6B" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full hover:bg-blue-500/20 transition">
                Amazon <ExternalLink size={10} />
              </a>
              <a href="https://tidal.com/browse/artist/22843578" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-white/60 text-xs font-medium rounded-full hover:bg-white/10 transition">
                Tidal <ExternalLink size={10} />
              </a>
              <a href="https://www.youtube.com/@mikepage" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 text-xs font-medium rounded-full hover:bg-red-500/20 transition">
                YouTube Music <ExternalLink size={10} />
              </a>
              <a href="https://soundcloud.com/ikeagee" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 text-orange-400 text-xs font-medium rounded-full hover:bg-orange-500/20 transition">
                SoundCloud <ExternalLink size={10} />
              </a>
              <a href="https://www.deezer.com/search/Mike%20Page%20IDMG" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-full hover:bg-purple-500/20 transition">
                Deezer <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Full Tracklist — Always visible on desktop, toggle on mobile */}
        <div className={`mt-10 sm:mt-14 ${showTracklist ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-[#C9A84C]/30 to-transparent" />
            <h3 className="text-white/60 text-xs font-bold tracking-[0.3em] uppercase">Tracklist</h3>
            <div className="h-px flex-1 bg-gradient-to-l from-[#C9A84C]/30 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
            {TRACKLIST.map((track, i) => {
              const trackObj = tracks.find(t => t.id === MIXTAPE_TRACK_IDS[i]);
              const isLocked = trackObj?.isComingSoon;
              const isCurrentlyPlaying = !isLocked && currentTrack?.id === MIXTAPE_TRACK_IDS[i] && isPlaying;
              const isCurrentTrack = !isLocked && currentTrack?.id === MIXTAPE_TRACK_IDS[i];

              return (
                <button
                  key={track.num}
                  onClick={() => handlePlayTrack(i)}
                  disabled={isLocked}
                  className={`flex items-center gap-4 py-3.5 px-4 rounded-lg text-left transition-all group ${
                    isLocked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'
                  } ${isCurrentTrack ? 'bg-[#C9A84C]/10' : ''}`}
                >
                  <span className={`w-7 text-center text-sm font-mono ${
                    isCurrentTrack ? 'text-[#C9A84C]' : 'text-white/20'
                  }`}>
                    {isCurrentlyPlaying ? (
                      <span className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-[#C9A84C] rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-[#C9A84C] rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                        <span className="w-0.5 h-2 bg-[#C9A84C] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      </span>
                    ) : (
                      String(track.num).padStart(2, '0')
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isLocked ? 'text-white/30' : isCurrentTrack ? 'text-[#C9A84C]' : 'text-white/80 group-hover:text-white'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-white/30 truncate">{track.credit}</p>
                  </div>
                  {isLocked ? (
                    <span className="text-xs text-white/20">Feb 27</span>
                  ) : trackObj?.duration ? (
                    <span className="text-xs text-white/20">{trackObj.duration}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom credit */}
        <div className="text-center mt-10 sm:mt-14">
          <p className="text-white/15 text-xs tracking-[0.2em] uppercase">
            Mastered by IDMG OPUS • © 2026 Impossible Dreamz Music Group
          </p>
        </div>
      </div>

      {/* Gold accent line at bottom */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />
    </section>
  );
}
