/**
 * ALBUM HEADLINER v2 — Full-Screen Cinematic Takeover
 * IDMG Mixtape 2026 — Drops Feb 27
 * Top of homepage. THE feature. Full viewport premiere experience.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Music, ChevronDown, ChevronUp, ExternalLink, Lock } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { tracks } from '@/data/tracks';

const RELEASE_DATE = new Date('2026-02-27T00:00:00-06:00'); // CST

const MIXTAPE_TRACK_IDS = [500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512];

const TRACKLIST = [
  { num: 1, title: "I Want This One", credit: "Mike Page ft. Vincent Berry" },
  { num: 2, title: "R.U.N or R U Out", credit: "Mike Page ft. Vincent Berry \u2022 Co-Prod. Shawn Hibbler" },
  { num: 3, title: "Having My Way", credit: "Mike Page ft. Varro" },
  { num: 4, title: "Be Alright", credit: "Mike Page ft. Nyvira" },
  { num: 5, title: "I Might", credit: "Mike Page" },
  { num: 6, title: "No Weapon", credit: "King Deazel ft. Mike Page" },
  { num: 7, title: "I Been On Some Shit", credit: "King Deazel \u2022 Co-Prod. Jack Thomas" },
  { num: 8, title: "God Loves Us", credit: "Mike Page ft. Sha Berry" },
  { num: 9, title: "F.I.L.A.", credit: "KOH ft. Mike Page" },
  { num: 10, title: "Heavens Gate", credit: "Mike Page ft. Varro" },
  { num: 11, title: "Thats Facts", credit: "Mike Page" },
  { num: 12, title: "Never Let The Money", credit: "Mike Page ft. Vincent Berry" },
  { num: 13, title: "Crash Out", credit: "Mike Page" },
];

const BIO_SHORT = `For years, Impossible Dreamz Music Group has operated in the spaces most people never see \u2014 writing, producing, and engineering records across every corner of the music industry. For the first time, all of that craftsmanship is being channeled into a project that carries our name.`;

const BIO_FULL = `Mike Page anchors the entire project. His presence shapes the direction of every track he touches \u2014 there\u2019s an attention to detail in his delivery that gives each verse dimension and texture. Standing alongside him is Grammy Award-winning vocalist Vincent Berry, whose songwriting and vocal ability represent a rare level of artistry.

King Deazel represents over two decades of brotherhood and shared history with The Cubist and Mike Page. The bond between JBM and IDMG runs deeper than business \u2014 it\u2019s family. On \u201cNo Weapon,\u201d he delivers one of the most emotionally honest performances on the entire project \u2014 a record born from real consequences, real accountability, and the courage to face his family through music after time served.

The Cubist produced every track on this tape \u2014 from the initial concept to the final master processed through IDMG OPUS. With over 100 million streams and decades of experience behind the boards, this project is the full expression of a career spent perfecting the art of making records.

Thirteen tracks. No skips. Music built to last. This is an instant classic.`;

// Generate particle positions (stable across renders)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 5.5 + Math.sin(i * 2.7) * 15 + 50) % 100}%`,
  delay: `${(i * 1.3) % 12}s`,
  duration: `${10 + (i * 1.7) % 10}s`,
  size: `${2 + (i % 3)}px`,
  opacity: 0.3 + (i % 4) * 0.15,
}));

export default function AlbumHeadliner() {
  const setQueue = usePlayerStore(s => s.setQueue);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isReleased, setIsReleased] = useState(true);
  const [showTracklist, setShowTracklist] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [coverSide, setCoverSide] = useState('front');
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const sectionRef = useRef(null);

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

  // Parallax fade on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < 0) {
        setScrollOpacity(0);
      } else if (rect.top >= 0) {
        setScrollOpacity(1);
      } else {
        const progress = Math.abs(rect.top) / vh;
        setScrollOpacity(Math.max(0.3, 1 - progress * 0.7));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
    if (trackObj?.isComingSoon) return;
    const playableTracks = MIXTAPE_TRACK_IDS
      .map(id => tracks.find(t => t.id === id))
      .filter(t => t && !t.isComingSoon);
    const queueIndex = playableTracks.findIndex(t => t.id === MIXTAPE_TRACK_IDS[index]);
    if (playableTracks.length > 0 && queueIndex >= 0) {
      setQueue(playableTracks, queueIndex);
    }
  };

  return (
    <>
      {/* ============================================
          FULL-SCREEN CINEMATIC TAKEOVER
          ============================================ */}
      <section
        ref={sectionRef}
        className="relative min-h-screen overflow-hidden bg-black flex flex-col"
        style={{ opacity: scrollOpacity, transition: 'opacity 0.1s ease-out' }}
      >
        {/* === BACKGROUND LAYERS === */}
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

        {/* Radial gold spotlight behind album art */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#C9A84C]/[0.06] rounded-full blur-[200px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C9A84C]/[0.04] rounded-full blur-[150px]" />

        {/* Subtle vignette edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />

        {/* === GOLD PARTICLE FIELD === */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#C9A84C]"
              style={{
                left: p.left,
                bottom: '-10px',
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                animation: `particleFloat ${p.duration} ${p.delay} linear infinite`,
              }}
            />
          ))}
        </div>

        {/* === GOLD ACCENT LINE AT TOP === */}
        <div className="relative h-1 bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent flex-shrink-0" />

        {/* === MAIN CONTENT (centered in viewport) === */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">

          {/* OUT NOW / DROPPING SOON Badge with shimmer */}
          <div className="mb-6 sm:mb-8" style={{ animation: 'fadeIn 0.8s ease-out both' }}>
            <div className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/10 backdrop-blur-sm overflow-hidden">
              {/* Shimmer sweep */}
              <div
                className="absolute top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent"
                style={{ animation: 'goldShimmerSweep 3s ease-in-out infinite' }}
              />
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C9A84C]" />
              </span>
              <span className="relative text-[#C9A84C] text-xs sm:text-sm font-black tracking-[0.3em] uppercase">
                {isReleased ? 'OUT NOW' : 'DROPPING SOON'}
              </span>
            </div>
          </div>

          {/* Title — Staggered entrance */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none">
              <span
                className="inline-block text-white"
                style={{ animation: 'slideInLeft 0.8s 0.2s ease-out both' }}
              >
                IDMG
              </span>
              {' '}
              <span
                className="inline-block text-[#C9A84C]"
                style={{ animation: 'slideInRight 0.8s 0.4s ease-out both' }}
              >
                MIXTAPE
              </span>
            </h1>
            <p
              className="text-white/50 text-sm sm:text-lg mt-3"
              style={{ animation: 'slideUp 0.8s 0.6s ease-out both' }}
            >
              Executive Produced by <span className="text-white/80 font-semibold">The Cubist</span> & <span className="text-white/80 font-semibold">Mike Page</span>
            </p>
            <p
              className="text-white/25 text-xs sm:text-sm mt-1 tracking-[0.2em] uppercase"
              style={{ animation: 'slideUp 0.8s 0.8s ease-out both' }}
            >
              Impossible Dreamz Music Group &bull; 2026
            </p>
          </div>

          {/* Album Cover — Center Stage with Glow */}
          <div
            className="mb-8 sm:mb-10"
            style={{ animation: 'scaleIn 0.8s 0.3s ease-out both' }}
          >
            {/* Cover Tabs — 3D Raised */}
            <div className="flex gap-3 mb-5 mx-auto justify-center" style={{ maxWidth: '380px' }}>
              <button
                onClick={() => setCoverSide('front')}
                className={`px-6 py-2.5 text-xs font-black tracking-[0.15em] uppercase rounded-full transition-all duration-300 ${
                  coverSide === 'front'
                    ? 'bg-[#C9A84C] text-black shadow-[0_4px_20px_rgba(201,168,76,0.4),0_2px_4px_rgba(0,0,0,0.3)] scale-105'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20 hover:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                }`}
              >
                Front Cover
              </button>
              <button
                onClick={() => setCoverSide('back')}
                className={`px-6 py-2.5 text-xs font-black tracking-[0.15em] uppercase rounded-full transition-all duration-300 ${
                  coverSide === 'back'
                    ? 'bg-[#C9A84C] text-black shadow-[0_4px_20px_rgba(201,168,76,0.4),0_2px_4px_rgba(0,0,0,0.3)] scale-105'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/70 hover:border-white/20 hover:bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
                }`}
              >
                Back Cover
              </button>
            </div>

            {/* Cover Image with Glow Ring */}
            <div
              className="relative mx-auto rounded-2xl overflow-hidden border-2 border-[#C9A84C]/30"
              style={{
                width: 'min(500px, 80vw)',
                height: 'min(500px, 80vw)',
                animation: 'goldGlowPulse 4s ease-in-out infinite, breathe 6s ease-in-out infinite',
              }}
            >
              <Image
                src={coverSide === 'front'
                  ? '/images/albums/idmg-mixtape-cover.png'
                  : '/images/albums/idmg-mixtape-tracklist.png'}
                alt={coverSide === 'front' ? 'IDMG Mixtape 2026 — Front Cover' : 'IDMG Mixtape 2026 — Tracklist'}
                fill
                sizes="(max-width: 768px) 80vw, 500px"
                className="object-cover"
                priority
              />

              {/* Play overlay on hover (released only) */}
              {isReleased && (
                <button
                  onClick={handlePlayAll}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all duration-300 group/play"
                >
                  <div className="w-16 h-16 rounded-full bg-[#C9A84C]/0 group-hover/play:bg-[#C9A84C] flex items-center justify-center transition-all duration-300 scale-75 group-hover/play:scale-100">
                    <Play size={28} className="text-black opacity-0 group-hover/play:opacity-100 transition-opacity ml-1" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Countdown to full mixtape drop */}
          {(
            <div
              className="mb-8"
              style={{ animation: 'slideUp 0.8s 0.7s ease-out both' }}
            >
              <p className="text-[#C9A84C] text-xs font-black tracking-[0.3em] uppercase mb-4 text-center">
                Full Mixtape Drops February 27, 2026
              </p>
              <div className="flex justify-center gap-3 sm:gap-4">
                {[
                  { val: countdown.days, label: 'DAYS' },
                  { val: countdown.hours, label: 'HRS' },
                  { val: countdown.minutes, label: 'MIN' },
                  { val: countdown.seconds, label: 'SEC' },
                ].map((unit, i) => (
                  <div key={unit.label} className="flex flex-col items-center">
                    <div className={`w-16 sm:w-20 h-16 sm:h-20 rounded-xl backdrop-blur-xl bg-white/5 border flex items-center justify-center ${
                      unit.label === 'SEC' ? 'border-[#C9A84C]/40' : 'border-white/10'
                    }`}
                    style={unit.label === 'SEC' ? { animation: 'goldGlowPulse 2s ease-in-out infinite' } : undefined}
                    >
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

          {/* Stats Row */}
          <div
            className="flex justify-center gap-6 sm:gap-8 mb-6"
            style={{ animation: 'slideUp 0.8s 0.9s ease-out both' }}
          >
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-white">13</p>
              <p className="text-white/30 text-[10px] sm:text-xs uppercase tracking-wider">Tracks</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-white">7</p>
              <p className="text-white/30 text-[10px] sm:text-xs uppercase tracking-wider">Artists</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-black text-[#C9A84C]">100M+</p>
              <p className="text-white/30 text-[10px] sm:text-xs uppercase tracking-wider">Streams</p>
            </div>
          </div>

          {/* CTA Buttons — THE action */}
          <div
            className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8"
            style={{ animation: 'slideUp 0.8s 1.0s ease-out both' }}
          >
            {isReleased && (
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2.5 px-10 py-4 sm:py-5 bg-[#C9A84C] text-black font-black rounded-full text-base sm:text-lg tracking-wide hover:bg-[#D4B84C] transition-all"
                style={{ animation: 'ctaPulse 2s ease-in-out infinite' }}
              >
                <Play size={22} fill="black" />
                PLAY ALL
              </button>
            )}
            <Link
              href="/music"
              className="flex items-center gap-2 px-8 py-4 sm:py-5 border-2 border-[#C9A84C]/40 text-[#C9A84C] font-bold rounded-full text-sm sm:text-base hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/60 transition-all"
            >
              <Music size={18} />
              Full Catalog
            </Link>
          </div>

          {/* Streaming Links */}
          <div style={{ animation: 'fadeIn 1s 1.2s ease-out both' }}>
            <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase mb-2 text-center">
              {isReleased ? 'Listen Everywhere' : 'Pre-Save & Follow'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <a href="https://open.spotify.com/artist/3JwFt4Qb3uAUzipnMyM6G6" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1DB954]/10 text-[#1DB954] text-xs font-medium rounded-full hover:bg-[#1DB954]/20 transition">
                Spotify <ExternalLink size={10} />
              </a>
              <a href="https://music.apple.com/us/album/idmg-mixtape/1879905768" target="_blank" rel="noopener noreferrer"
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

        {/* Scroll indicator */}
        <div
          className="relative pb-6 flex flex-col items-center gap-1 flex-shrink-0"
          style={{ animation: 'fadeIn 1.5s 1.5s ease-out both' }}
        >
          <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase">Scroll to Explore</span>
          <ChevronDown
            size={18}
            className="text-white/20"
            style={{ animation: 'bounceDown 2s ease-in-out infinite' }}
          />
        </div>

        {/* Gold accent line at bottom */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent flex-shrink-0" />
      </section>

      {/* ============================================
          BELOW THE FOLD — TRACKLIST + BIO
          ============================================ */}
      <section className="relative bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black" />
        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

          {/* Tracklist Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-[#C9A84C]/20" />
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
              <h3 className="text-white text-sm font-black tracking-[0.3em] uppercase">Tracklist</h3>
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#C9A84C]/40 to-[#C9A84C]/20" />
          </div>

          {/* Mobile tracklist toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowTracklist(!showTracklist)}
              className="w-full flex items-center justify-center gap-2.5 py-4 text-[#C9A84C]/80 text-sm font-bold hover:text-[#C9A84C] transition-all border border-[#C9A84C]/20 hover:border-[#C9A84C]/40 rounded-2xl backdrop-blur-sm bg-[#C9A84C]/5"
            >
              <Music size={16} />
              <span>{showTracklist ? 'Hide' : 'View'} Full Tracklist ({TRACKLIST.length} Tracks)</span>
              {showTracklist ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Tracklist Grid */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 ${showTracklist ? 'grid' : 'hidden lg:grid'}`}>
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
                  className={`relative flex items-center gap-3 sm:gap-4 py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl text-left transition-all duration-300 group overflow-hidden border ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/[0.02]'
                      : isCurrentTrack
                        ? 'border-[#C9A84C]/30 bg-[#C9A84C]/10 shadow-[0_0_20px_rgba(201,168,76,0.1)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-[#C9A84C]/20 hover:bg-[#C9A84C]/5 hover:shadow-[0_0_15px_rgba(201,168,76,0.05)]'
                  }`}
                >
                  {/* Gold hover sweep */}
                  {!isLocked && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#C9A84C]/0 via-[#C9A84C]/[0.03] to-[#C9A84C]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  )}

                  {/* Track number / play indicator */}
                  <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCurrentTrack
                      ? 'bg-[#C9A84C]/20'
                      : isLocked
                        ? 'bg-white/5'
                        : 'bg-white/5 group-hover:bg-[#C9A84C]/15'
                  } transition-all duration-300`}>
                    {isCurrentlyPlaying ? (
                      <span className="flex items-center justify-center gap-[3px]">
                        <span className="w-[3px] h-3 bg-[#C9A84C] rounded-full animate-pulse" />
                        <span className="w-[3px] h-4.5 bg-[#C9A84C] rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                        <span className="w-[3px] h-2.5 bg-[#C9A84C] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      </span>
                    ) : !isLocked ? (
                      <>
                        <span className={`text-sm font-bold group-hover:hidden ${isCurrentTrack ? 'text-[#C9A84C]' : 'text-white/30'}`}>
                          {String(track.num).padStart(2, '0')}
                        </span>
                        <Play size={16} className="hidden group-hover:block text-[#C9A84C]" fill="#C9A84C" />
                      </>
                    ) : (
                      <span className="text-sm font-bold text-white/20">{String(track.num).padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="relative flex-1 min-w-0">
                    <p className={`text-sm sm:text-[15px] font-bold truncate leading-tight ${
                      isLocked ? 'text-white/30' : isCurrentTrack ? 'text-[#C9A84C]' : 'text-white/90 group-hover:text-white'
                    } transition-colors`}>
                      {track.title}
                    </p>
                    <p className={`text-xs truncate mt-0.5 ${isLocked ? 'text-white/15' : 'text-white/35 group-hover:text-white/50'} transition-colors`}>
                      {track.credit}
                    </p>
                  </div>

                  {/* Duration / Lock badge */}
                  {isLocked ? (
                    <span className="relative flex items-center gap-1.5 text-xs text-white/20 bg-white/5 px-3 py-1.5 rounded-full flex-shrink-0">
                      <Lock size={10} />
                      Feb 27
                    </span>
                  ) : trackObj?.duration ? (
                    <span className={`relative text-xs font-medium tabular-nums flex-shrink-0 ${isCurrentTrack ? 'text-[#C9A84C]/70' : 'text-white/25 group-hover:text-white/40'} transition-colors`}>
                      {trackObj.duration}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Bio Section */}
          <div className="mt-12 max-w-2xl mx-auto text-center">
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
              className="text-[#C9A84C] text-xs font-medium mt-3 hover:underline"
            >
              {showFullBio ? 'Read Less' : 'Read Full Story'}
            </button>
          </div>

          {/* Bottom credit */}
          <div className="text-center mt-12">
            <p className="text-white/15 text-xs tracking-[0.2em] uppercase">
              Mastered by IDMG OPUS &bull; &copy; 2026 Impossible Dreamz Music Group
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
