'use client';
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import usePWA from '@/hooks/usePWA';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { isStandalone, isIOS, canInstall, installApp } = usePWA();

  // Detect if NOT Safari on iOS (Chrome, Firefox, etc. can't install PWAs)
  const [isSafari, setIsSafari] = useState(true);
  useEffect(() => {
    if (isIOS) {
      const ua = navigator.userAgent;
      // Safari on iOS has "Safari" in UA but NOT "CriOS" (Chrome) or "FxiOS" (Firefox)
      const notSafari = /CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
      setIsSafari(!notSafari);
    }
  }, [isIOS]);

  useEffect(() => {
    if (isStandalone) return;
    if (!canInstall) return;
    if (!getCookie('mystation-install-shown')) return;
    if (getCookie('mystation-install-banner')) return;
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [isStandalone, canInstall]);

  const handleDismiss = () => {
    setShow(false);
    setShowGuide(false);
    setCookie('mystation-install-banner', '1', 7);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowGuide(true);
      return;
    }
    const installed = await installApp();
    if (installed) setCookie('mystation-install-shown', '1', 365);
    setShow(false);
  };

  if (!show) return null;

  // iOS step-by-step guide overlay
  if (showGuide) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-end justify-center p-4 pb-8">
        <div className="bg-[#0f1729] border border-white/10 rounded-3xl max-w-sm w-full p-6 relative">
          <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/40 hover:text-white">
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-white text-center mb-2">Install MyStation</h2>

          {!isSafari ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <p className="text-red-300 text-sm text-center font-medium">
                Open this page in <strong>Safari</strong> to install.
              </p>
              <p className="text-red-300/60 text-xs text-center mt-1">
                Chrome & other browsers on iPhone can&apos;t install apps to home screen.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">1</div>
                <div>
                  <p className="text-white text-sm font-medium">Tap the Share button</p>
                  <p className="text-white/50 text-xs">The square with an arrow at the bottom of Safari</p>
                  <div className="mt-2 flex justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">2</div>
                <div>
                  <p className="text-white text-sm font-medium">Scroll down and tap</p>
                  <div className="mt-1 bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    <span className="text-white text-sm font-medium">Add to Home Screen</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">3</div>
                <div>
                  <p className="text-white text-sm font-medium">Tap <strong>Add</strong></p>
                  <p className="text-white/50 text-xs">MyStation will appear on your home screen like a real app</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleDismiss} className="w-full text-center text-white/30 text-sm hover:text-white/50 transition py-2">
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[140px] lg:bottom-[100px] left-4 right-4 z-[100] animate-in slide-in-from-bottom-4">
      <div
        className="bg-[#0f1729] border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-xl shadow-black/50 max-w-md mx-auto cursor-pointer"
        onClick={handleInstall}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">Install MyStation</p>
          <p className="text-white/40 text-xs truncate">
            {isIOS ? 'Tap here for instructions' : 'Add to home screen'}
          </p>
        </div>
        {!isIOS && (
          <button
            onClick={(e) => { e.stopPropagation(); handleInstall(); }}
            className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg flex-shrink-0 hover:bg-indigo-400 transition"
          >
            Install
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); handleDismiss(); }} className="text-white/30 hover:text-white/60 flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
