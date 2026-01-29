/**
 * MYSTATION - Home Page
 * Main landing with hero, featured tracks, and foundation info
 */

'use client';

import Hero from '@/components/Hero';
import TrackList from '@/components/TrackList';
import DonationButton from '@/components/DonationButton';
import { tracks, albums, playlists, artistInfo } from '@/data/tracks';
import { Play, Heart, ExternalLink, Music, Award, Users } from 'lucide-react';

export default function HomePage() {
  const newReleases = tracks.filter(t => t.isNew).map(t => t.id);
  const featuredTracks = [1, 6, 21, 25, 36, 37]; // Hand-picked featured

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* New Releases */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">New Releases</h2>
            <p className="text-white/60">Fresh drops from Mike Page</p>
          </div>
          <button className="text-mystation-gold hover:underline">See All</button>
        </div>
        <TrackList trackIds={newReleases} showNumber={false} />
      </section>

      {/* Albums Grid */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white mb-8">Albums</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map(album => (
            <div
              key={album.id}
              className="glass rounded-2xl p-6 hover:bg-white/10 transition cursor-pointer group"
            >
              <div className="aspect-square bg-mystation-accent rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                <span className="text-6xl">💿</span>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button className="w-14 h-14 bg-mystation-gold rounded-full flex items-center justify-center">
                    <Play size={28} className="text-mystation-dark ml-1" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{album.title}</h3>
              <p className="text-white/60 text-sm mb-2">{album.year} • {album.trackCount} tracks</p>
              <p className="text-white/40 text-sm">{album.description}</p>
            </div>
          ))}

          {/* Instrumental Album */}
          <div className="glass rounded-2xl p-6 hover:bg-white/10 transition cursor-pointer group">
            <div className="aspect-square bg-gradient-to-br from-purple-900 to-mystation-accent rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
              <span className="text-6xl">🎹</span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button className="w-14 h-14 bg-mystation-gold rounded-full flex items-center justify-center">
                  <Play size={28} className="text-mystation-dark ml-1" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">iDMG Coke Wave Beats</h3>
            <p className="text-white/60 text-sm mb-2">2026 • 13 instrumentals</p>
            <p className="text-white/40 text-sm">Premium beats for the culture</p>
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white mb-8">Featured Tracks</h2>
        <TrackList trackIds={featuredTracks} />
      </section>

      {/* Foundation Section */}
      <section className="bg-gradient-to-b from-mystation-darker via-mystation-accent/30 to-mystation-darker py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="foundation-badge mb-6 inline-block">501(c)(3) Nonprofit</div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Mike Page Foundation
              </h2>
              <p className="text-xl text-white/70 mb-8">
                Every stream, every donation goes directly to supporting youth music programs,
                scholarships, and community events like Love on the Lawn.
              </p>

              <div className="space-y-4 mb-8">
                {artistInfo.foundation.programs.map((program, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-mystation-gold rounded-full" />
                    <span className="text-white/80">{program}</span>
                  </div>
                ))}
              </div>

              <DonationButton variant="hero" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 text-center">
                <Music size={40} className="text-mystation-gold mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">Youth Music</h4>
                <p className="text-white/60 text-sm">Instruments & lessons for kids</p>
              </div>
              <div className="glass rounded-2xl p-6 text-center">
                <Award size={40} className="text-mystation-gold mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">Scholarships</h4>
                <p className="text-white/60 text-sm">Supporting education</p>
              </div>
              <div className="glass rounded-2xl p-6 text-center">
                <Users size={40} className="text-mystation-gold mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">Community</h4>
                <p className="text-white/60 text-sm">Local events & support</p>
              </div>
              <div className="glass rounded-2xl p-6 text-center">
                <Heart size={40} className="text-mystation-gold mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-white mb-2">Love on Lawn</h4>
                <p className="text-white/60 text-sm">Annual festival in Elgin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Tracks */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white mb-8">Full Catalog</h2>
        <TrackList />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                MY<span className="text-mystation-gold">STATION</span>
              </h3>
              <p className="text-white/60 text-sm">
                Free music streaming platform by Mike Page Foundation.
                100% of donations support youth and community programs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Listen</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-mystation-gold">Browse Music</a></li>
                <li><a href="#" className="hover:text-mystation-gold">Albums</a></li>
                <li><a href="#" className="hover:text-mystation-gold">Playlists</a></li>
                <li><a href="#" className="hover:text-mystation-gold">Live Streams</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Foundation</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-mystation-gold">About Us</a></li>
                <li><a href="#" className="hover:text-mystation-gold">Programs</a></li>
                <li><a href="#" className="hover:text-mystation-gold">Love on the Lawn</a></li>
                <li><a href="#" className="hover:text-mystation-gold">Donate</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="https://instagram.com/mikepagelivin" className="hover:text-mystation-gold flex items-center gap-2">
                  Instagram <ExternalLink size={12} />
                </a></li>
                <li><a href="https://tiktok.com/@mikepageidmg" className="hover:text-mystation-gold flex items-center gap-2">
                  TikTok <ExternalLink size={12} />
                </a></li>
                <li><a href={artistInfo.socials.spotify} className="hover:text-mystation-gold flex items-center gap-2">
                  Spotify <ExternalLink size={12} />
                </a></li>
                <li><a href={artistInfo.socials.apple} className="hover:text-mystation-gold flex items-center gap-2">
                  Apple Music <ExternalLink size={12} />
                </a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2026 MyStation. A Mike Page Foundation Initiative.
            </p>
            <p className="text-white/40 text-sm">
              Made with ❤️ for the culture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
