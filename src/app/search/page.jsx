/**
 * MYSTATION - Global Search
 * Search MyStation catalog + Spotify's 100M+ songs
 * Create playlists with any music in the world
 */

'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Play, Pause, Plus, Music, Disc3, Loader2, X, ListPlus, Check, ExternalLink, Sparkles } from 'lucide-react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
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

  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay, getTrialRemaining } = usePlayerStore();
  const { playlists, createPlaylist, addTrack } = usePlaylistStore();
  const { supporterTier } = useUserStore();

  // Spotify access: Premium ($9.99) or Diamond ($14.99), OR within 24-hour free trial
  const hasSpotifyAccess = supporterTier === 'premium' || supporterTier === 'diamond' || getTrialRemaining() > 0;

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

  // Search Spotify via our API (with retry on failure)
  const searchSpotify = useCallback(async (q) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}&type=track,artist&limit=20`, { cache: 'no-store' });
        if (!res.ok) {
          if (attempt === 0) continue; // retry once
          return { tracks: [], artists: [] };
        }
        const data = await res.json();
        return data;
      } catch {
        if (attempt === 0) continue;
        return { tracks: [], artists: [] };
      }
    }
    return { tracks: [], artists: [] };
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
        let spotifyTracks = [];
        if (hasSpotifyAccess) {
          const spotify = await searchSpotify(q);
          spotifyTracks = spotify.tracks || [];
        }
        setResults({ mystation: local, spotify: spotifyTracks });
        setLoading(false);
      }, 300);
    },
    [searchMyStation, searchSpotify, hasSpotifyAccess]
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

  // Play a Spotify preview
  const playSpotifyPreview = (track) => {
    if (!track.previewUrl) return;
    const spotifyTrack = {
      id: `spotify_${track.spotifyId}`,
      title: track.title,
      artist: track.artist,
      album: track.album,
      audioFile: track.previewUrl,
      albumArt: track.albumArt,
      duration: track.durationFormatted,
      source: 'spotify',
      spotifyUrl: track.spotifyUrl,
      isPreview: true,
    };
    if (currentTrack?.id === spotifyTrack.id) {
      togglePlay();
    } else {
      setTrack(spotifyTrack);
    }
  };

  // Add track to playlist
  const handleAddToPlaylist = (playlistId, track) => {
    const formatted = track.source === 'spotify'
      ? {
          spotifyId: track.spotifyId,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          previewUrl: track.previewUrl,
          spotifyUrl: track.spotifyUrl,
          duration: track.durationFormatted || track.duration,
          source: 'spotify',
        }
      : {
          id: track.id,
          title: track.title,
          artist: track.artist || (track.featured ? `Mike Page ft. ${track.featured}` : 'Mike Page'),
          album: track.album,
          albumArt: null,
          audioSrc: track.audioFile,
          duration: track.duration,
          source: 'mystation',
        };

    addTrack(playlistId, formatted);
    setShowPlaylistPicker(null);
    setAddedFeedback(track.spotifyId || track.id);
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
    if (track.source === 'spotify') {
      return currentTrack?.id === `spotify_${track.spotifyId}` && isPlaying;
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
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Search <span className="text-blue-400">Music</span>
          </h1>
          <p className="text-white/50 text-sm">Find any song in the world. Build your perfect playlist.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Kendrick Lamar, Drake, Mike Page..."
              className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 text-lg focus:outline-none focus:border-blue-500 focus:bg-white/15 transition"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition"
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
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <Search size={36} className="text-white/20" />
            </div>
            <p className="text-white/30 text-lg mb-1">Search for Kendrick Lamar, Drake, Mike Page</p>
            <p className="text-white/20 text-sm mb-8">100 million+ songs from every artist in the world</p>

            {/* Trending Searches */}
            <div className="max-w-lg mx-auto">
              <p className="text-white/20 text-xs uppercase tracking-wider mb-3">Trending</p>
              <div className="flex flex-wrap justify-center gap-2">
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
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                <Music size={14} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">MyStation</h2>
              <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">Full Play</span>
            </div>
            <div className="space-y-2">
              {results.mystation.map((track) => (
                <TrackRow
                  key={`ms-${track.id}`}
                  track={track}
                  isPlaying={isTrackPlaying(track)}
                  onPlay={() => playMyStation(track)}
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

        {/* Spotify Results */}
        {results.spotify.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <h2 className="text-lg font-bold text-white">Spotify</h2>
              <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">100M+ Songs</span>
            </div>
            <div className="space-y-2">
              {results.spotify.map((track) => (
                <TrackRow
                  key={`sp-${track.spotifyId}`}
                  track={track}
                  isPlaying={isTrackPlaying(track)}
                  onPlay={() => playSpotifyPreview(track)}
                  onAddToPlaylist={() => setShowPlaylistPicker(track.spotifyId)}
                  showPlaylistPicker={showPlaylistPicker === track.spotifyId}
                  playlists={playlists}
                  onSelectPlaylist={(plId) => handleAddToPlaylist(plId, track)}
                  onClosePlaylistPicker={() => setShowPlaylistPicker(null)}
                  onCreatePlaylist={() => setShowCreatePlaylist(true)}
                  addedFeedback={addedFeedback === track.spotifyId}
                  spotify
                />
              ))}
            </div>
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
                window.location.href = 'https://buy.stripe.com/4gM9AU5uq8VWg1t7ZU73G09';
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
    <div className="relative group">
      <div className={`flex items-center gap-3 p-3 rounded-xl transition ${isPlaying ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
        {/* Album Art / Play Button */}
        <button
          onClick={onPlay}
          disabled={!hasPreview}
          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 group/play"
        >
          {track.albumArt ? (
            <Image src={track.albumArt} alt={track.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600/40 to-purple-900/60 flex items-center justify-center">
              <Music size={18} className="text-blue-400/60" />
            </div>
          )}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'}`}>
            {isPlaying ? (
              <Pause size={18} className="text-white" fill="white" />
            ) : hasPreview ? (
              <Play size={18} className="text-white ml-0.5" fill="white" />
            ) : (
              <ExternalLink size={14} className="text-white/60" />
            )}
          </div>
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${isPlaying ? 'text-blue-400' : 'text-white'}`}>
            {track.title}
            {track.explicit && <span className="ml-1 text-[10px] bg-white/20 text-white/60 px-1 rounded">E</span>}
          </p>
          <p className="text-white/50 text-xs truncate">{track.artist}</p>
        </div>

        {/* Duration */}
        <span className="text-white/30 text-xs hidden sm:block">
          {track.durationFormatted || track.duration}
        </span>

        {/* Source Badge */}
        {spotify && (
          <span className="text-[10px] text-green-400/60 hidden sm:block">
            {hasPreview ? '30s preview' : 'Spotify only'}
          </span>
        )}
        {!spotify && (
          <span className="text-[10px] text-blue-400/60 hidden sm:block">Full track</span>
        )}

        {/* Add to Playlist */}
        <button
          onClick={onAddToPlaylist}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
            addedFeedback
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/40 hover:bg-white/20 hover:text-white'
          }`}
          title="Add to playlist"
        >
          {addedFeedback ? <Check size={16} /> : <Plus size={16} />}
        </button>

        {/* Spotify Link */}
        {spotify && track.spotifyUrl && (
          <a
            href={track.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-green-400 hover:bg-green-500/10 transition shrink-0"
            title="Open in Spotify"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Playlist Picker Dropdown */}
      {showPlaylistPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClosePlaylistPicker} />
          <div className="absolute right-12 top-0 w-56 glass rounded-xl z-50 shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-2 border-b border-white/10">
              <p className="text-white/60 text-xs px-2 py-1">Add to playlist</p>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-left"
                >
                  <ListPlus size={14} className="text-white/40 shrink-0" />
                  <span className="text-white text-sm truncate">{pl.name}</span>
                  <span className="text-white/20 text-xs ml-auto shrink-0">{pl.tracks.length}</span>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-white/10">
              <button
                onClick={onCreatePlaylist}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition text-blue-400 text-sm font-medium"
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
