/**
 * MYSTATION - Home Page
 * Premium Navy Blue & Black Theme
 */

'use client';

import Hero from '@/components/Hero';
import FeaturedSong from '@/components/FeaturedSong';
import TrackList from '@/components/TrackList';
import DonationButton from '@/components/DonationButton';
import ActivityFeed from '@/components/ActivityFeed';
import DailySpin from '@/components/DailySpin';
import { tracks, albums, playlists, artistInfo, getOfficialTracks, featuredSong } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';
import { useEngagementStore } from '@/store/engagementStore';
import { Play, Heart, ExternalLink, Music, Award, Users, Sparkles, Headphones, Flame, Trophy, Crown } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { setQueue } = usePlayerStore();
  const { currentStreak, earnedBadges, totalPlays } = useEngagementStore();

  // Get official tracks only
  const officialTracks = getOfficialTracks();

  // New releases - official tracks marked as isNew
  const newReleases = officialTracks.filter(t => t.isNew).map(t => t.id).slice(0, 8);
  // Featured - Cindy's Son highlights + singles
  const featuredTracks = [1, 21, 22, 3, 7, 10];

  // Play an entire album
  const handlePlayAlbum = (album) => {
    if (album.trackIds && album.trackIds.length > 0) {
      const albumTracks = album.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean);
      setQueue(albumTracks, 0);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Featured Song of the Week */}
      {featuredSong && <FeaturedSong />}

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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {albums.map(album => (
            <div
              key={album.id}
              className="album-3d glass rounded-2xl p-5 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${albums.indexOf(album) * 0.1}s` }}
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
                {album.comingSoon && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full shadow-lg z-10">
                    SOON
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
                {!album.comingSoon && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePlayAlbum(album); }}
                      className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-110 transition-transform"
                    >
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </button>
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

      {/* Fan Zone Preview */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-purple-500/10" />
        <div className="bg-orb w-[300px] h-[300px] bg-orange-500 top-[-50px] left-[-50px]" />

        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Stats & CTA */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Crown size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Fan Zone</h2>
                  <p className="text-white/50">Earn rewards as you listen</p>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2 px-4 py-3 glass rounded-xl">
                  <Flame size={24} className="text-orange-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{currentStreak}</p>
                    <p className="text-xs text-white/40">Day Streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 glass rounded-xl">
                  <Trophy size={24} className="text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{earnedBadges.length}</p>
                    <p className="text-xs text-white/40">Badges</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 glass rounded-xl">
                  <Music size={24} className="text-blue-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{totalPlays}</p>
                    <p className="text-xs text-white/40">Plays</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/fan-zone" className="btn-primary">
                  Enter Fan Zone
                </Link>
                <DailySpin />
              </div>
            </div>

            {/* Right - Activity Feed Preview */}
            <div className="glass rounded-2xl p-4 max-h-[400px] overflow-hidden">
              <ActivityFeed limit={5} showTrending={false} />
            </div>
          </div>
        </div>
      </section>

      {/* Foundation Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-mystation-black via-mystation-navy/50 to-mystation-black" />
        <div className="bg-orb w-[500px] h-[500px] bg-blue-600 top-[-100px] left-[-200px]" />
        <div className="bg-orb w-[400px] h-[400px] bg-blue-500 bottom-[-100px] right-[-100px]" style={{ animationDelay: '-10s' }} />

        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="foundation-badge mb-8 inline-flex items-center gap-2">
                <Sparkles size={14} />
                501(c)(3) Nonprofit
              </div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Mike Page<br/>
                <span className="gradient-text">Foundation</span>
              </h2>
              <p className="text-xl text-white/50 mb-10 leading-relaxed">
                Every stream, every donation goes directly to supporting youth music programs,
                scholarships, and community events like Love on the Lawn.
              </p>

              <div className="space-y-4 mb-10">
                {['Youth Music Programs', 'Scholarships', 'Love on the Lawn Festival', 'Community Events'].map((program, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-white/70">{program}</span>
                  </div>
                ))}
              </div>

              <DonationButton variant="hero" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Music, title: 'Youth Music', desc: 'Instruments & lessons for kids' },
                { icon: Award, title: 'Scholarships', desc: 'Supporting education' },
                { icon: Users, title: 'Community', desc: 'Local events & support' },
                { icon: Heart, title: 'Love on Lawn', desc: 'Annual festival in Elgin' },
              ].map((item, i) => (
                <div key={i} className="glass rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                    <item.icon size={28} className="text-blue-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-white/40 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Tracks */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-10">Full Catalog</h2>
        <div className="glass rounded-2xl p-2">
          <TrackList />
        </div>
      </section>

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
                Free music streaming platform by Mike Page Foundation.
                100% of donations support youth and community programs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Listen</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><Link href="/music" className="hover:text-blue-400 transition">Browse Music</Link></li>
                <li><Link href="/music" className="hover:text-blue-400 transition">Albums</Link></li>
                <li><Link href="/name-this-song" className="hover:text-blue-400 transition">Name This Song</Link></li>
                <li><Link href="/live" className="hover:text-blue-400 transition">Live Streams</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Foundation</h4>
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
              © 2026 MyStation. A Mike Page Foundation 501(c)(3) Initiative.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-white/30 text-sm hover:text-white/50 transition">Privacy</Link>
              <Link href="/terms" className="text-white/30 text-sm hover:text-white/50 transition">Terms</Link>
              <p className="text-white/30 text-sm">
                Made with love for the culture
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
