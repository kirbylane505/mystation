/**
 * MYSTATION - Home Page
 * Premium Navy Blue & Black Theme
 */

'use client';

import Hero from '@/components/Hero';
import TrackList from '@/components/TrackList';
import DonationButton from '@/components/DonationButton';
import { tracks, albums, playlists, artistInfo } from '@/data/tracks';
import { Play, Heart, ExternalLink, Music, Award, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  const newReleases = tracks.filter(t => t.isNew).map(t => t.id);
  const featuredTracks = [1, 6, 21, 25, 36, 37];

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
          <button className="text-blue-400 hover:text-blue-300 transition text-sm font-medium">
            See All →
          </button>
        </div>
        <div className="glass rounded-2xl p-2">
          <TrackList trackIds={newReleases} showNumber={false} />
        </div>
      </section>

      {/* Albums Grid */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-10">Albums</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map(album => (
            <div
              key={album.id}
              className="glass rounded-2xl p-6 hover:border-blue-500/30 transition cursor-pointer group"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-600/20 to-blue-900/30 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden border border-white/5">
                <Music size={64} className="text-blue-400/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-6">
                  <button className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition">
                    <Play size={24} className="text-white ml-1" fill="white" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{album.title}</h3>
              <p className="text-white/40 text-sm mb-3">{album.year} • {album.trackCount} tracks</p>
              <p className="text-white/30 text-sm leading-relaxed">{album.description}</p>
            </div>
          ))}

          {/* Instrumental Album */}
          <div className="glass rounded-2xl p-6 hover:border-blue-500/30 transition cursor-pointer group">
            <div className="aspect-square bg-gradient-to-br from-indigo-600/20 to-purple-900/30 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden border border-white/5">
              <span className="text-6xl">🎹</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-6">
                <button className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 transition">
                  <Play size={24} className="text-white ml-1" fill="white" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">iDMG Coke Wave Beats</h3>
            <p className="text-white/40 text-sm mb-3">2026 • 13 instrumentals</p>
            <p className="text-white/30 text-sm leading-relaxed">Premium beats for the culture</p>
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="max-w-screen-xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-10">Featured Tracks</h2>
        <div className="glass rounded-2xl p-2">
          <TrackList trackIds={featuredTracks} />
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
                {artistInfo.foundation.programs.map((program, i) => (
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
              <h3 className="text-xl font-bold text-white mb-4">
                MY<span className="gradient-text">STATION</span>
              </h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Free music streaming platform by Mike Page Foundation.
                100% of donations support youth and community programs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Listen</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">Browse Music</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Albums</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Playlists</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Live Streams</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Foundation</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Programs</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Love on the Lawn</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Donate</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Connect</h4>
              <ul className="space-y-3 text-white/40 text-sm">
                <li><a href="https://instagram.com/mikepagelivin" className="hover:text-blue-400 transition flex items-center gap-2">
                  Instagram <ExternalLink size={12} />
                </a></li>
                <li><a href="https://tiktok.com/@mikepageidmg" className="hover:text-blue-400 transition flex items-center gap-2">
                  TikTok <ExternalLink size={12} />
                </a></li>
                <li><a href={artistInfo.socials.spotify} className="hover:text-blue-400 transition flex items-center gap-2">
                  Spotify <ExternalLink size={12} />
                </a></li>
                <li><a href={artistInfo.socials.apple} className="hover:text-blue-400 transition flex items-center gap-2">
                  Apple Music <ExternalLink size={12} />
                </a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              © 2026 MyStation. A Mike Page Foundation Initiative.
            </p>
            <p className="text-white/30 text-sm">
              Made with 💙 for the culture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
