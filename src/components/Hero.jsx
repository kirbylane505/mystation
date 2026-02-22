/**
 * MYSTATION - Hero Section
 * IDMG logo + brand + "Caught That" video under tagline
 */

'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import CommentSection from './CommentSection';

export default function Hero() {
  const [commentVideo, setCommentVideo] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="video-hero relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628]" />
      {/* Subtle orb effects */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px]" />

      {/* Hero content */}
      <div className="text-center px-6 relative z-10 w-full max-w-4xl mx-auto">
        {/* Logo */}
        <div className="mb-6 flex justify-center hero-title">
          <Image
            src="/images/idmg-logo-white.png"
            alt="IDMG - Impossible Dreamz Music Group"
            width={280}
            height={280}
            priority
            className="drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-4 font-display tracking-tight hero-subtitle drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
          MY<span className="gradient-text">STATION</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-lg mx-auto hero-cta drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Your Music. Your Station. No Limits.
        </p>

        {/* Official 4K Videos — Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/xqw4wV8Npzs?rel=0&modestbranding=1&playsinline=1"
                title="Mike Page - Caught That (Official 4K Video)"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 'none' }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/30 text-xs uppercase tracking-[0.2em]">
                "Caught That" — Official 4K Video
              </p>
              <button
                onClick={() => setCommentVideo({ id: 'video-caught-that', title: 'Caught That' })}
                className="flex items-center gap-1.5 text-white/40 hover:text-blue-400 transition text-xs"
              >
                <MessageCircle size={14} />
                <span>Comments</span>
              </button>
            </div>
          </div>
          <div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/DC9CGQN_DI8?rel=0&modestbranding=1&playsinline=1"
                title="Mike Page - To The Money (Official 4K Video)"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 'none' }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/30 text-xs uppercase tracking-[0.2em]">
                "To The Money" — Official 4K Video
              </p>
              <button
                onClick={() => setCommentVideo({ id: 'video-to-the-money', title: 'To The Money' })}
                className="flex items-center gap-1.5 text-white/40 hover:text-blue-400 transition text-xs"
              >
                <MessageCircle size={14} />
                <span>Comments</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Comment Modal — portaled to body */}
      {commentVideo && mounted && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center pb-[72px] md:pb-0" onClick={() => setCommentVideo(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full md:w-[420px] md:max-h-[80vh] max-h-[65vh] rounded-t-2xl md:rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <MessageCircle size={14} className="text-blue-400" />
                  Comments
                </h3>
                <p className="text-[11px] text-white/30 mt-0.5 truncate">{commentVideo.title}</p>
              </div>
              <button onClick={() => setCommentVideo(null)} className="p-2 text-white/40 hover:text-white transition">
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CommentSection
                trackId={commentVideo.id}
                trackTitle={commentVideo.title}
                modalMode={true}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
