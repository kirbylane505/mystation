/**
 * MYSTATION - Artist Profile Page
 * Individual artist pages with their music, bio, and browse section
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TrackList from '@/components/TrackList';
import { usePlayerStore } from '@/store/playerStore';
import {
  Play, Pause, Heart, Share2, ExternalLink, Music,
  Users, MapPin, Calendar, Headphones, Instagram,
  Twitter, Globe, CheckCircle, Plus, Disc
} from 'lucide-react';

// Demo artist data (will be Supabase later)
const DEMO_ARTISTS = {
  'mike-page': {
    id: 'mike-page',
    name: 'Mike Page',
    slug: 'mike-page',
    bio: 'Atlanta-based artist and founder of Impossible Dreamz Music Group (IDMG). Originally from Elgin, IL. Creator of Love on the Lawn festival. All streams support the Mike Page Foundation 501(c)(3).',
    location: 'Atlanta, GA',
    profileImage: '/images/mike-page-profile.jpg',
    coverImage: '/images/mike-page-cover.jpg',
    genres: ['Hip-Hop', 'R&B', 'Soul'],
    isVerified: true,
    isFeatured: true,
    followerCount: 15420,
    totalPlays: 125000,
    socialLinks: {
      instagram: 'https://instagram.com/mikepagelivin',
      twitter: 'https://twitter.com/mikepageidmg',
      website: 'https://mystationlive.com',
    },
    streamingLinks: {
      spotify: 'https://open.spotify.com/artist/3JwFt4Qb3uAUzipnMyM6G6',
      apple: 'https://music.apple.com/us/artist/mike-page/1515325834',
    },
    trackIds: [100, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    albums: [
      { id: 'cindys-son', title: "Cindy's Son", year: 2022, trackCount: 23 },
      { id: 'singles-2026', title: "Singles", year: 2026, trackCount: 1 },
    ],
  },
};

export default function ArtistProfilePage() {
  const params = useParams();
  const slug = params.slug;
  const [artist, setArtist] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('music');
  const { setQueue, currentTrack, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    // Load artist data (demo or from Supabase)
    const artistData = DEMO_ARTISTS[slug];
    if (artistData) {
      setArtist(artistData);
    }

    // Check if following
    const following = localStorage.getItem('mystation-following') || '[]';
    setIsFollowing(JSON.parse(following).includes(slug));
  }, [slug]);

  const handleFollow = () => {
    const following = JSON.parse(localStorage.getItem('mystation-following') || '[]');
    if (isFollowing) {
      const updated = following.filter(id => id !== slug);
      localStorage.setItem('mystation-following', JSON.stringify(updated));
    } else {
      following.push(slug);
      localStorage.setItem('mystation-following', JSON.stringify(following));
    }
    setIsFollowing(!isFollowing);
  };

  const handlePlayAll = () => {
    if (artist?.trackIds?.length > 0) {
      // Import tracks and set queue
      import('@/data/tracks').then(({ tracks }) => {
        const artistTracks = artist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean);
        setQueue(artistTracks, 0);
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: `${artist?.name} on MyStation`,
        text: `Check out ${artist?.name} on MyStation!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Music size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/60">Artist not found</p>
          <Link href="/artists" className="text-blue-400 hover:underline mt-4 block">
            Browse all artists
          </Link>
        </div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-600/30 to-purple-600/30">
        {artist.coverImage && (
          <img
            src={artist.coverImage}
            alt={`${artist.name} cover`}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-mystation-black via-mystation-black/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="max-w-screen-xl mx-auto px-6 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          {/* Profile Image */}
          <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-mystation-black flex items-center justify-center overflow-hidden shadow-2xl">
            {artist.profileImage ? (
              <img
                src={artist.profileImage}
                alt={artist.name}
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <span className="text-6xl">🎤</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {artist.isVerified && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                  <CheckCircle size={12} />
                  Verified
                </span>
              )}
              {artist.isFeatured && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                  Featured Artist
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{artist.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm mb-4">
              {artist.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {artist.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={14} />
                {formatNumber(artist.followerCount)} followers
              </span>
              <span className="flex items-center gap-1">
                <Headphones size={14} />
                {formatNumber(artist.totalPlays)} plays
              </span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {artist.genres?.map(genre => (
                <span key={genre} className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-sm">
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full transition shadow-lg shadow-blue-500/30"
            >
              <Play size={20} fill="white" />
              Play All
            </button>
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-6 py-3 font-bold rounded-full transition ${
                isFollowing
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {isFollowing ? (
                <>
                  <CheckCircle size={18} />
                  Following
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Follow
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
            >
              <Share2 size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Bio */}
        {artist.bio && (
          <p className="text-white/70 mt-6 max-w-3xl leading-relaxed">{artist.bio}</p>
        )}

        {/* Social Links */}
        <div className="flex flex-wrap gap-3 mt-6">
          {artist.socialLinks?.instagram && (
            <a
              href={artist.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition"
            >
              <Instagram size={16} />
              Instagram
            </a>
          )}
          {artist.socialLinks?.twitter && (
            <a
              href={artist.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition"
            >
              <Twitter size={16} />
              Twitter
            </a>
          )}
          {artist.streamingLinks?.spotify && (
            <a
              href={artist.streamingLinks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/30 text-[#1DB954] rounded-lg text-sm transition"
            >
              Spotify
              <ExternalLink size={14} />
            </a>
          )}
          {artist.streamingLinks?.apple && (
            <a
              href={artist.streamingLinks.apple}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#FC3C44]/20 hover:bg-[#FC3C44]/30 text-[#FC3C44] rounded-lg text-sm transition"
            >
              Apple Music
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-10 border-b border-white/10 pb-0">
          {['music', 'albums', 'about'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-white border-blue-500'
                  : 'text-white/50 border-transparent hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'music' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Browse Music</h2>
              <div className="glass rounded-2xl p-2">
                <TrackList trackIds={artist.trackIds} showComments={true} />
              </div>
            </div>
          )}

          {activeTab === 'albums' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Albums & Projects</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {artist.albums?.map(album => (
                  <div
                    key={album.id}
                    className="glass rounded-xl p-4 hover:bg-white/10 transition cursor-pointer group"
                  >
                    <div className="aspect-square bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                      <Disc size={40} className="text-white/40" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <Play size={20} className="text-white ml-1" fill="white" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-white">{album.title}</h4>
                    <p className="text-white/50 text-sm">{album.year} • {album.trackCount} tracks</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">About {artist.name}</h2>
              <div className="glass rounded-2xl p-6 space-y-6">
                <p className="text-white/70 leading-relaxed">{artist.bio}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-sm">Location</p>
                    <p className="text-white font-medium">{artist.location}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-sm">Genres</p>
                    <p className="text-white font-medium">{artist.genres?.join(', ')}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-sm">Total Followers</p>
                    <p className="text-white font-medium">{formatNumber(artist.followerCount)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/40 text-sm">Total Plays</p>
                    <p className="text-white font-medium">{formatNumber(artist.totalPlays)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
