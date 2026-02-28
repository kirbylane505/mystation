/**
 * MYSTATION - Music Browse Page Client
 * Full catalog with filters, sorting, playlists, comments, and Vault tab
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import TrackList from '@/components/TrackList';
import CreatePlaylistModal from '@/components/CreatePlaylistModal';
import { tracks, albums, playlists, getOfficialTracks } from '@/data/tracks';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import {
  Search, SlidersHorizontal, Grid, List, Plus,
  ArrowUpDown, Music, Clock, Calendar, Disc,
  TrendingUp, Shuffle, Play, ChevronLeft, Pause,
  Lock, Unlock, ShieldCheck, Loader2
} from 'lucide-react';

const IDMG_LOGO = '/images/idmg-logo-white.png';

export default function MusicPageClient({ initialTrackId, initialAlbumId, autoplay = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterAlbum, setFilterAlbum] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('list');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeTab, setActiveTab] = useState('music');
  // Deterministic seed — same on server & client, changes daily (no hydration mismatch)
  const [shuffleSeed] = useState(() => (Math.floor(Date.now() / 86400000) % 10000) / 10000);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);
  const [hasVaultAccess, setHasVaultAccess] = useState(false);
  const { setQueue, play, currentTrack, isPlaying, vaultUnlocked, setVaultUnlocked } = usePlayerStore();
  const { isSubscribed } = useUserStore();

  // Auto-filter to album if coming from album share link
  useEffect(() => {
    if (initialAlbumId) {
      const album = albums.find(a => a.id === initialAlbumId);
      if (album) {
        setFilterAlbum(album.title);
      }
    }
  }, [initialAlbumId]);

  // Auto-play track if coming from share link
  useEffect(() => {
    if (initialTrackId) {
      const trackIndex = tracks.findIndex(t => t.id === parseInt(initialTrackId));
      if (trackIndex >= 0) {
        setQueue(tracks, trackIndex);
        if (autoplay) {
          setTimeout(() => play(), 100);
        }
      }
    }
  }, [initialTrackId, autoplay, setQueue, play]);

  // Load user playlists from localStorage (will be Supabase later)
  useEffect(() => {
    const saved = localStorage.getItem('mystation-playlists');
    if (saved) {
      try { setUserPlaylists(JSON.parse(saved)); } catch { localStorage.removeItem('mystation-playlists'); }
    }
  }, []);

  // Check vault access on mount (server-side cookie check)
  useEffect(() => {
    if (isSubscribed || vaultUnlocked) {
      setHasVaultAccess(true);
      return;
    }
    fetch('/api/vault/verify')
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setHasVaultAccess(true);
          setVaultUnlocked(true);
        }
      })
      .catch(() => {});
  }, [isSubscribed, vaultUnlocked, setVaultUnlocked]);

  // Sync store changes
  useEffect(() => {
    if (isSubscribed || vaultUnlocked) setHasVaultAccess(true);
  }, [isSubscribed, vaultUnlocked]);

  const handleAccessCodeSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setAccessLoading(true);
    setAccessError('');
    try {
      const res = await fetch('/api/access-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setHasVaultAccess(true);
        setVaultUnlocked(true);
        setAccessCode('');
      } else {
        setAccessError(data.error || 'Invalid code');
      }
    } catch {
      setAccessError('Something went wrong. Try again.');
    } finally {
      setAccessLoading(false);
    }
  }, [accessCode, setVaultUnlocked]);

  // Get only official tracks
  const officialTracks = getOfficialTracks();

  // Separate vault tracks
  const vaultTracks = officialTracks.filter(t => t.album === 'Vault' || t.albumId === 'vault');
  const musicTracks = officialTracks.filter(t => t.album !== 'Vault' && t.albumId !== 'vault');

  // Get unique years and albums (from non-vault tracks)
  const years = [...new Set(musicTracks.map(t => t.year))].sort((a, b) => b - a);
  const albumList = [...new Set(musicTracks.map(t => t.album).filter(Boolean))];

  // Filter music tracks (vault tracks excluded — vault is locked teaser only)
  let filteredTracks = musicTracks.filter(track => {
    const matchesSearch = track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.featured && track.featured.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (track.producer && track.producer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesYear = filterYear === 'all' || track.year === parseInt(filterYear);
    const matchesAlbum = filterAlbum === 'all' || track.album === filterAlbum;

    return matchesSearch && matchesYear && matchesAlbum;
  });

  // Sort tracks
  switch (sortBy) {
    case 'title-asc':
      filteredTracks = [...filteredTracks].sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title-desc':
      filteredTracks = [...filteredTracks].sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'year-new':
      filteredTracks = [...filteredTracks].sort((a, b) => b.year - a.year);
      break;
    case 'year-old':
      filteredTracks = [...filteredTracks].sort((a, b) => a.year - b.year);
      break;
    case 'album':
      filteredTracks = [...filteredTracks].sort((a, b) => (a.album || '').localeCompare(b.album || ''));
      break;
    case 'bpm':
      filteredTracks = [...filteredTracks].sort((a, b) => (b.bpm || 0) - (a.bpm || 0));
      break;
    case 'shuffle':
      // Use seeded sort to prevent re-shuffling on every re-render
      filteredTracks = [...filteredTracks].sort((a, b) => {
        const hashA = ((a.id * 2654435761 + shuffleSeed * 9999999) >>> 0) % 1000;
        const hashB = ((b.id * 2654435761 + shuffleSeed * 9999999) >>> 0) % 1000;
        return hashA - hashB;
      });
      break;
    default:
      // If album filter active, sort by track number (album order)
      if (filterAlbum !== 'all') {
        filteredTracks = [...filteredTracks].sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
      } else {
        // Default: shuffle on each page visit using stable seed
        filteredTracks = [...filteredTracks].sort((a, b) => {
          const hashA = ((a.id * 2654435761 + shuffleSeed * 1000000) >>> 0) % 1000;
          const hashB = ((b.id * 2654435761 + shuffleSeed * 1000000) >>> 0) % 1000;
          return hashA - hashB;
        });
      }
      break;
  }

  const handleCreatePlaylist = (playlist) => {
    const newPlaylists = [...userPlaylists, { ...playlist, id: Date.now() }];
    setUserPlaylists(newPlaylists);
    localStorage.setItem('mystation-playlists', JSON.stringify(newPlaylists));
    setShowPlaylistModal(false);
  };

  const handleOpenPlaylist = (playlist) => {
    setActivePlaylist(playlist);
  };

  const handlePlayAllPlaylist = (playlist, startIndex = 0) => {
    const playlistTrackIds = playlist.trackIds || [];
    if (playlistTrackIds.length === 0) return;
    const playlistTracks = playlistTrackIds
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean);
    if (playlistTracks.length > 0) {
      setQueue(playlistTracks, startIndex);
      play();
    }
  };

  const getPlaylistTracks = (playlist) => {
    if (!playlist) return [];
    return (playlist.trackIds || [])
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean);
  };

  const allPlaylists = [...playlists, ...userPlaylists];

  // Pick a featured album for hero (rotate based on day)
  const heroAlbums = albums.filter(a => a.coverImage && a.id !== 'vault');
  const heroAlbum = heroAlbums[Math.floor(Date.now() / 86400000) % heroAlbums.length] || heroAlbums[0];

  const handlePlayAll = () => {
    const playable = musicTracks.filter(t => !t.streamOnly && t.audioFile);
    if (playable.length > 0) {
      setQueue(playable, 0);
      play();
    }
  };

  const handleShuffleAll = () => {
    const playable = musicTracks.filter(t => !t.streamOnly && t.audioFile);
    const shuffled = [...playable].sort(() => Math.random() - 0.5);
    if (shuffled.length > 0) {
      setQueue(shuffled, 0);
      play();
    }
  };

  const handlePlayAlbum = (albumId) => {
    const albumTracks = musicTracks.filter(t => t.albumId === albumId && !t.streamOnly && t.audioFile);
    if (albumTracks.length > 0) {
      setQueue(albumTracks, 0);
      play();
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">

        {/* === HERO SECTION === */}
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden mb-8 mt-4">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-mystation-darker/90 to-purple-900/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(96,165,250,0.15),transparent_60%)]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-10">
            {/* Album art grid */}
            <div className="grid grid-cols-2 gap-2 w-40 md:w-52 shrink-0">
              {heroAlbums.slice(0, 4).map((a, i) => (
                <div key={a.id} className={`aspect-square rounded-lg overflow-hidden border border-white/10 ${i === 0 ? 'shadow-lg shadow-blue-500/20' : ''}`}>
                  <img src={a.coverImage} alt={a.title} className={`w-full h-full ${a.coverImage === IDMG_LOGO ? 'object-contain p-2 bg-[#0a1628]' : 'object-cover'}`} />
                </div>
              ))}
            </div>

            {/* Hero text */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-2">Mike Page Collection</p>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
                {musicTracks.length} Tracks.<br className="hidden md:block" /> Subscribe & Stream.
              </h1>
              <p className="text-white/50 text-sm md:text-base mb-6 max-w-md">
                Preview 2 tracks free — subscribe to unlock the full catalog. Every stream supports youth music programs through the Mike Page Foundation.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full transition active:scale-95 shadow-lg shadow-blue-500/25"
                >
                  <Play size={18} fill="currentColor" />
                  Play All
                </button>
                <button
                  onClick={handleShuffleAll}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition active:scale-95 backdrop-blur"
                >
                  <Shuffle size={18} />
                  Shuffle
                </button>
              </div>
            </div>

            {/* Featured Video — To The Money */}
            <div className="hidden lg:flex flex-col w-[280px] shrink-0">
              <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/DC9CGQN_DI8?rel=0"
                    title="Mike Page - To The Money (Official 4K Video)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className="text-white font-bold text-sm">To The Money</p>
                  <p className="text-white/40 text-xs">Official 4K Video</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === ALBUMS === */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {albums.filter(a => a.id !== 'vault').map(album => {
              const albumTrackCount = musicTracks.filter(t => t.albumId === album.id).length;
              return (
                <button
                  key={album.id}
                  onClick={() => { setFilterAlbum(album.title); setSortBy('default'); setActiveTab('music'); }}
                  className="flex-shrink-0 w-36 md:w-44 group text-left"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2 border border-white/10 group-hover:border-blue-500/50 transition shadow-lg">
                    {album.coverImage ? (
                      <img src={album.coverImage} alt={album.title} className={`w-full h-full ${album.coverImage === IDMG_LOGO ? 'object-contain p-3 bg-[#0a1628]' : 'object-cover'} group-hover:scale-105 transition duration-300`} />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${album.coverGradient || 'from-blue-600 to-purple-700'} flex items-center justify-center`}>
                        <span className="text-4xl">{album.coverEmoji || '🎵'}</span>
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    {album.isNew && (
                      <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">New</span>
                    )}
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{album.title}</p>
                  <p className="text-white/40 text-xs">{albumTrackCount} tracks • {album.year}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('music'); setFilterAlbum('all'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition ${
              activeTab === 'music'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Music size={16} />
            All Music
          </button>
          <button
            onClick={() => { setActiveTab('vault'); setFilterAlbum('all'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition ${
              activeTab === 'vault'
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'
            }`}
          >
            {hasVaultAccess ? <Unlock size={16} /> : <Lock size={16} />}
            The Vault
            {hasVaultAccess && <span className="text-xs opacity-60">({vaultTracks.length})</span>}
          </button>
        </div>

        {/* Vault Tab Content */}
        {activeTab === 'vault' && !hasVaultAccess && (
          <div className="glass rounded-2xl p-8 md:p-12 mb-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-amber-900/20 pointer-events-none" />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Lock size={36} className="text-purple-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">The Vault</h2>
              <p className="text-white/60 mb-4 max-w-md mx-auto">
                {vaultTracks.length} exclusive unreleased tracks locked inside.
              </p>

              {/* Access Code Input */}
              <form onSubmit={handleAccessCodeSubmit} className="max-w-sm mx-auto mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter access code"
                    value={accessCode}
                    onChange={(e) => { setAccessCode(e.target.value); setAccessError(''); }}
                    autoComplete="off"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 text-center tracking-widest uppercase"
                  />
                  <button
                    type="submit"
                    disabled={accessLoading || !accessCode.trim()}
                    className="px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition flex items-center gap-2"
                  >
                    {accessLoading ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                    Unlock
                  </button>
                </div>
                {accessError && (
                  <p className="text-red-400 text-sm mt-2">{accessError}</p>
                )}
              </form>

              <div className="flex items-center gap-2 justify-center text-purple-400 text-sm font-medium">
                <ShieldCheck size={14} />
                <span>Subscribers get full vault access</span>
              </div>
            </div>
          </div>
        )}

        {/* Vault Unlocked — show tracks */}
        {activeTab === 'vault' && hasVaultAccess && (
          <>
            <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Unlock size={18} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">The Vault</h2>
                <p className="text-white/50 text-sm">{vaultTracks.length} exclusive tracks</p>
              </div>
            </div>
            <div className="glass rounded-2xl p-2">
              <TrackList trackIds={vaultTracks.map(t => t.id)} showComments={true} />
            </div>
          </>
        )}

        {/* Search & Filters — music tab only */}
        {activeTab === 'music' && (
          <>
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex flex-col gap-4">
                {/* Top Row - Search */}
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search tracks, producers, features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                    name="mystation-music-filter"
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bottom Row - Filters & Sort */}
                <div className="flex flex-wrap gap-3">
                  {/* Year Filter */}
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  {/* Album Filter */}
                  <select
                      value={filterAlbum}
                      onChange={(e) => setFilterAlbum(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Albums</option>
                      {albumList.map(album => (
                        <option key={album} value={album}>{album}</option>
                      ))}
                    </select>

                  {/* Sort By */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="default">Default Order</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="year-new">Newest First</option>
                    <option value="year-old">Oldest First</option>
                    <option value="album">By Album</option>
                    <option value="bpm">By BPM</option>
                    <option value="shuffle">Shuffle</option>
                  </select>

                  <div className="flex-1" />

                  {/* View Toggle */}
                  <div className="flex bg-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <List size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}
                    >
                      <Grid size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => { setFilterYear('all'); setFilterAlbum('all'); setSortBy('year-new'); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 hover:border-blue-400/60 text-blue-300 rounded-full text-sm font-medium transition"
                >
                  <TrendingUp size={14} />
                  Latest
                </button>
                <button
                  onClick={() => { setFilterAlbum("Cindy's Son"); setSortBy('default'); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 rounded-full text-sm font-medium transition"
                >
                  <Disc size={14} />
                  Cindy&apos;s Son
                </button>
                <button
                  onClick={() => { setFilterAlbum("Shezzy Knew It"); setSortBy('default'); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 rounded-full text-sm font-medium transition"
                >
                  <Disc size={14} />
                  Shezzy Knew It
                </button>
                {years.slice(0, 3).map(year => (
                  <button
                    key={year}
                    onClick={() => { setFilterYear(String(year)); setFilterAlbum('all'); setSortBy('default'); }}
                    className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/30 text-white/60 hover:text-white rounded-full text-sm font-medium transition"
                  >
                    {year}
                  </button>
                ))}
              </div>

            {/* Playlists Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Playlists</h2>
                  <button
                    onClick={() => setShowPlaylistModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-medium transition"
                  >
                    <Plus size={14} />
                    Create
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                  {allPlaylists.map(playlist => (
                    <button
                      key={playlist.id}
                      onClick={() => handleOpenPlaylist(playlist)}
                      className="flex-shrink-0 w-40 md:w-44 group text-left"
                    >
                      <div className={`w-full aspect-square bg-gradient-to-br ${playlist.coverGradient || 'from-blue-500/30 to-purple-500/30'} rounded-xl mb-2 flex items-center justify-center relative overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition shadow-lg`}>
                        <span className="text-4xl">{playlist.emoji || ''}</span>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <Play size={20} className="text-white ml-0.5" fill="white" />
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{playlist.title || playlist.name}</p>
                      <p className="text-white/40 text-xs">{playlist.trackIds?.length || 0} tracks</p>
                    </button>
                  ))}

                  {allPlaylists.length === 0 && (
                    <button
                      onClick={() => setShowPlaylistModal(true)}
                      className="flex-shrink-0 w-40 md:w-44 aspect-square glass rounded-xl border-2 border-dashed border-white/15 hover:border-blue-500/40 flex flex-col items-center justify-center text-center transition"
                    >
                      <Plus size={24} className="text-white/30 mb-2" />
                      <p className="text-white/40 text-xs">Create your first playlist</p>
                    </button>
                  )}
                </div>
              </div>

            {/* Results */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {filterYear !== 'all' || filterAlbum !== 'all' || searchQuery
                    ? `Results (${filteredTracks.length})`
                    : 'All Tracks'}
                </h2>
                {(filterYear !== 'all' || filterAlbum !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterYear('all');
                      setFilterAlbum('all');
                      setSortBy('default');
                    }}
                    className="text-blue-400 hover:underline text-sm"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              {filteredTracks.length > 0 ? (
                <div className="glass rounded-2xl p-2">
                  <TrackList trackIds={filteredTracks.map(t => t.id)} showComments={true} />
                </div>
              ) : (
                <div className="text-center py-16 glass rounded-2xl">
                  <Music size={48} className="text-white/20 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">No tracks found</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterYear('all');
                      setFilterAlbum('all');
                    }}
                    className="text-blue-400 hover:underline mt-4"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showPlaylistModal && (
        <CreatePlaylistModal
          onClose={() => setShowPlaylistModal(false)}
          onCreate={handleCreatePlaylist}
          availableTracks={officialTracks}
        />
      )}

      {/* Playlist Detail View — LOCKED */}
      {activePlaylist && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <div className="max-w-screen-lg mx-auto">
              <button
                onClick={() => setActivePlaylist(null)}
                className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition"
              >
                <ChevronLeft size={24} />
                <span>Back to Music</span>
              </button>

              {/* Playlist Info */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className={`w-48 h-48 flex-shrink-0 bg-gradient-to-br ${activePlaylist.coverGradient || 'from-blue-500/30 to-purple-500/30'} rounded-2xl flex items-center justify-center`}>
                  <span className="text-7xl">{activePlaylist.emoji || ''}</span>
                </div>
                <div className="flex flex-col justify-end">
                  <p className="text-white/60 text-sm mb-1">PLAYLIST</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {activePlaylist.title || activePlaylist.name}
                  </h1>
                  {activePlaylist.description && (
                    <p className="text-white/60 mb-4">{activePlaylist.description}</p>
                  )}
                  <p className="text-white/60 text-sm">
                    {getPlaylistTracks(activePlaylist).length} tracks
                  </p>
                </div>
              </div>

              {/* Play All Button */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => handlePlayAllPlaylist(activePlaylist)}
                  className="flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition"
                >
                  <Play size={24} fill="white" />
                  Play All
                </button>
                <button
                  onClick={() => {
                    const shuffled = { ...activePlaylist, trackIds: [...(activePlaylist.trackIds || [])].sort(() => Math.random() - 0.5) };
                    handlePlayAllPlaylist(shuffled);
                  }}
                  className="flex items-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition"
                >
                  <Shuffle size={20} />
                  Shuffle
                </button>
              </div>

              {/* Track List */}
              <div className="glass rounded-2xl overflow-hidden">
                {getPlaylistTracks(activePlaylist).map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => handlePlayAllPlaylist(activePlaylist, index)}
                      className={`w-full flex items-center gap-4 p-4 hover:bg-white/10 transition text-left border-b border-white/5 last:border-0 ${
                        isCurrentTrack ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <div className="w-8 text-center">
                        {isCurrentTrack && isPlaying ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <span className="w-1 h-4 bg-green-400 rounded-full animate-pulse" />
                            <span className="w-1 h-3 bg-green-400 rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-5 bg-green-400 rounded-full animate-pulse delay-150" />
                          </div>
                        ) : (
                          <span className="text-white/40">{index + 1}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-white/50 text-sm truncate">
                          Mike Page {track.featured && `ft. ${track.featured}`}
                          {track.producer && ` • Prod. ${track.producer}`}
                        </p>
                      </div>

                      <span className="text-white/40 text-sm">
                        {track.duration || '3:30'}
                      </span>
                    </button>
                  );
                })}

                {getPlaylistTracks(activePlaylist).length === 0 && (
                  <div className="p-8 text-center">
                    <Music size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">This playlist is empty</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
