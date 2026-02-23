'use client';

import { useState, useCallback } from 'react';
import { Share2, Check, Copy, X } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';

export default function SharePage() {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentTrack = usePlayerStore(s => s.currentTrack);

  // If a track is playing, share the song URL. Otherwise share the page URL.
  const getShareData = useCallback(() => {
    if (currentTrack?.id) {
      const url = `https://mystationlive.com/song/${currentTrack.id}`;
      const title = `${currentTrack.title} - Mike Page`;
      const text = `Listen to "${currentTrack.title}" by Mike Page on MyStation! #MikePage #MyStation #IDMG`;
      return { url, title, text };
    }
    return {
      url: window.location.href,
      title: document.title.replace(' | MyStation', ''),
      text: `Check this out on MyStation`,
    };
  }, [currentTrack]);

  const handleShare = useCallback(async () => {
    const { url, title, text } = getShareData();

    // Mobile: native share sheet
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    // Desktop: show share menu
    setShowMenu(true);
  }, [getShareData]);

  const copyLink = useCallback(async () => {
    const { url } = getShareData();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShowMenu(false); }, 1500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShowMenu(false); }, 1500);
    }
  }, [getShareData]);

  const shareVia = useCallback((platform) => {
    const { url: rawUrl, title: rawTitle, text: rawText } = getShareData();
    const url = encodeURIComponent(rawUrl);
    const title = encodeURIComponent(rawTitle);
    const text = encodeURIComponent(rawText);

    const links = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      sms: `sms:?body=${text}%20${url}`,
      email: `mailto:?subject=${title}&body=${text}%20${decodeURIComponent(url)}`,
    };

    window.open(links[platform], '_blank', 'width=600,height=400');
    setShowMenu(false);
  }, [getShareData]);

  const shareLabel = currentTrack?.id ? 'Share This Song' : 'Share This Page';

  return (
    <>
      {/* Floating Share Button */}
      <button
        onClick={handleShare}
        className="fixed bottom-32 md:bottom-24 right-4 z-40 w-11 h-11 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-110 transition-all active:scale-95"
        aria-label={shareLabel}
      >
        <Share2 className="w-5 h-5 text-white" />
      </button>

      {/* Share Menu (Desktop) */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#1a1a2e] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-auto p-6 animate-in slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold text-lg">{shareLabel}</h3>
                {currentTrack?.title && (
                  <p className="text-white/50 text-sm">{currentTrack.title}</p>
                )}
              </div>
              <button onClick={() => setShowMenu(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-5">
              <button onClick={() => shareVia('sms')} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <span className="text-green-400 text-lg">SMS</span>
                </div>
                <span className="text-white/50 text-xs">Text</span>
              </button>
              <button onClick={() => shareVia('email')} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <span className="text-blue-400 text-lg">@</span>
                </div>
                <span className="text-white/50 text-xs">Email</span>
              </button>
              <button onClick={() => shareVia('twitter')} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-sky-500/20 rounded-full flex items-center justify-center group-hover:bg-sky-500/30 transition-colors">
                  <span className="text-sky-400 text-lg font-bold">X</span>
                </div>
                <span className="text-white/50 text-xs">Twitter</span>
              </button>
              <button onClick={() => shareVia('facebook')} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                  <span className="text-blue-500 text-lg font-bold">f</span>
                </div>
                <span className="text-white/50 text-xs">Facebook</span>
              </button>
            </div>

            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
