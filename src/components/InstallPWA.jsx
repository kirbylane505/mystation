/**
 * MYSTATION - PWA Install Prompt
 * Shows install banner on ALL devices — mobile + desktop
 * Dismissible, once per day (localStorage)
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Share } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Dismissed today already
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS/Safari — no beforeinstallprompt, show manual instructions after 3s
    const isIOS = /iPhone|iPad/.test(navigator.userAgent) && !window.MSStream;
    const isSafariDesktop = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !isIOS;

    if (isIOS || isSafariDesktop) {
      const timer = setTimeout(() => {
        const d = localStorage.getItem('pwa-dismissed');
        if (!d || Date.now() - parseInt(d, 10) > 24 * 60 * 60 * 1000) {
          setShowBanner(true);
        }
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    // Chrome/Edge on desktop — also show after 3s if beforeinstallprompt hasn't fired
    const fallback = setTimeout(() => {
      // If prompt hasn't fired yet but we're on a supported browser, still show
      const d = localStorage.getItem('pwa-dismissed');
      if (!d || Date.now() - parseInt(d, 10) > 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    }, 4000);

    return () => {
      clearTimeout(fallback);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('pwa-dismissed', String(Date.now()));
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[80] animate-[merch-fade-up_0.4s_ease-out]">
      <div className="glass rounded-2xl p-4 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            {isIOS ? (
              <Share size={22} className="text-white" />
            ) : (
              <Download size={22} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">
              {isMobile ? 'Add MyStation to Home Screen' : 'Install MyStation App'}
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              {isIOS
                ? 'Tap the Share button, then "Add to Home Screen"'
                : isMobile
                  ? 'Get the full app experience — music never stops'
                  : 'Pin MyStation to your desktop for instant access'
              }
            </p>
          </div>
          {!isIOS && deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-full hover:bg-indigo-400 transition flex-shrink-0"
            >
              Install
            </button>
          ) : isIOS ? (
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone size={16} className="text-indigo-400" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
              {isMobile ? <Smartphone size={16} className="text-indigo-400" /> : <Monitor size={16} className="text-indigo-400" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
