/**
 * MYSTATION - Playlists Page
 * View, manage, and play custom playlists
 */

'use client';

import { useState } from 'react';
import { Play, Pause, Trash2, Music, Plus, ListPlus, Search, Clock, Disc3, X, Edit3, Check, GripVertical, Shuffle } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import usePlaylistStore from '@/store/playlistStore';
import Link from 'next/link';

export default function PlaylistsPage() {
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist, removeTrack } = usePlaylistStore();
  const { currentTrack, isPlaying, setTrack, setQueue, togglePlay } = usePlayerStore();
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openPlaylist = playlists.find((p) => p.id === activePlaylist);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName.trim());
    setNewName('');
    setCreating(false);
    setActivePlaylist(id);
  };

  const handleRename = (id) => {
    if (editName.trim()) {
      renamePlaylist(id, editName.trim());
    }
    setEditingId(null);
  };

  const DEFAULT_MP_ART = '/images/albums/cindys-son.jpg';

  const getTrackArt = (t) => {
    if (t.albumArt) return t.albumArt;
    if (t.source === 'mystation') return DEFAULT_MP_ART;
    return null;
  };

  const getTrackId = (t) => {
    if (t.spotifyId) return `spotify_${t.spotifyId}`;
    if (t.deezerId) return `deezer_${t.deezerId}`;
    return t.id;
  };

  const playPlaylist = (playlist, startIndex = 0, shuffle = false) => {
    let playable = playlist.tracks
      .filter((t) => t.source === 'mystation' || t.previewUrl)
      .map((t) => ({
        id: getTrackId(t),
        title: t.title,
        artist: t.artist,
        album: t.album,
        audioFile: t.source === 'mystation' ? t.audioSrc : t.previewUrl,
        albumArt: getTrackArt(t),
        duration: t.duration,
        source: t.source,
        isPreview: t.source !== 'mystation',
      }));
    if (playable.length === 0) return;
    if (shuffle) {
      for (let i = playable.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playable[i], playable[j]] = [playable[j], playable[i]];
      }
    }
    setQueue(playable, shuffle ? 0 : Math.min(startIndex, playable.length - 1));
  };

  const playTrack = (track) => {
    const id = getTrackId(track);
    if (currentTrack?.id === id) {
      togglePlay();
    } else {
      setTrack({
        id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        audioFile: track.source === 'mystation' ? track.audioSrc : track.previewUrl,
        albumArt: getTrackArt(track),
        duration: track.duration,
        source: track.source,
        isPreview: track.source !== 'mystation',
      });
    }
  };

  const isTrackPlaying = (track) => {
    const id = getTrackId(track);
    return currentTrack?.id === id && isPlaying;
  };

  // Playlist list view
  if (!activePlaylist) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-mystation-darker to-mystation-black" />
        <div className="bg-orb w-[500px] h-[500px] bg-purple-500 top-[-200px] left-[-100px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-48">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black text-white">My Playlists</h1>
              <p className="text-white/50 text-sm mt-1">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/search"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition text-sm font-medium"
              >
                <Search size={16} />
                Search Music
              </Link>
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-medium hover:opacity-90 transition text-sm"
              >
                <Plus size={16} />
                New Playlist
              </button>
            </div>
          </div>

          {/* Create Playlist Inline */}
          {creating && (
            <div className="mb-6 flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Playlist name..."
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button onClick={handleCreate} disabled={!newName.trim()} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-40">Create</button>
              <button onClick={() => { setCreating(false); setNewName(''); }} className="px-4 py-3 bg-white/10 text-white/60 rounded-xl">Cancel</button>
            </div>
          )}

          {playlists.length === 0 && !creating ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                <ListPlus size={40} className="text-white/20" />
              </div>
              <p className="text-white/40 text-lg mb-2">No playlists yet</p>
              <p className="text-white/20 text-sm mb-6">Search for music and create your first playlist</p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-bold hover:opacity-90 transition"
              >
                <Search size={18} />
                Search Music
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl overflow-hidden transition cursor-pointer"
                >
                  {/* Cover Art Grid */}
                  <div
                    onClick={() => setActivePlaylist(pl.id)}
                    className="relative aspect-square bg-gradient-to-br from-purple-600/30 to-blue-600/30"
                  >
                    {pl.tracks.length > 0 ? (
                      <div className="grid grid-cols-2 w-full h-full">
                        {pl.tracks.slice(0, 4).map((t, i) => {
                          const art = getTrackArt(t);
                          return (
                            <div key={i} className="relative overflow-hidden">
                              {art ? (
                                <>
                                  <img
                                    src={art}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 items-center justify-center" style={{ display: 'none' }}>
                                    <Music size={24} className="text-white/10" />
                                  </div>
                                </>
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                                  <Music size={24} className="text-white/10" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {pl.tracks.length < 4 &&
                          Array.from({ length: 4 - pl.tracks.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center">
                              <Music size={24} className="text-white/10" />
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={48} className="text-white/10" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <button
                      onClick={(e) => { e.stopPropagation(); playPlaylist(pl); }}
                      className="absolute bottom-3 right-3 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                    >
                      <Play size={20} className="text-white ml-0.5" fill="white" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4" onClick={() => setActivePlaylist(pl.id)}>
                    {editingId === pl.id ? (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(pl.id)}
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleRename(pl.id)} className="text-green-400"><Check size={16} /></button>
                      </div>
                    ) : (
                      <h3 className="font-bold text-white truncate">{pl.name}</h3>
                    )}
                    <p className="text-white/40 text-sm mt-1">{pl.tracks.length} track{pl.tracks.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single playlist detail view
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-mystation-darker to-mystation-black" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-48">
        {/* Back + Header */}
        <button
          onClick={() => setActivePlaylist(null)}
          className="text-white/50 hover:text-white text-sm mb-6 flex items-center gap-1 transition"
        >
          &larr; Back to Playlists
        </button>

        <div className="flex items-start gap-6 mb-8">
          {/* Cover */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30">
            {(openPlaylist.coverArt || (openPlaylist.tracks.length > 0 && getTrackArt(openPlaylist.tracks[0]))) ? (
              <div className="relative w-full h-full">
                <img src={openPlaylist.coverArt || getTrackArt(openPlaylist.tracks[0])} alt={openPlaylist.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={48} className="text-white/20" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Playlist</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 truncate">{openPlaylist.name}</h1>
            <p className="text-white/50 text-sm">{openPlaylist.tracks.length} tracks</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => playPlaylist(openPlaylist)}
                disabled={openPlaylist.tracks.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-full hover:opacity-90 transition disabled:opacity-40"
              >
                <Play size={18} fill="white" />
                Play All
              </button>
              <button
                onClick={() => playPlaylist(openPlaylist, 0, true)}
                disabled={openPlaylist.tracks.length === 0}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white/70 hover:text-white rounded-full hover:bg-white/20 transition text-sm font-medium disabled:opacity-40"
              >
                <Shuffle size={16} />
                Shuffle
              </button>
              <Link
                href="/search"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 text-white/70 rounded-full hover:bg-white/20 transition text-sm font-medium"
              >
                <Plus size={16} />
                Add Songs
              </Link>
              <button
                onClick={() => { setEditingId(openPlaylist.id); setEditName(openPlaylist.name); }}
                className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => setConfirmDelete(openPlaylist.id)}
                className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Rename inline */}
        {editingId === openPlaylist?.id && (
          <div className="mb-6 flex gap-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename(openPlaylist.id)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button onClick={() => handleRename(openPlaylist.id)} className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold">Save</button>
            <button onClick={() => setEditingId(null)} className="px-4 py-3 bg-white/10 text-white/60 rounded-xl">Cancel</button>
          </div>
        )}

        {/* Track List */}
        {openPlaylist.tracks.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Music size={40} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/30 mb-4">This playlist is empty</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:opacity-90 transition text-sm"
            >
              <Search size={16} />
              Search & Add Music
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {openPlaylist.tracks.map((track, idx) => {
              const playing = isTrackPlaying(track);
              const hasAudio = track.source === 'mystation' || track.previewUrl;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl transition group ${playing ? 'bg-blue-500/15 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                >
                  {/* Number */}
                  <span className="w-6 text-center text-white/30 text-sm">{idx + 1}</span>

                  {/* Art + Play */}
                  <button
                    onClick={() => hasAudio && playTrack(track)}
                    disabled={!hasAudio}
                    className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0"
                  >
                    {getTrackArt(track) ? (
                      <img src={getTrackArt(track)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-br from-blue-600/40 to-purple-900/60 flex items-center justify-center ${getTrackArt(track) ? 'hidden' : ''}`}>
                      <Music size={14} className="text-blue-400/60" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      {playing ? <Pause size={14} className="text-white" fill="white" /> : <Play size={14} className="text-white ml-0.5" fill="white" />}
                    </div>
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${playing ? 'text-blue-400' : 'text-white'}`}>{track.title}</p>
                    <p className="text-white/50 text-xs truncate">{track.artist}</p>
                  </div>

                  {/* Source */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    track.source === 'spotify' ? 'text-green-400/60 bg-green-500/10' :
                    track.source === 'spotify' ? 'text-green-400/60 bg-green-500/10' :
                    'text-blue-400/60 bg-blue-500/10'
                  }`}>
                    {track.source === 'mystation' ? 'Full' : '30s Preview'}
                  </span>

                  {/* Duration */}
                  <span className="text-white/30 text-xs w-12 text-right">{track.duration}</span>

                  {/* Remove */}
                  <button
                    onClick={() => removeTrack(openPlaylist.id, idx)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="glass rounded-2xl max-w-sm w-full p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-xl font-bold text-white mb-2">Delete Playlist?</h3>
            <p className="text-white/50 text-sm mb-6">This can't be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-white/10 text-white/60 rounded-xl font-medium">Cancel</button>
              <button
                onClick={() => { deletePlaylist(confirmDelete); setConfirmDelete(null); setActivePlaylist(null); }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
