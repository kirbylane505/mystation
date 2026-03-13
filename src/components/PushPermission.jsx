'use client';
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushPermission() {
  const [show, setShow] = useState(false);
  const { isStandalone } = usePWA();

  useEffect(() => {
    if (!isStandalone) return;
    if (!('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;
    if (getCookie('mystation-push-asked')) return;
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [isStandalone]);

  const handleAllow = async () => {
    setShow(false);
    setCookie('mystation-push-asked', '1', 90);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub }),
        });
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setCookie('mystation-push-asked', '1', 30);
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9998] animate-in slide-in-from-top-4 max-w-md mx-auto">
      <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-4 flex items-start gap-3 shadow-xl">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell size={18} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Get notified when new music drops?</p>
          <p className="text-white/40 text-xs mt-1">We only send notifications for new releases and LOTL updates.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAllow} className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 transition">
              Allow
            </button>
            <button onClick={handleDismiss} className="px-4 py-1.5 bg-white/5 text-white/50 text-xs rounded-lg hover:bg-white/10 transition">
              Not Now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/20 hover:text-white/50">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
