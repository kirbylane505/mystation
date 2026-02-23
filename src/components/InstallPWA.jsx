/**
 * MYSTATION - PWA Install Prompt
 * Shows install banner on ALL devices — mobile + desktop
 * Always has a working Install/Add button
 * Dismissible, once per day (localStorage)
 */

'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, ArrowUp } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Dismissed recently — stay gone for 7 days
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after 3s for all browsers (prompt or not)
    const showTimer = setTimeout(() => {
      const d = localStorage.getItem('pwa-dismissed');
      if (!d || Date.now() - parseInt(d, 10) > 7 * 24 * 60 * 60 * 1000) {
        setShowBanner(true);
      }
    }, 3000);

    // Auto-dismiss after 8 seconds of showing
    const autoHideTimer = setTimeout(() => {
      setShowBanner((prev) => {
        if (prev) localStorage.setItem('pwa-dismissed', String(Date.now()));
        return false;
      });
    }, 11000); // 3s delay + 8s visible = 11s total

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoHideTimer);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Native install prompt available
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        localStorage.setItem('pwa-dismissed', String(Date.now()));
      }
      setDeferredPrompt(null);
    } else {
      // No native prompt — show manual instructions
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowInstructions(false);
    localStorage.setItem('pwa-dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent);
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
  const isChrome = typeof navigator !== 'undefined' && /Chrome/i.test(navigator.userAgent) && !/Edge/i.test(navigator.userAgent);
  const isSafari = typeof navigator !== 'undefined' && /Safari/i.test(navigator.userAgent) && !isChrome;

  // Instruction text based on browser
  const getInstructions = () => {
    if (isIOS) return 'Tap the Share button at the bottom, then tap "Add to Home Screen"';
    if (isMobile) return 'Tap the menu (⋮) at the top right, then tap "Add to Home Screen"';
    if (isSafari) return 'Click File in the menu bar, then "Add to Dock" to install';
    if (isChrome) return 'Click the install icon (⊕) in the address bar, or Menu (⋮) → "Install MyStation"';
    return 'Click the browser menu (⋮) → "Install MyStation" or "Add to Home Screen"';
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[80] animate-[merch-fade-up_0.4s_ease-out]">
      <div className="glass rounded-2xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 max-w-md mx-auto overflow-hidden">
        {/* Main banner */}
        <div className="p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition z-10"
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
                  ? 'Get the full app experience on your iPhone'
                  : isMobile
                    ? 'Get the full app experience — music never stops'
                    : 'Pin MyStation to your desktop for instant access'
                }
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-full hover:bg-indigo-400 transition flex-shrink-0"
            >
              {isIOS ? 'How' : 'Install'}
            </button>
          </div>
        </div>

        {/* Instructions panel — slides open when no native prompt */}
        {showInstructions && (
          <div className="px-4 pb-4 pt-0">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
              <div className="flex items-start gap-3">
                <ArrowUp size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-xs font-semibold mb-1">How to install:</p>
                  <p className="text-white/60 text-xs leading-relaxed">{getInstructions()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
