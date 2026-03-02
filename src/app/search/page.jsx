/**
 * MYSTATION - Global Search
 * Search MyStation catalog + Spotify's 100M+ songs
 * Create playlists with any music in the world
 */

'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Play, Pause, Plus, Music, Disc3, Loader2, X, ListPlus, Check, ExternalLink, Sparkles, Lock } from 'lucide-react';
import { usePlayerStore, useUserStore, isGated } from '@/store/playerStore';
import usePlaylistStore from '@/store/playlistStore';
import { tracks as myStationTracks } from '@/data/tracks';
import Link from 'next/link';
import Image from 'next/image';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="text-blue-400 animate-spin" /></div>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ mystation: [], spotify: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingTo, setAddingTo] = useState(null); // trackId or spotifyId being added
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();
  const { playlists, createPlaylist, addTrack } = usePlaylistStore();
  const { isSubscribed, supporterTier } = useUserStore();

  // Everyone can search Spotify — but interacting with results requires subscription
  const hasSpotifyAccess = true;
  const canUseSpotifyResults = isSubscribed || supporterTier !== 'free';

  // Search MyStation catalog locally
  const searchMyStation = useCallback((q) => {
    const lower = q.toLowerCase();
    return myStationTracks
      .filter((t) => !t.isVault && !t.comingSoon)
      .filter((t) =>
        t.title.toLowerCase().includes(lower) ||
        (t.featured && t.featured.toLowerCase().includes(lower)) ||
        (t.producer && t.producer.toLowerCase().includes(lower)) ||
        (t.album && t.album.toLowerCase().includes(lower)) ||
        'mike page'.includes(lower)
      )
      .slice(0, 10)
      .map((t) => ({
        ...t,
        artist: t.featured ? `Mike Page ft. ${t.featured}` : 'Mike Page',
        source: 'mystation',
      }));
  }, []);

  // Unified search — Spotify + local in parallel
  const searchGlobal = useCallback(async (q) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/search/unified?q=${encodeURIComponent(q)}&limit=20&_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) { if (attempt < 1) continue; return { tracks: [], artists: [], deezerOnly: [] }; }
        const data = await res.json();
        if (data.error) { if (attempt < 1) continue; return { tracks: [], artists: [], deezerOnly: [] }; }
        return data;
      } catch {
        if (attempt < 1) continue;
        return { tracks: [], artists: [], deezerOnly: [] };
      }
    }
    return { tracks: [], artists: [], deezerOnly: [] };
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    (q) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q.trim()) {
        setResults({ mystation: [], spotify: [] });
        setSearched(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        setSearched(true);
        const local = searchMyStation(q);
        const global = await searchGlobal(q);
        setResults({ mystation: local, spotify: global.tracks || [] });
        setLoading(false);
      }, 300);
    },
    [searchMyStation, searchGlobal]
  );

  useEffect(() => {
    handleSearch(query);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, handleSearch]);

  // Play a MyStation track
  const playMyStation = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  // Play a global preview
  const playGlobalPreview = (track) => {
    if (!track.previewUrl) return;
    const trackId = track.spotifyId ? `spotify_${track.spotifyId}` : `deezer_${track.deezerId}`;
    const globalTrack = {
      id: trackId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      audioFile: track.previewUrl,
      albumArt: track.albumArt,
      duration: track.durationFormatted,
      source: track.source || 'spotify',
      spotifyUrl: track.spotifyUrl,
      isPreview: true,
    };
    if (currentTrack?.id === globalTrack.id) {
      togglePlay();
    } else {
      setTrack(globalTrack);
    }
  };

  // Add track to playlist
  const handleAddToPlaylist = (playlistId, track) => {
    let formatted;
    if (track.source === 'mystation') {
      formatted = {
        id: track.id,
        title: track.title,
        artist: track.artist || (track.featured ? `Mike Page ft. ${track.featured}` : 'Mike Page'),
        album: track.album,
        albumArt: track.albumArt || '/images/albums/cindys-son.jpg',
        audioSrc: track.audioFile,
        duration: track.duration,
        source: 'mystation',
      };
    } else {
      // Spotify or merged track
      formatted = {
        spotifyId: track.spotifyId || null,
        deezerId: track.deezerId || null,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArt: track.albumArt,
        previewUrl: track.previewUrl,
        spotifyUrl: track.spotifyUrl || null,
        duration: track.durationFormatted || track.duration,
        source: track.source || 'spotify',
      };
    }

    addTrack(playlistId, formatted);
    setShowPlaylistPicker(null);
    setAddedFeedback(track.spotifyId || track.deezerId || track.id);
    setTimeout(() => setAddedFeedback(null), 1500);
  };

  // Quick create playlist
  const handleCreateAndAdd = (track) => {
    if (!newPlaylistName.trim()) return;
    const id = createPlaylist(newPlaylistName.trim());
    handleAddToPlaylist(id, track);
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
  };

  const isTrackPlaying = (track) => {
    if (track.spotifyId) {
      return currentTrack?.id === `spotify_${track.spotifyId}` && isPlaying;
    }
    if (track.deezerId) {
      return currentTrack?.id === `deezer_${track.deezerId}` && isPlaying;
    }
    return currentTrack?.id === track.id && isPlaying;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-mystation-darker to-mystation-black" />
      <div className="bg-orb w-[500px] h-[500px] bg-indigo-500 top-[-200px] right-[-100px]" />
      <div className="bg-orb w-[400px] h-[400px] bg-purple-600 bottom-[20%] left-[-150px]" style={{ animationDelay: '-3s' }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-48">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            Search <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Music</span>
          </h1>
          <p className="text-white/40 text-sm">100M+ songs. Playable previews. Build your perfect playlist.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              ref={searchRef}
              id="mystation-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Kendrick Lamar, Drake, Mike Page..."
              autoComplete="off"
              name="mystation-global-search"
              className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 text-lg focus:outline-none focus:border-blue-500 focus:bg-white/15 transition"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {loading && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2">
              <Loader2 size={20} className="text-blue-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        {!searched && !loading && (
          <div className="text-center py-12 pb-24">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <Search size={36} className="text-white/20" />
            </div>
            <p className="text-white/30 text-lg mb-1">Search for Kendrick Lamar, Drake, Mike Page</p>
            <p className="text-white/20 text-sm mb-8">100 million+ songs from every artist in the world</p>

            {/* Trending Searches */}
            <div className="max-w-lg mx-auto">
              <p className="text-white/20 text-xs uppercase tracking-wider mb-3">Trending</p>
              <div className="flex flex-wrap justify-center gap-2 pb-8">
                {['Mike Page', 'Drake', 'Kendrick Lamar', 'Future', 'The Weeknd', 'Tyler, The Creator', 'SZA', 'Metro Boomin'].map((artist) => (
                  <button
                    key={artist}
                    onClick={() => setQuery(artist)}
                    className="trending-chip"
                  >
                    <Sparkles size={12} />
                    {artist}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {searched && !loading && results.mystation.length === 0 && results.spotify.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-white/20 text-sm mt-2 mb-6">Try a different search</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Mike Page', 'Drake', 'Kendrick Lamar', 'Future'].map((artist) => (
                <button
                  key={artist}
                  onClick={() => setQuery(artist)}
                  className="trending-chip"
                >
                  {artist}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MyStation Results */}
        {results.mystation.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                <Music size={14} className="text-white" />
              </div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">MyStation</h2>
              <span className="text-[10px] text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-md font-medium">Full Tracks</span>
            </div>
            <div className="space-y-2">
              {results.mystation.map((track) => (
                <TrackRow
                  key={`ms-${track.id}`}
                  track={track}
                  isPlaying={isTrackPlaying(track)}
                  isLocked={isGated(track)}
                  onPlay={() => isGated(track) ? usePlayerStore.getState().openSubscribeModal(track) : playMyStation(track)}
                  onAddToPlaylist={() => setShowPlaylistPicker(track.id)}
                  showPlaylistPicker={showPlaylistPicker === track.id}
                  playlists={playlists}
                  onSelectPlaylist={(plId) => handleAddToPlaylist(plId, track)}
                  onClosePlaylistPicker={() => setShowPlaylistPicker(null)}
                  onCreatePlaylist={() => setShowCreatePlaylist(true)}
                  addedFeedback={addedFeedback === track.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Global Results */}
        {results.spotify.length > 0 && (
          <div className="mb-8 relative">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/20">
                <Disc3 size={14} className="text-white" />
              </div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">Global</h2>
              <span className="text-[10px] text-green-300 bg-green-500/15 px-2 py-0.5 rounded-md font-medium">Spotify</span>
              {!canUseSpotifyResults && (
                <span className="text-[10px] text-yellow-300 bg-yellow-500/15 px-2.5 py-0.5 rounded-md font-medium ml-auto">Subscribe to Unlock</span>
              )}
            </div>

            {/* Subscription gate — show blurred results with subscribe CTA */}
            {!canUseSpotifyResults && (
              <div className="relative">
                {/* Show first 2 results normally as a tease */}
                <div className="space-y-2 mb-2">
                  {results.spotify.slice(0, 2).map((track) => (
                    <TrackRow
                      key={`sp-${track.spotifyId || track.deezerId}`}
                      track={track}
                      isPlaying={false}
                      onPlay={() => usePlayerStore.getState().openSubscribeModal()}
                      onAddToPlaylist={() => usePlayerStore.getState().openSubscribeModal()}
                      showPlaylistPicker={false}
                      playlists={[]}
                      onSelectPlaylist={() => {}}
                      onClosePlaylistPicker={() => {}}
                      onCreatePlaylist={() => {}}
                      addedFeedback={false}
                      spotify
                    />
                  ))}
                </div>
                {/* Blurred remaining results + subscribe overlay */}
                <div className="relative overflow-hidden rounded-xl">
                  <div className="blur-sm pointer-events-none opacity-40 space-y-2">
                    {results.spotify.slice(2, 6).map((track) => (
                      <TrackRow
                        key={`sp-blur-${track.spotifyId || track.deezerId}`}
                        track={track}
                        isPlaying={false}
                        onPlay={() => {}}
                        onAddToPlaylist={() => {}}
                        showPlaylistPicker={false}
                        playlists={[]}
                        onSelectPlaylist={() => {}}
                        onClosePlaylistPicker={() => {}}
                        onCreatePlaylist={() => {}}
                        addedFeedback={false}
                        spotify
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-mystation-navy/95 via-mystation-navy/80 to-transparent">
                    <div className="text-center p-6">
                      <h3 className="text-xl font-bold text-white mb-2">Subscribe to MyStation</h3>
                      <p className="text-white/60 text-sm mb-4">Get access to 100M+ songs from every artist in the world</p>
                      <button
                        onClick={() => usePlayerStore.getState().openSubscribeModal()}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full hover:opacity-90 transition"
                      >
                        Subscribe — Plans from $4.99/mo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full results for subscribers */}
            {canUseSpotifyResults && (
              <div className="space-y-2">
                {results.spotify.map((track) => (
                  <TrackRow
                    key={`sp-${track.spotifyId || track.deezerId}`}
                    track={track}
                    isPlaying={isTrackPlaying(track)}
                    onPlay={() => playGlobalPreview(track)}
                    onAddToPlaylist={() => setShowPlaylistPicker(track.spotifyId || track.deezerId)}
                    showPlaylistPicker={showPlaylistPicker === (track.spotifyId || track.deezerId)}
                    playlists={playlists}
                    onSelectPlaylist={(plId) => handleAddToPlaylist(plId, track)}
                    onClosePlaylistPicker={() => setShowPlaylistPicker(null)}
                    onCreatePlaylist={() => setShowCreatePlaylist(true)}
                    addedFeedback={addedFeedback === (track.spotifyId || track.deezerId)}
                    spotify
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spotify Upgrade Prompt — shown when trial expired and not Premium+ */}
        {!hasSpotifyAccess && searched && (
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-3 mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <div>
                <h3 className="text-white font-bold text-sm">Unlock 100M+ Songs</h3>
                <p className="text-white/50 text-xs">Search any artist in the world with Premium</p>
              </div>
            </div>
            <Link
              href="/subscribe/success"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://buy.stripe.com/bJe00lcmL2t8cuUcv11oI01';
              }}
              className="block w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl text-center text-sm hover:opacity-90 transition"
            >
              Upgrade to Premium — $9.99/mo
            </Link>
            <p className="text-white/30 text-[10px] text-center mt-2">Includes global Spotify search, early drops, Fan Zone, DJ access & more</p>
          </div>
        )}

        {/* Playlist Quick-Link */}
        {playlists.length > 0 && searched && (
          <div className="mt-8 text-center">
            <Link
              href="/playlists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 font-semibold rounded-xl hover:bg-purple-500/30 transition"
            >
              <ListPlus size={18} />
              View My Playlists ({playlists.length})
            </Link>
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreatePlaylist(false)}>
          <div className="glass rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Create Playlist</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd(showPlaylistPicker)}
              placeholder="Playlist name..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreatePlaylist(false)}
                className="flex-1 py-3 bg-white/10 text-white/60 rounded-xl hover:bg-white/20 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newPlaylistName.trim()) {
                    createPlaylist(newPlaylistName.trim());
                    setNewPlaylistName('');
                    setShowCreatePlaylist(false);
                  }
                }}
                disabled={!newPlaylistName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual track row component
function TrackRow({
  track,
  isPlaying,
  isLocked = false,
  onPlay,
  onAddToPlaylist,
  showPlaylistPicker,
  playlists,
  onSelectPlaylist,
  onClosePlaylistPicker,
  onCreatePlaylist,
  addedFeedback,
  spotify = false,
}) {
  const hasPreview = spotify ? !!track.previewUrl : true;

  return (
    <div className={`relative group ${isLocked ? 'opacity-40' : ''}`}>
      <div className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
        isPlaying
          ? 'bg-blue-500/15 border border-blue-500/30 shadow-lg shadow-blue-500/5'
          : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12]'
      }`}>
        {/* Album Art / Play Button */}
        <button
          onClick={onPlay}
          disabled={!hasPreview}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 group/play shadow-md ${!hasPreview ? 'opacity-50' : ''}`}
        >
          {track.albumArt ? (
            <img
              src={track.albumArt}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600/60 to-purple-800/80 flex items-center justify-center">
              <Music size={20} className="text-white/40" />
            </div>
          )}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-200 ${
            isLocked ? 'opacity-100' : isPlaying ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'
          }`}>
            {isLocked ? (
              <Lock size={16} className="text-white/70" />
            ) : isPlaying ? (
              <Pause size={20} className="text-white drop-shadow-lg" fill="white" />
            ) : hasPreview ? (
              <Play size={20} className="text-white ml-0.5 drop-shadow-lg" fill="white" />
            ) : (
              <ExternalLink size={14} className="text-white/60" />
            )}
          </div>
          {/* Playable indicator dot */}
          {hasPreview && !isPlaying && (
            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
          )}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`font-semibold text-sm truncate ${isPlaying ? 'text-blue-400' : 'text-white'}`}>
              {track.title}
              {isLocked && <span className="ml-1.5 text-[10px] font-medium text-blue-400/80 bg-blue-500/15 px-1.5 py-0.5 rounded-full align-middle">Subscribe to Unlock</span>}
            </p>
            {track.explicit && (
              <span className="shrink-0 text-[9px] font-bold bg-white/15 text-white/50 w-4 h-4 rounded flex items-center justify-center leading-none">E</span>
            )}
          </div>
          <p className="text-white/40 text-xs truncate mt-0.5">
            {track.artist}
            {track.album && <span className="text-white/20"> &middot; {track.album}</span>}
          </p>
        </div>

        {/* Source Badge */}
        {spotify && (
          <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md shrink-0 ${
            hasPreview
              ? 'text-green-300 bg-green-500/15'
              : 'text-white/25 bg-white/5'
          }`}>
            {hasPreview && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            {hasPreview ? '30s' : 'No audio'}
          </span>
        )}
        {!spotify && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/15 px-2 py-1 rounded-md shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Full
          </span>
        )}

        {/* Duration */}
        <span className="text-white/25 text-xs tabular-nums hidden sm:block w-10 text-right shrink-0">
          {track.durationFormatted || track.duration}
        </span>

        {/* Add to Playlist */}
        <button
          onClick={onAddToPlaylist}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
            addedFeedback
              ? 'bg-green-500 text-white scale-110'
              : 'bg-white/[0.06] text-white/30 hover:bg-white/15 hover:text-white'
          }`}
          title="Add to playlist"
        >
          {addedFeedback ? <Check size={14} /> : <Plus size={14} />}
        </button>

        {/* External Link */}
        {spotify && track.spotifyUrl && (
          <a
            href={track.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/20 hover:text-green-400 hover:bg-green-500/10 transition shrink-0"
            title="Open in Spotify"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Playlist Picker Dropdown */}
      {showPlaylistPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClosePlaylistPicker} />
          <div className="absolute right-12 top-0 w-60 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-xl z-50 shadow-2xl shadow-black/60 overflow-hidden animate-fade-in border border-white/10">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-white/50 text-xs font-medium">Add to playlist</p>
            </div>
            <div className="max-h-48 overflow-y-auto p-1.5">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.08] transition text-left"
                >
                  <ListPlus size={14} className="text-white/30 shrink-0" />
                  <span className="text-white text-sm truncate">{pl.name}</span>
                  <span className="text-white/15 text-xs ml-auto shrink-0">{pl.tracks.length}</span>
                </button>
              ))}
            </div>
            <div className="p-1.5 border-t border-white/[0.06]">
              <button
                onClick={onCreatePlaylist}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition text-blue-400 text-sm font-medium"
              >
                <Plus size={14} />
                New Playlist
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
