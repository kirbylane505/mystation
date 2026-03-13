'use client';
import { useState, useEffect } from 'react';
import { X, Download, Music, Wifi, Bell } from 'lucide-react';
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

export default function PWAInstallModal() {
  const [show, setShow] = useState(false);
  const { isStandalone, isIOS, canInstall, installApp } = usePWA();

  useEffect(() => {
    if (isStandalone) return;
    if (getCookie('mystation-install-shown')) return;
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [isStandalone]);

  const handleDismiss = () => {
    setShow(false);
    setCookie('mystation-install-shown', '1', 30);
  };

  const handleInstall = async () => {
    if (isIOS) {
      handleDismiss();
      return;
    }
    const installed = await installApp();
    if (installed) setCookie('mystation-install-shown', '1', 365);
    setShow(false);
  };

  // Detect non-Safari on iOS
  const [isSafari, setIsSafari] = useState(true);
  useEffect(() => {
    if (isIOS) {
      const notSafari = /CriOS|FxiOS|OPiOS|EdgiOS/.test(navigator.userAgent);
      setIsSafari(!notSafari);
    }
  }, [isIOS]);

  if (!show || !canInstall) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#0f1729] to-[#0a0a1a] border border-white/10 rounded-3xl max-w-sm w-full p-6 relative">
        <button onClick={handleDismiss} aria-label="Close install modal" className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={20} />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music size={36} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-1">Install MyStation</h2>
        <p className="text-white/50 text-center text-sm mb-6">Add to your home screen</p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Music size={16} className="text-indigo-400" />
            </div>
            <span className="text-sm">Full-screen music player</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Wifi size={16} className="text-green-400" />
            </div>
            <span className="text-sm">Works offline with cached tracks</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-amber-400" />
            </div>
            <span className="text-sm">Get notified when new music drops</span>
          </div>
        </div>

        {isIOS ? (
          <div className="mb-4">
            {!isSafari ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 text-sm text-center font-medium">
                  Open in <strong>Safari</strong> to install
                </p>
                <p className="text-red-300/60 text-xs text-center mt-1">
                  Chrome can&apos;t install apps on iPhone
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">1</div>
                  <span className="text-white text-sm">Tap the <strong>Share</strong> button</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400 ml-auto">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">2</div>
                  <span className="text-white text-sm">Tap <strong>Add to Home Screen</strong></span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">3</div>
                  <span className="text-white text-sm">Tap <strong>Add</strong></span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition mb-3"
          >
            <Download size={18} />
            Install Now
          </button>
        )}

        <button onClick={handleDismiss} className="w-full text-center text-white/30 text-sm hover:text-white/50 transition">
          Maybe Later
        </button>
      </div>
    </div>
  );
}
