'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Music, Users, Mic2, Award, Crown, Star, Headphones, Play } from 'lucide-react';
import { tracks } from '@/data/tracks';

const FEATURED_ARTISTS = [
  {
    name: 'Mike Page',
    role: 'Artist & Founder',
    bio: 'Atlanta-based artist and founder of Impossible Dreamz Music Group (IDMG). Originally from Elgin, IL. All streams support the Mike Page Foundation.',
    image: '/images/artists/mike-page.jpg',
    gradient: 'from-blue-600 to-blue-900',
    badge: 'FOUNDER',
    socials: {
      instagram: 'https://instagram.com/mikepagelivin',
      spotify: 'https://open.spotify.com/artist/mikepage',
    },
    isMain: true,
  },
  {
    name: 'The Cubist',
    role: 'Executive Producer',
    bio: '100M+ streams and views. Credits include French Montana, Max B, Big30, Pooh Shiesty, Blac Youngsta. BET+ "I Got a Story to Tell" S2.',
    image: '/images/artists/the-cubist.jpg',
    gradient: 'from-purple-600 to-purple-900',
    badge: 'PRODUCER',
    isMain: true,
  },
  {
    name: 'King Deazel',
    role: 'Featured Artist',
    bio: 'Frequent collaborator on the IDMG roster. Featured on multiple tracks across the catalog.',
    image: null,
    gradient: 'from-red-600 to-red-900',
    badge: 'FEATURED',
  },
  {
    name: 'Vincent Berry',
    role: 'Featured Artist',
    bio: 'Versatile vocalist featured on VIBE and other IDMG records.',
    image: null,
    gradient: 'from-green-600 to-green-900',
    badge: 'FEATURED',
  },
  {
    name: 'Krissie the Don',
    role: 'Featured Artist',
    bio: 'Featured on party anthems in the IDMG catalog.',
    image: null,
    gradient: 'from-pink-600 to-pink-900',
    badge: 'FEATURED',
  },
  {
    name: 'Majik',
    role: 'Featured Artist',
    bio: 'Collaborator on high-energy records with Mike Page.',
    image: null,
    gradient: 'from-amber-600 to-amber-900',
    badge: 'FEATURED',
  },
  {
    name: 'Luh Soldier',
    role: 'Featured Artist',
    bio: 'Featured on GOIN UP from the Cindy\'s Son album.',
    image: null,
    gradient: 'from-cyan-600 to-cyan-900',
    badge: 'FEATURED',
  },
  {
    name: 'Drewson',
    role: 'Artist',
    bio: 'From The Town featuring Mike Page.',
    image: null,
    gradient: 'from-indigo-600 to-indigo-900',
    badge: 'COLLAB',
  },
];

function getArtistStats(artistName) {
  const featured = tracks.filter(t =>
    t.featured === artistName ||
    (artistName === 'Mike Page' && !t.artist) ||
    t.artist === artistName
  );
  const produced = tracks.filter(t =>
    t.producer && t.producer.toLowerCase().includes(artistName.toLowerCase())
  );
  return {
    trackCount: artistName === 'Mike Page' ? tracks.filter(t => !t.artist || t.artist === 'Mike Page').length : featured.length,
    producedCount: produced.length,
  };
}

function ArtistCard({ artist, index }) {
  const stats = useMemo(() => getArtistStats(artist.name), [artist.name]);
  const initials = artist.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <div
      className={`group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 ${artist.isMain ? 'md:col-span-2 lg:col-span-1' : ''}`}
      style={{ animation: `fadeUp 0.6s ease-out ${index * 0.08}s both` }}
    >
      <div className={`aspect-[4/3] relative overflow-hidden bg-gradient-to-br ${artist.gradient}`}>
        {artist.image ? (
          <img
            src={artist.image}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black text-white/20">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {artist.badge && (
          <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${
            artist.badge === 'FOUNDER' ? 'bg-blue-500 text-white' :
            artist.badge === 'PRODUCER' ? 'bg-purple-500 text-white' :
            artist.badge === 'COLLAB' ? 'bg-amber-500 text-black' :
            'bg-white/20 text-white backdrop-blur-sm'
          }`}>
            {artist.badge}
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-black text-white mb-1">{artist.name}</h3>
          <p className="text-white/60 text-sm">{artist.role}</p>
        </div>
      </div>
      <div className="p-5">
        <p className="text-white/40 text-sm mb-4 line-clamp-2">{artist.bio}</p>
        <div className="flex items-center gap-4 text-sm">
          {stats.trackCount > 0 && (
            <span className="flex items-center gap-1.5 text-white/50">
              <Music size={14} className="text-blue-400" />
              {stats.trackCount} {stats.trackCount === 1 ? 'track' : 'tracks'}
            </span>
          )}
          {stats.producedCount > 0 && (
            <span className="flex items-center gap-1.5 text-white/50">
              <Headphones size={14} className="text-purple-400" />
              {stats.producedCount} produced
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtistsPage() {
  const [filter, setFilter] = useState('all');

  const filteredArtists = filter === 'all'
    ? FEATURED_ARTISTS
    : FEATURED_ARTISTS.filter(a =>
        filter === 'producers' ? a.badge === 'PRODUCER' :
        filter === 'featured' ? ['FEATURED', 'COLLAB'].includes(a.badge) :
        a.isMain
      );

  const totalTracks = tracks.length;
  const uniqueProducers = [...new Set(tracks.map(t => t.producer).filter(Boolean))].length;
  const uniqueFeatured = [...new Set(tracks.map(t => t.featured).filter(Boolean))].length;

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/30 to-mystation-black" />
        <div className="bg-orb w-[500px] h-[500px] bg-blue-500 top-[-200px] right-[-100px]" />
        <div className="bg-orb w-[400px] h-[400px] bg-purple-500 bottom-[-100px] left-[-100px]" style={{ animationDelay: '-3s' }} />
        <div className="relative max-w-screen-xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
            <Users size={16} className="text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">IDMG Roster</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-white mb-4">
            The <span className="gradient-text">Artists</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10">
            The talent behind MyStation. Producers, artists, and collaborators building the IDMG legacy.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Music, value: totalTracks, label: 'Tracks' },
              { icon: Mic2, value: uniqueFeatured, label: 'Featured Artists' },
              { icon: Headphones, value: uniqueProducers, label: 'Producers' },
              { icon: Award, value: '100M+', label: 'Combined Streams' },
            ].map((stat, i) => (
              <div key={i} className="text-center" style={{ animation: `fadeUp 0.5s ease-out ${0.3 + i * 0.1}s both` }}>
                <stat.icon size={24} className="text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-white/40 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { id: 'all', label: 'All Artists' },
              { id: 'main', label: 'Core Team' },
              { id: 'producers', label: 'Producers' },
              { id: 'featured', label: 'Featured' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  filter === cat.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Artist Grid */}
      <section className="py-8 pb-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtists.map((artist, i) => (
              <ArtistCard key={artist.name} artist={artist} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="glass rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative">
              <Crown size={48} className="text-blue-400 mx-auto mb-6" />
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Want to Collaborate?</h2>
              <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
                Record a verse on a Mike Page track through Make A Hit, or create your own station on MyStation.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/make-a-hit" className="btn-primary flex items-center gap-2 hover:scale-105 transition-all">
                  <Mic2 size={18} /> Make A Hit
                </Link>
                <Link href="/station/create" className="btn-secondary flex items-center gap-2 hover:scale-105 transition-all">
                  <Star size={18} /> Create Station
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
