'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';

function GradientPlaceholder({ name }) {
  const letter = name?.[0]?.toUpperCase() || '?';
  return (
    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D4AF37]/60 via-purple-600/40 to-blue-500/30 flex items-center justify-center">
      <span className="text-white text-lg font-bold">{letter}</span>
    </div>
  );
}

function AlbumCircle({ album, canAccess, onClick }) {
  return (
    <button
      onClick={() => canAccess && onClick(album)}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
      disabled={!canAccess}
    >
      <div
        className={`w-[72px] h-[72px] rounded-full p-[2px] ${
          canAccess
            ? 'bg-gradient-to-br from-[#D4AF37] to-[#b8962e]'
            : 'bg-[#3f3f46]'
        }`}
      >
        <div
          className={`w-full h-full rounded-full overflow-hidden bg-[#18181b] ${
            !canAccess ? 'opacity-40 grayscale' : ''
          }`}
        >
          {album.cover_url ? (
            <img
              src={album.cover_url}
              alt={album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <GradientPlaceholder name={album.name} />
          )}
        </div>
        {!canAccess && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#18181b] border border-[#27272a] rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-[#71717a]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-7V8A6 6 0 006 8v2a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2z" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-[10px] text-[#a1a1aa] truncate w-[72px] text-center group-hover:text-white transition-colors">
        {album.name}
      </span>
    </button>
  );
}

function GalleryViewer({ album, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(null);
  const items = album.items || [];
  const total = items.length;
  const item = items[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < total - 1 ? i + 1 : i));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  const handlePointerDown = (e) => {
    touchStartX.current = e.clientX;
  };

  const handlePointerUp = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/70 text-sm font-medium">
          {currentIndex + 1} / {total}
        </span>
        <h3 className="text-white font-bold text-sm truncate max-w-[50%]">
          {album.name}
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Media area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {/* Left arrow */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="max-w-full max-h-full flex items-center justify-center px-12">
          {item.type === 'video' ? (
            <video
              key={item.id}
              src={item.media_url}
              controls
              autoPlay
              className="max-w-full max-h-[70vh] rounded-lg"
            />
          ) : (
            <img
              key={item.id}
              src={item.media_url}
              alt={item.caption || ''}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </div>

        {/* Right arrow */}
        {currentIndex < total - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Caption */}
      {item.caption && (
        <p className="text-white/50 text-sm text-center px-6 py-2 flex-shrink-0">
          {item.caption}
        </p>
      )}

      {/* Dot indicators */}
      {total > 1 && total <= 20 && (
        <div className="flex items-center justify-center gap-1.5 py-3 flex-shrink-0">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? 'bg-[#D4AF37]' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyLifeGallery({ albums, isOwnProfile, viewerAccess }) {
  const [activeAlbum, setActiveAlbum] = useState(null);

  const canAccessAlbum = (album) => {
    if (viewerAccess === 'owner') return true;
    if (album.visibility === 'public') return true;
    if (album.visibility === 'followers' && (viewerAccess === 'followers' || viewerAccess === 'subscribers')) return true;
    if (album.visibility === 'subscribers' && viewerAccess === 'subscribers') return true;
    return false;
  };

  const handleAlbumClick = (album) => {
    if (album.items && album.items.length > 0) {
      setActiveAlbum(album);
    }
  };

  if (!albums || albums.length === 0) return null;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          My Life
        </h2>
        <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-2">
          {albums.map((album) => {
            const accessible = canAccessAlbum(album);
            return (
              <div key={album.id} className="relative">
                <AlbumCircle
                  album={album}
                  canAccess={accessible}
                  onClick={handleAlbumClick}
                />
              </div>
            );
          })}

          {isOwnProfile && (
            <Link
              href="/dashboard/gallery"
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-[#3f3f46] flex items-center justify-center hover:border-[#D4AF37] transition-colors">
                <svg className="w-6 h-6 text-[#71717a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-[10px] text-[#71717a]">Add</span>
            </Link>
          )}
        </div>
      </div>

      {activeAlbum && (
        <GalleryViewer
          album={activeAlbum}
          onClose={() => setActiveAlbum(null)}
        />
      )}
    </>
  );
}
