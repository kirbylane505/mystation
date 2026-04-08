'use client';

import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '@/store/playerStore';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  { value: 'followers', label: 'Followers Only', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  { value: 'subscribers', label: 'Subscribers Only', color: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30' },
];

function VisibilityBadge({ visibility }) {
  const opt = VISIBILITY_OPTIONS.find((o) => o.value === visibility) || VISIBILITY_OPTIONS[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export default function DashboardGallery() {
  const user = useUserStore((s) => s.user);
  const email = user?.email;

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);

  // Create album form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumVisibility, setNewAlbumVisibility] = useState('public');
  const [creating, setCreating] = useState(false);

  // Inline rename
  const [renamingAlbumId, setRenamingAlbumId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Upload
  const [uploadingAlbumId, setUploadingAlbumId] = useState(null);
  const fileInputRef = useRef(null);

  // Confirm delete
  const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);

  useEffect(() => {
    if (!email) return;
    fetch(`/api/creators/gallery?slug=&viewerEmail=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => setAlbums(data.albums || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email]);

  const handleCreateAlbum = async () => {
    if (!email || !newAlbumName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/creators/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: newAlbumName.trim(), visibility: newAlbumVisibility }),
      });
      const data = await res.json();
      if (data.album) {
        setAlbums((prev) => [...prev, { ...data.album, items: [] }]);
      }
      setNewAlbumName('');
      setNewAlbumVisibility('public');
      setShowCreateForm(false);
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const handleRenameAlbum = async (albumId) => {
    if (!email || !renameValue.trim()) {
      setRenamingAlbumId(null);
      return;
    }
    try {
      await fetch('/api/creators/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, albumId, name: renameValue.trim() }),
      });
      setAlbums((prev) =>
        prev.map((a) => (a.id === albumId ? { ...a, name: renameValue.trim() } : a))
      );
    } catch {
      // silent
    }
    setRenamingAlbumId(null);
  };

  const handleChangeVisibility = async (albumId, visibility) => {
    if (!email) return;
    try {
      await fetch('/api/creators/gallery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, albumId, visibility }),
      });
      setAlbums((prev) =>
        prev.map((a) => (a.id === albumId ? { ...a, visibility } : a))
      );
    } catch {
      // silent
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!email) return;
    try {
      await fetch(`/api/creators/gallery?email=${encodeURIComponent(email)}&albumId=${albumId}`, {
        method: 'DELETE',
      });
      setAlbums((prev) => prev.filter((a) => a.id !== albumId));
      if (expandedAlbumId === albumId) setExpandedAlbumId(null);
    } catch {
      // silent
    }
    setConfirmDeleteAlbum(null);
  };

  const handleUploadClick = (albumId) => {
    setUploadingAlbumId(albumId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !email || !uploadingAlbumId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);
    formData.append('albumId', uploadingAlbumId);
    const type = file.type.startsWith('video/') ? 'video' : 'photo';
    formData.append('type', type);

    try {
      const res = await fetch('/api/creators/gallery/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.item) {
        setAlbums((prev) =>
          prev.map((a) => {
            if (a.id === uploadingAlbumId) {
              return { ...a, items: [...(a.items || []), data.item] };
            }
            return a;
          })
        );
      }
    } catch {
      // silent
    }
    e.target.value = '';
    setUploadingAlbumId(null);
  };

  const handleDeleteItem = async (itemId, albumId) => {
    if (!email) return;
    try {
      await fetch(`/api/creators/gallery/upload?email=${encodeURIComponent(email)}&itemId=${itemId}`, {
        method: 'DELETE',
      });
      setAlbums((prev) =>
        prev.map((a) => {
          if (a.id === albumId) {
            return { ...a, items: (a.items || []).filter((i) => i.id !== itemId) };
          }
          return a;
        })
      );
    } catch {
      // silent
    }
    setConfirmDeleteItem(null);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">My Life</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-[#27272a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#27272a] rounded w-1/3" />
                  <div className="h-3 bg-[#27272a] rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Life</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-bold hover:bg-[#b8962e] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Album
        </button>
      </div>

      {/* Create album form */}
      {showCreateForm && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Album name"
              className="flex-1 px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white text-sm placeholder-[#52525b] focus:outline-none focus:border-[#D4AF37]"
              autoFocus
            />
            <select
              value={newAlbumVisibility}
              onChange={(e) => setNewAlbumVisibility(e.target.value)}
              className="px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleCreateAlbum}
                disabled={creating || !newAlbumName.trim()}
                className="px-5 py-2 bg-[#D4AF37] text-black rounded-lg text-sm font-bold hover:bg-[#b8962e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAlbumName('');
                }}
                className="px-4 py-2 text-sm text-[#71717a] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Empty state */}
      {albums.length === 0 && !showCreateForm && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-[#27272a] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[#71717a] text-lg">No albums yet.</p>
          <p className="text-[#52525b] text-sm mt-1">Share your life with your followers and subscribers!</p>
        </div>
      )}

      {/* Album list */}
      <div className="space-y-4">
        {albums.map((album) => {
          const isExpanded = expandedAlbumId === album.id;
          const itemCount = album.items?.length || 0;

          return (
            <div
              key={album.id}
              className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-colors"
            >
              {/* Album header */}
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedAlbumId(isExpanded ? null : album.id)}
              >
                {/* Cover thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-[#27272a] flex-shrink-0 overflow-hidden">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4AF37]/30 to-purple-600/20">
                      <span className="text-[#D4AF37] text-xl font-bold">
                        {album.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {renamingAlbumId === album.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameAlbum(album.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameAlbum(album.id);
                        if (e.key === 'Escape') setRenamingAlbumId(null);
                      }}
                      className="bg-[#09090b] border border-[#D4AF37] rounded px-2 py-1 text-white text-sm focus:outline-none w-full max-w-xs"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingAlbumId(album.id);
                        setRenameValue(album.name);
                      }}
                      className="text-white font-medium text-sm truncate hover:text-[#D4AF37] transition-colors text-left"
                      title="Click to rename"
                    >
                      {album.name}
                    </button>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[#71717a] text-xs">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <VisibilityBadge visibility={album.visibility} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Visibility dropdown */}
                  <select
                    value={album.visibility}
                    onChange={(e) => handleChangeVisibility(album.id, e.target.value)}
                    className="bg-[#09090b] border border-[#27272a] rounded text-xs text-[#a1a1aa] px-2 py-1 focus:outline-none focus:border-[#D4AF37]"
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Delete */}
                  {confirmDeleteAlbum === album.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAlbum(null)}
                        className="text-xs text-[#71717a] hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteAlbum(album.id)}
                      className="w-8 h-8 flex items-center justify-center text-[#71717a] hover:text-red-400 transition-colors"
                      title="Delete album"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}

                  {/* Expand chevron */}
                  <svg
                    className={`w-5 h-5 text-[#71717a] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded items grid */}
              {isExpanded && (
                <div className="border-t border-[#27272a] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-[#a1a1aa]">Items</span>
                    <button
                      onClick={() => handleUploadClick(album.id)}
                      className="px-3 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Upload
                    </button>
                  </div>

                  {(!album.items || album.items.length === 0) ? (
                    <p className="text-[#52525b] text-sm text-center py-6">
                      No items yet. Upload photos or videos to this album.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {album.items.map((item) => (
                        <div key={item.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-[#27272a]">
                            {item.type === 'video' ? (
                              <video
                                src={item.media_url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={item.media_url}
                                alt={item.caption || ''}
                                className="w-full h-full object-cover"
                              />
                            )}
                            {item.type === 'video' && (
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                                Video
                              </div>
                            )}
                          </div>
                          {/* Delete button on hover */}
                          {confirmDeleteItem === item.id ? (
                            <div className="absolute top-1 right-1 flex gap-1">
                              <button
                                onClick={() => handleDeleteItem(item.id, album.id)}
                                className="px-2 py-1 bg-red-600 rounded text-[10px] text-white font-medium"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteItem(null)}
                                className="px-2 py-1 bg-[#27272a] rounded text-[10px] text-white"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteItem(item.id)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {item.caption && (
                            <p className="text-[#71717a] text-xs mt-1 truncate">{item.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
