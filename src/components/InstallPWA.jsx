/**
 * MYSTATION - PWA Install Prompt
 * Shows install banner on mobile only, dismissible
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show on mobile
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if already dismissed this session
    if (sessionStorage.getItem('pwa-dismissed')) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari — show manual instructions after 5s
    const isIOS = /iPhone|iPad/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      const timer = setTimeout(() => {
        if (!sessionStorage.getItem('pwa-dismissed')) {
          setShowBanner(true);
        }
      }, 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-dismissed', '1');
  };

  if (!showBanner) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 animate-[merch-fade-up_0.4s_ease-out]">
      <div className="glass rounded-2xl p-4 border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition"
        >
          <X size={14} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Download size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">Install MyStation</p>
            <p className="text-white/50 text-xs">
              {isIOS
                ? 'Tap Share, then "Add to Home Screen"'
                : 'Add to your home screen for the best experience'
              }
            </p>
          </div>
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-full hover:bg-indigo-400 transition flex-shrink-0"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
