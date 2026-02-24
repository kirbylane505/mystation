/**
 * MYSTATION - Add to Playlist Button
 * Reusable component — works on any page with any track format
 * Portal-based dropdown to escape parent CSS transforms
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Check, ListPlus, Music } from 'lucide-react';
import usePlaylistStore from '@/store/playlistStore';

export default function AddToPlaylist({ track, size = 16 }) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const inputRef = useRef(null);

  const playlists = usePlaylistStore(s => s.playlists);
  const addTrack = usePlaylistStore(s => s.addTrack);
  const createPlaylist = usePlaylistStore(s => s.createPlaylist);

  // Normalize track data for playlist store
  const normalizeTrack = useCallback((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist || 'Mike Page',
    album: t.album || '',
    albumArt: t.coverArt || t.albumArt || null,
    audioSrc: t.audioSrc || t.src || null,
    duration: t.duration || '',
    source: 'mystation',
  }), []);

  // Position dropdown relative to button
  const openPicker = (e) => {
    e.stopPropagation();
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Position to the left of the button, aligned to top
    setPos({
      top: rect.top,
      left: Math.max(8, rect.left - 240),
    });
    setOpen(true);
    setCreating(false);
    setNewName('');
  };

  // Add track to existing playlist
  const handleSelect = (playlistId) => {
    addTrack(playlistId, normalizeTrack(track));
    setOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Create new playlist and add track
  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = createPlaylist(newName.trim());
    addTrack(id, normalizeTrack(track));
    setOpen(false);
    setCreating(false);
    setNewName('');
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  // Focus input when creating
  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPicker}
        className={`p-1.5 rounded-full transition ${
          added
            ? 'text-green-400 bg-green-500/20'
            : 'text-white/40 hover:text-blue-400 hover:bg-blue-500/10'
        }`}
        title="Add to playlist"
      >
        {added ? <Check size={size} /> : <Plus size={size} />}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[10000]" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            className="fixed z-[10001] w-60 bg-[#0d1117]/95 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/60 border border-white/10 overflow-hidden animate-fade-in"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-white/50 text-xs font-medium">Add to playlist</p>
            </div>

            {playlists.length > 0 ? (
              <div className="max-h-48 overflow-y-auto p-1.5">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => handleSelect(pl.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/[0.08] transition text-left"
                  >
                    <ListPlus size={14} className="text-white/30 shrink-0" />
                    <span className="text-white text-sm truncate">{pl.name}</span>
                    <span className="text-white/15 text-xs ml-auto shrink-0">{pl.tracks.length}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center">
                <Music size={20} className="text-white/20 mx-auto mb-1" />
                <p className="text-white/30 text-xs">No playlists yet</p>
              </div>
            )}

            <div className="p-1.5 border-t border-white/[0.06]">
              {creating ? (
                <div className="flex items-center gap-2 px-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                    placeholder="Playlist name..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white transition"
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition text-blue-400 text-sm font-medium"
                >
                  <Plus size={14} />
                  New Playlist
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
