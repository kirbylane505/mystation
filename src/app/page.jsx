/**
 * MYSTATION - Home Page
 * Premium Navy Blue & Black Theme
 */

'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import TrackList from '@/components/TrackList';
import EmailCapture from '@/components/EmailCapture';
import LOTLCountdown from '@/components/LOTLCountdown';
import SocialEmbeds from '@/components/SocialEmbeds';
import ReferralProgram from '@/components/ReferralProgram';
import { tracks, albums, getOfficialTracks, getNonVaultTracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';
import { Play, Pause, Heart, ExternalLink, Music, Headphones, ChevronLeft, Shuffle, Search, ListMusic, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { setQueue, currentTrack, isPlaying, queue } = usePlayerStore();
  const [activeAlbum, setActiveAlbum] = useState(null);

  // Get official tracks only
  const officialTracks = getOfficialTracks();

  // New releases - official tracks marked as isNew
  const newReleases = officialTracks.filter(t => t.isNew).map(t => t.id);

  // Featured - Cindy's Son highlights + singles
  const featuredTracks = [1, 21, 22, 3, 7, 10];

  // Get track objects for an album
  const getAlbumTracks = (album) => {
    if (!album?.trackIds) return [];
    return album.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean);
  };

  // Open album detail view and start playing
  const handleOpenAlbum = (album) => {
    setActiveAlbum(album);
    const albumTracks = getAlbumTracks(album);
    if (albumTracks.length > 0) {
      setQueue(albumTracks, 0);
    }
  };

  // Play a specific track within the album view
  const handlePlayAlbumTrack = (album, index) => {
    const albumTracks = getAlbumTracks(album);
    if (albumTracks.length > 0) {
      setQueue(albumTracks, index);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Section Divider */}
      <div className="section-divider" />

      {/* New Releases */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">New Releases</h2>
            <p className="text-white/40">Fresh drops from Mike Page</p>
          </div>
          <Link href="/music" className="text-blue-400 hover:text-blue-300 transition text-sm font-medium">
            See All →
          </Link>
        </div>
        <div className="glass rounded-2xl p-2">
          <TrackList trackIds={newReleases.length > 0 ? newReleases : [21, 22, 23, 30, 31, 32, 34, 35]} showNumber={false} />
        </div>
      </section>

      {/* About Mike Page */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3 block">The Story</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Music That Gives Back
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-4">
                Mike Page built MyStation on a simple idea: every play should matter. As founder of the Mike Page Foundation, a 501(c)(3) nonprofit, he channels music into real impact — funding youth programs, community events, and the annual Love on the Lawn Festival.
              </p>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                From Atlanta to the world, IDMG (Impossible Dreamz Music Group) represents independent artists who refuse to wait for permission. Stream the catalog. Wear the merch. Join the movement.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">501(c)(3)</div>
                  <div className="text-white/40 text-xs">Nonprofit</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-white/40 text-xs">Festival Capacity</div>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-white/40 text-xs">Original Tracks</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/idmg-logo-white.png"
                  alt="Mike Page - IDMG"
                  className="w-3/4 h-3/4 object-contain opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" />

      {/* Discover Music — Global Search CTA */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Globe size={20} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Discover Music</h2>
            </div>
            <p className="text-white/50 mb-8 max-w-lg">
              Search 100M+ songs from every artist in the world. Create playlists mixing Mike Page with your favorites.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search"
                className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-full text-white font-medium transition group"
              >
                <Search size={20} className="text-blue-400 group-hover:text-blue-300" />
                Search all music...
              </Link>
              <Link
                href="/playlists"
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-bold transition"
              >
                <ListMusic size={20} />
                My Playlists
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Albums Grid */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Albums & Projects</h2>
            <p className="text-white/40">Official releases on all streaming platforms</p>
          </div>
          <Link href="/music" className="text-blue-400 hover:text-blue-300 transition text-sm font-medium">
            View All Music →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {albums.map(album => (
            <div
              key={album.id}
              className="album-3d glass rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group"
              onClick={() => !album.comingSoon && !album.isComingSoon && !album.isLocked && handleOpenAlbum(album)}
            >
              {/* Album Cover */}
              <div className={`aspect-square ${album.coverImage ? '' : `bg-gradient-to-br ${album.coverGradient}`} rounded-xl mb-5 flex flex-col items-center justify-center relative overflow-hidden border border-white/10 shadow-xl`}>
                {/* Real Album Cover Image */}
                {album.coverImage && (
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* NEW Badge */}
                {album.isNew && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg z-10">
                    NEW
                  </div>
                )}
                {(album.comingSoon || album.isComingSoon) && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full shadow-lg z-10">
                    COMING SOON
                  </div>
                )}
                {album.isExclusive && !album.isLocked && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg z-10">
                    EXCLUSIVE
                  </div>
                )}
                {album.isLocked && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-red-800 text-red-200 text-xs font-bold rounded-full shadow-lg z-10 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    LOCKED
                  </div>
                )}

                {/* Album Art Content (fallback for no image) */}
                {!album.coverImage && (
                  <>
                    <span className="text-6xl mb-3 drop-shadow-lg">{album.coverEmoji}</span>
                    <p className="text-white/90 font-bold text-sm uppercase tracking-widest text-center px-4">{album.title}</p>
                    <p className="text-white/60 text-xs mt-1">{album.artist}</p>
                  </>
                )}

                {/* Play Overlay */}
                {!album.comingSoon && !album.isComingSoon && !album.isLocked && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenAlbum(album); }}
                      className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-110 transition-transform"
                    >
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </button>
                  </div>
                )}
                {album.isLocked && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-red-400 mb-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <p className="text-white font-bold text-sm">Vault Sealed</p>
                    </div>
                  </div>
                )}
                {album.isComingSoon && album.isPrivate && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-amber-400 mb-2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <p className="text-white font-bold text-sm">Private Album</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Album Info */}
              <h3 className="text-lg font-bold text-white mb-1">{album.title}</h3>
              <p className="text-white/40 text-sm mb-3">{album.year} • {album.trackCount} tracks</p>

              {/* Streaming Links */}
              {(album.spotify || album.apple) && (
                <div className="flex gap-2 mt-3">
                  {album.spotify && (
                    <a
                      href={album.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 px-3 bg-[#1DB954]/10 text-[#1DB954] text-xs font-medium rounded-lg hover:bg-[#1DB954]/20 transition text-center"
                    >
                      Spotify
                    </a>
                  )}
                  {album.apple && (
                    <a
                      href={album.apple}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 py-2 px-3 bg-[#FC3C44]/10 text-[#FC3C44] text-xs font-medium rounded-lg hover:bg-[#FC3C44]/20 transition text-center"
                    >
                      Apple
                    </a>
                  )}
                </div>
              )}

              {album.comingSoon && (
                <p className="text-purple-400 text-sm font-medium mt-3">Coming Soon</p>
              )}

              {/* Locked Vault */}
              {album.isLocked && (
                <div className="mt-3">
                  <p className="text-red-400 text-sm font-bold flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Vault Sealed
                  </p>
                </div>
              )}

              {/* Private Album - Access Code */}
              {album.isPrivate && album.isComingSoon && (
                <div className="mt-3">
                  <p className="text-amber-400 text-sm font-medium flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Private - Coming Soon
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-10">Featured Tracks</h2>
        <div className="glass rounded-2xl p-2">
          <TrackList trackIds={featuredTracks} />
        </div>
      </section>

      {/* All Tracks (excludes Vault - those are exclusive) */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-10">Full Catalog</h2>
        <div className="glass rounded-2xl p-2">
          <TrackList trackIds={getNonVaultTracks().map(t => t.id)} />
        </div>
      </section>

      {/* LOTL Countdown */}
      <section className="max-w-screen-xl mx-auto px-6 py-10">
        <LOTLCountdown variant="compact" />
      </section>

      {/* Email Capture Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="bg-orb w-[300px] h-[300px] bg-blue-500 top-[-50px] left-[20%] opacity-30" />
        <div className="relative max-w-screen-md mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Never Miss a Drop
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Get notified when new music drops. No spam, just fire.
          </p>
          <EmailCapture variant="minimal" className="max-w-md mx-auto" />
        </div>
      </section>

      {/* Social + Referral */}
      <section className="max-w-screen-xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <SocialEmbeds />
          <ReferralProgram />
        </div>
      </section>

      {/* Album Detail View */}
      {activeAlbum && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen p-4 md:p-8 pb-36">
            <div className="max-w-screen-lg mx-auto">
              {/* Back Button */}
              <button
                onClick={() => setActiveAlbum(null)}
                className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition"
              >
                <ChevronLeft size={24} />
                <span>Back</span>
              </button>

              {/* Album Header */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="w-48 h-48 flex-shrink-0 rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
                  {activeAlbum.coverImage ? (
                    <Image src={activeAlbum.coverImage} alt={activeAlbum.title} fill className="object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${activeAlbum.coverGradient} flex items-center justify-center`}>
                      <span className="text-7xl">{activeAlbum.coverEmoji || '🎧'}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-white/60 text-sm mb-1">ALBUM</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{activeAlbum.title}</h1>
                  <p className="text-white/60 mb-2">Mike Page • {activeAlbum.year}</p>
                  <p className="text-white/40 text-sm">{getAlbumTracks(activeAlbum).length} tracks</p>
                </div>
              </div>

              {/* Play All / Shuffle */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => handlePlayAlbumTrack(activeAlbum, 0)}
                  className="flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition"
                >
                  <Play size={24} fill="white" />
                  Play All
                </button>
                <button
                  onClick={() => {
                    const albumTracks = getAlbumTracks(activeAlbum);
                    const shuffled = [...albumTracks].sort(() => Math.random() - 0.5);
                    setQueue(shuffled, 0);
                  }}
                  className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition"
                >
                  <Shuffle size={20} />
                  Shuffle
                </button>
              </div>

              {/* Track List */}
              <div className="glass rounded-2xl overflow-hidden">
                {getAlbumTracks(activeAlbum).map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => handlePlayAlbumTrack(activeAlbum, index)}
                      className={`w-full flex items-center gap-4 p-4 hover:bg-white/10 transition text-left border-b border-white/5 last:border-0 ${
                        isCurrentTrack ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <div className="w-8 text-center">
                        {isCurrentTrack && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="w-1 h-4 bg-blue-400 rounded-full animate-pulse" />
                            <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '75ms' }} />
                            <span className="w-1 h-5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                          </div>
                        ) : (
                          <span className="text-white/40">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCurrentTrack ? 'text-blue-400' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-white/50 text-sm truncate">
                          Mike Page{track.featured ? ` ft. ${track.featured}` : ''}
                          {track.producer ? ` • Prod. ${track.producer}` : ''}
                        </p>
                      </div>
                      <span className="text-white/40 text-sm">{track.duration || ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating IDMG Marquee */}
      <div className="w-full overflow-hidden py-8 border-t border-b border-white/5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="mx-12 text-2xl md:text-3xl font-black tracking-[0.3em] text-white/[0.07] uppercase select-none">
              IMPOSSIBLE DREAMZ MUSIC GROUP
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 bg-mystation-black/50">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <Headphones size={22} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  MY<span className="gradient-text">STATION</span>
                </span>
              </Link>
              <p className="text-white/40 text-sm leading-relaxed">
                Independent music platform by IDMG.
                Every stream supports youth programs, community events, and the Love on the Lawn Festival through the Mike Page Foundation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Listen</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><Link href="/music" className="hover:text-blue-400 transition">Browse Music</Link></li>
                <li><Link href="/search" className="hover:text-blue-400 transition">Search All Music</Link></li>
                <li><Link href="/playlists" className="hover:text-blue-400 transition">My Playlists</Link></li>
                <li><Link href="/live" className="hover:text-blue-400 transition">Live Streams</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">IDMG</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link href="/about" className="hover:text-blue-400 transition">Programs</Link></li>
                <li><a href="https://loveonlawn.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition flex items-center gap-2">Love on the Lawn <ExternalLink size={12} /></a></li>
                <li><a href="https://cash.app/$RIDE4PAGEMUSIC847" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition flex items-center gap-2">Donate <ExternalLink size={12} /></a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Stream Everywhere</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><a href="https://open.spotify.com/artist/3JwFt4Qb3uAUzipnMyM6G6" target="_blank" rel="noopener noreferrer" className="hover:text-[#1DB954] transition flex items-center gap-2">
                  Spotify <ExternalLink size={12} />
                </a></li>
                <li><a href="https://music.apple.com/us/artist/mike-page/1515325834" target="_blank" rel="noopener noreferrer" className="hover:text-[#FC3C44] transition flex items-center gap-2">
                  Apple Music <ExternalLink size={12} />
                </a></li>
                <li><a href="https://instagram.com/mikepagelivin" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition flex items-center gap-2">
                  Instagram <ExternalLink size={12} />
                </a></li>
                <li><a href="https://tiktok.com/@mikepageidmg" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition flex items-center gap-2">
                  TikTok <ExternalLink size={12} />
                </a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              © 2026 MyStation. An IDMG Initiative.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-white/30 text-sm hover:text-white/50 transition">Privacy</Link>
              <Link href="/terms" className="text-white/30 text-sm hover:text-white/50 transition">Terms</Link>
              <p className="text-white/30 text-sm">
                Built for the culture. Powered by the community.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
