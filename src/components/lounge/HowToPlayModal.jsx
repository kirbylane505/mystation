/**
 * KICKBACK LOUNGE — How to Play Modal
 * Universal guide for all games. Auto-shows on first play, re-accessible via "?" button.
 * Swipeable slides, kid-friendly language.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { HOW_TO_PLAY } from '@/lib/games/howToPlayData';

function hasSeenGuide(gameId) {
  try { return localStorage.getItem(`ms-howto-${gameId}`) === '1'; }
  catch { return false; }
}

function markGuideSeen(gameId) {
  try { localStorage.setItem(`ms-howto-${gameId}`, '1'); }
  catch { /* storage full */ }
}

/** The "?" help button — place in any game's UI */
export function HelpButton({ gameId, className = '' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition ${className}`}
        title="How to play"
      >
        <HelpCircle size={18} />
      </button>
      {open && <HowToPlayModal gameId={gameId} isOpen={open} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Auto-show hook — call in each game component */
export function useAutoShowGuide(gameId) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!hasSeenGuide(gameId)) {
      setShowGuide(true);
    }
  }, [gameId]);

  const closeGuide = useCallback(() => {
    markGuideSeen(gameId);
    setShowGuide(false);
  }, [gameId]);

  return { showGuide, closeGuide };
}

export default function HowToPlayModal({ gameId, isOpen, onClose }) {
  const [slide, setSlide] = useState(0);
  const [mounted, setMounted] = useState(false);
  const touchStartRef = useRef(0);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (isOpen) setSlide(0); }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Arrow keys for slide navigation
  // MUST be above conditional returns — React requires hooks to be called in the same order every render
  useEffect(() => {
    if (!isOpen || !gameId) return;
    const data = HOW_TO_PLAY[gameId];
    if (!data) return;
    const total = data.slides.length;
    const handler = (e) => {
      if (e.key === 'ArrowRight') {
        setSlide(s => {
          const isLast = s === total - 1;
          if (isLast) {
            markGuideSeen(gameId);
            onClose();
            return s;
          }
          return s + 1;
        });
      } else if (e.key === 'ArrowLeft') {
        setSlide(s => (s > 0 ? s - 1 : s));
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, slide, gameId, onClose]);

  if (!mounted || !isOpen || !gameId) return null;
  const data = HOW_TO_PLAY[gameId];
  if (!data) return null;

  const total = data.slides.length;
  const current = data.slides[slide];
  const isLast = slide === total - 1;

  const handleClose = () => {
    markGuideSeen(gameId);
    onClose();
  };

  const handleNext = () => {
    if (isLast) handleClose();
    else setSlide(s => s + 1);
  };

  const handlePrev = () => {
    if (slide > 0) setSlide(s => s - 1);
  };

  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
  };

  const modal = (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1117] border border-white/[0.08] rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ animation: 'loungeFadeUp 0.3s ease-out' }}
      >
        {/* Close button */}
        <button onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/70 transition z-10">
          <X size={16} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <p className="text-[10px] text-white/30 font-medium tracking-widest mb-1">HOW TO PLAY</p>
          <h3 className="text-white font-bold text-xl">{data.title}</h3>
        </div>

        {/* Slide content */}
        <div className="px-8 pb-4 min-h-[160px]">
          <h4 className="text-white font-bold text-lg mb-2">{current.heading}</h4>
          <p className="text-white/60 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Slide counter */}
        <div className="text-center mb-2">
          <span className="text-[10px] text-white/20 font-mono">{slide + 1} / {total}</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button onClick={handlePrev}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition ${slide > 0 ? 'bg-white/5 hover:bg-white/10 text-white/50' : 'opacity-0 pointer-events-none'}`}>
            <ChevronLeft size={20} />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {data.slides.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'bg-white w-5' : 'bg-white/20 w-2'}`} />
            ))}
          </div>

          <button onClick={handleNext}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition">
            {isLast ? <span className="text-xs font-bold text-emerald-400">GO!</span> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
