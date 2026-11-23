/**
 * MYSTATION - Catalog Search
 * Search the MyStation catalog — Mike Page + IDMG roster.
 * Build playlists from any track in the catalog.
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Play,
  Pause,
  Plus,
  Music,
  Loader2,
  X,
  ListPlus,
  Check,
  Sparkles,
  Lock,
  Clock,
  TrendingUp,
  Library,
  ChevronRight,
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import usePlaylistStore from "@/store/playlistStore";
import { tracks as myStationTracks } from "@/data/tracks";
import Link from "next/link";
import Image from "next/image";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="text-blue-400 animate-spin" />
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ mystation: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingTo, setAddingTo] = useState(null); // trackId being added
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } =
    usePlayerStore();
  const { playlists, createPlaylist, addTrack } = usePlaylistStore();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("mystation-recent-searches") || "[]",
      );
      setRecentSearches(saved);
    } catch {}
  }, []);

  // Popular tracks — top 6 by hitScore
  const popularTracks = useMemo(() => {
    return [...myStationTracks]
      .filter((t) => !t.isVault && !t.comingSoon && t.hitScore)
      .sort((a, b) => (b.hitScore || 0) - (a.hitScore || 0))
      .slice(0, 6);
  }, []);

  // Search MyStation catalog locally
  const searchMyStation = useCallback((q) => {
    const lower = q.toLowerCase();
    return myStationTracks
      .filter((t) => !t.isVault && !t.comingSoon)
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          (t.featured && t.featured.toLowerCase().includes(lower)) ||
          (t.producer && t.producer.toLowerCase().includes(lower)) ||
          (t.album && t.album.toLowerCase().includes(lower)) ||
          "mike page".includes(lower),
      )
      .slice(0, 10)
      .map((t) => ({
        ...t,
        artist: t.featured ? `Mike Page ft. ${t.featured}` : "Mike Page",
        source: "mystation",
      }));
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    (q) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!q.trim()) {
        setResults({ mystation: [] });
        setSearched(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        setSearched(true);
        // Nov 21 2026: MyStation-only search per Mike's directive.
        // External music catalogs removed — fans only find Mike Page +
        // IDMG roster tracks here.
        const local = searchMyStation(q);
        setResults({ mystation: local });
        // Save to recent searches if results found
        if (local.length > 0) {
          try {
            const saved = JSON.parse(
              localStorage.getItem("mystation-recent-searches") || "[]",
            );
            const updated = [q, ...saved.filter((s) => s !== q)].slice(0, 5);
            localStorage.setItem(
              "mystation-recent-searches",
              JSON.stringify(updated),
            );
            setRecentSearches(updated);
          } catch {}
        }
        setLoading(false);
      }, 300);
    },
    [searchMyStation],
  );

  useEffect(() => {
    handleSearch(query);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, handleSearch]);

  // Play a MyStation track
  const playMyStation = (track) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  // Add track to playlist
  const handleAddToPlaylist = (playlistId, track) => {
    const formatted = {
      id: track.id,
      title: track.title,
      artist:
        track.artist ||
        (track.featured ? `Mike Page ft. ${track.featured}` : "Mike Page"),
      album: track.album,
      albumArt: track.albumArt || "/images/albums/cindys-son.jpg",
      audioSrc: track.audioFile,
      duration: track.duration,
      source: "mystation",
    };

    addTrack(playlistId, formatted);
    setShowPlaylistPicker(null);
    setAddedFeedback(track.id);
    setTimeout(() => setAddedFeedback(null), 1500);
  };

  // Quick create playlist
  const handleCreateAndAdd = (track) => {
    if (!newPlaylistName.trim()) return;
    const id = createPlaylist(newPlaylistName.trim());
    handleAddToPlaylist(id, track);
    setNewPlaylistName("");
    setShowCreatePlaylist(false);
  };

  const isTrackPlaying = (track) => {
    return currentTrack?.id === track.id && isPlaying;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-mystation-darker to-mystation-black" />
      <div className="bg-orb w-[500px] h-[500px] bg-indigo-500 top-[-200px] right-[-100px]" />
      <div
        className="bg-orb w-[400px] h-[400px] bg-purple-600 bottom-[20%] left-[-150px]"
        style={{ animationDelay: "-3s" }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-48">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
            Search{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Music
            </span>
          </h1>
          <p className="text-white/40 text-sm">
            Mike Page + IDMG roster. Build your perfect playlist.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
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
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
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
          <div className="py-8 pb-24">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-white/30" />
                  <p className="text-white/40 text-xs uppercase tracking-wider font-medium">
                    Recent Searches
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-full text-white/60 hover:text-white text-sm transition-all"
                    >
                      <Clock size={12} className="text-white/25" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Tracks */}
            {popularTracks.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-blue-400/60" />
                  <p className="text-white/40 text-xs uppercase tracking-wider font-medium">
                    Popular Tracks
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {popularTracks.map((track) => {
                    const trackIsPlaying =
                      currentTrack?.id === track.id && isPlaying;
                    return (
                      <button
                        key={track.id}
                        onClick={() => {
                          const playable = myStationTracks.filter(
                            (t) => !t.isVault && !t.comingSoon,
                          );
                          const idx = playable.findIndex(
                            (t) => t.id === track.id,
                          );
                          setQueue(playable, idx >= 0 ? idx : 0);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                          trackIsPlaying
                            ? "bg-blue-500/15 border border-blue-500/30"
                            : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06]"
                        }`}
                      >
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-indigo-600/60 to-purple-800/80">
                          {track.albumArt ? (
                            <img
                              src={track.albumArt}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                            {trackIsPlaying ? (
                              <Pause
                                size={14}
                                className="text-white"
                                fill="white"
                              />
                            ) : (
                              <Play
                                size={14}
                                className="text-white ml-0.5"
                                fill="white"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${trackIsPlaying ? "text-blue-400" : "text-white"}`}
                          >
                            {track.title}
                          </p>
                          <p className="text-white/35 text-xs truncate">
                            Mike Page
                            {track.featured ? ` ft. ${track.featured}` : ""}
                          </p>
                        </div>
                        {trackIsPlaying && (
                          <div className="flex gap-0.5 shrink-0">
                            <span className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" />
                            <span
                              className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="w-1 h-2 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Library size={14} className="text-purple-400/60" />
                <p className="text-white/40 text-xs uppercase tracking-wider font-medium">
                  Quick Links
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/music"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-300 text-sm font-medium transition-all"
                >
                  <Music size={14} />
                  Browse Albums
                  <ChevronRight size={14} className="text-blue-400/40" />
                </Link>
                <button
                  onClick={() => setQuery("Mike Page")}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-purple-300 text-sm font-medium transition-all"
                >
                  <TrendingUp size={14} />
                  Trending
                  <ChevronRight size={14} className="text-purple-400/40" />
                </button>
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm font-medium transition-all"
                >
                  <Sparkles size={14} />
                  Mood Playlists
                  <ChevronRight size={14} className="text-indigo-400/40" />
                </Link>
              </div>
            </div>

            {/* Original Trending Searches */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <Search size={36} className="text-white/20" />
              </div>
              <p className="text-white/30 text-lg mb-1">
                Search Mike Page, IDMG roster, and more
              </p>
              <p className="text-white/20 text-sm mb-8">
                The full MyStation catalog, one search away
              </p>
              <div className="max-w-lg mx-auto">
                <p className="text-white/20 text-xs uppercase tracking-wider mb-3">
                  Trending
                </p>
                <div className="flex flex-wrap justify-center gap-2 pb-8">
                  {[
                    "Mike Page",
                    "Drake",
                    "Kendrick Lamar",
                    "Future",
                    "The Weeknd",
                    "Tyler, The Creator",
                    "SZA",
                    "Metro Boomin",
                  ].map((artist) => (
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
          </div>
        )}

        {searched && !loading && results.mystation.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-white/20 text-sm mt-2 mb-6">
              Try a different search
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Mike Page", "Drake", "Kendrick Lamar", "Future"].map(
                (artist) => (
                  <button
                    key={artist}
                    onClick={() => setQuery(artist)}
                    className="trending-chip"
                  >
                    {artist}
                  </button>
                ),
              )}
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
              <h2 className="text-base font-bold text-white tracking-wide uppercase">
                MyStation
              </h2>
              <span className="text-[10px] text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-md font-medium">
                Full Tracks
              </span>
            </div>
            <div className="space-y-2">
              {results.mystation.map((track) => (
                <TrackRow
                  key={`ms-${track.id}`}
                  track={track}
                  isPlaying={isTrackPlaying(track)}
                  isLocked={false}
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
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreatePlaylist(false)}
        >
          <div
            className="glass rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Create Playlist
            </h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleCreateAndAdd(showPlaylistPicker)
              }
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
                    setNewPlaylistName("");
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
}) {
  const hasPreview = true;

  return (
    <div className={`relative group ${isLocked ? "opacity-40" : ""}`}>
      <div
        className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${
          isPlaying
            ? "bg-blue-500/15 border border-blue-500/30 shadow-lg shadow-blue-500/5"
            : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12]"
        }`}
      >
        {/* Album Art / Play Button */}
        <button
          onClick={onPlay}
          disabled={!hasPreview}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 group/play shadow-md ${!hasPreview ? "opacity-50" : ""}`}
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
          <div
            className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-200 ${
              isLocked
                ? "opacity-100"
                : isPlaying
                  ? "opacity-100"
                  : "opacity-0 group-hover/play:opacity-100"
            }`}
          >
            {isLocked ? (
              <Lock size={16} className="text-white/70" />
            ) : isPlaying ? (
              <Pause
                size={20}
                className="text-white drop-shadow-lg"
                fill="white"
              />
            ) : (
              <Play
                size={20}
                className="text-white ml-0.5 drop-shadow-lg"
                fill="white"
              />
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
            <p
              className={`font-semibold text-sm truncate ${isPlaying ? "text-blue-400" : "text-white"}`}
            >
              {track.title}
              {isLocked && (
                <span className="ml-1.5 text-[10px] font-medium text-blue-400/80 bg-blue-500/15 px-1.5 py-0.5 rounded-full align-middle">
                  Subscribe to Unlock
                </span>
              )}
            </p>
            {track.explicit && (
              <span className="shrink-0 text-[9px] font-bold bg-white/15 text-white/50 w-4 h-4 rounded flex items-center justify-center leading-none">
                E
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs truncate mt-0.5">
            {track.artist}
            {track.album && (
              <span className="text-white/20"> &middot; {track.album}</span>
            )}
          </p>
        </div>

        {/* Source Badge */}
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/15 px-2 py-1 rounded-md shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Full
        </span>

        {/* Duration */}
        <span className="text-white/25 text-xs tabular-nums hidden sm:block w-10 text-right shrink-0">
          {track.durationFormatted || track.duration}
        </span>

        {/* Add to Playlist */}
        <button
          onClick={onAddToPlaylist}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
            addedFeedback
              ? "bg-green-500 text-white scale-110"
              : "bg-white/[0.06] text-white/30 hover:bg-white/15 hover:text-white"
          }`}
          title="Add to playlist"
        >
          {addedFeedback ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Playlist Picker Dropdown */}
      {showPlaylistPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClosePlaylistPicker} />
          <div className="absolute right-12 top-0 w-60 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-xl z-50 shadow-2xl shadow-black/60 overflow-hidden animate-fade-in border border-white/10">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-white/50 text-xs font-medium">
                Add to playlist
              </p>
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
                  <span className="text-white/15 text-xs ml-auto shrink-0">
                    {pl.tracks.length}
                  </span>
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
