/**
 * MYSTATION - Session Guard
 * Sends heartbeat every 30s to enforce single-device login
 * Shows kicked modal when another device signs in with same email
 */

'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/playerStore';
import { X, AlertTriangle } from 'lucide-react';

export default function SessionGuard() {
  const { isLoggedIn, email, sessionKicked, sendHeartbeat, dismissKicked, logout } = useUserStore();

  useEffect(() => {
    if (!isLoggedIn || !email) return;

    // Initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, email, sendHeartbeat]);

  if (!sessionKicked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-red-900/50 to-mystation-navyDark rounded-3xl border border-red-500/30 overflow-hidden shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Session Expired</h2>
        <p className="text-white/60 text-sm mb-6">
          This account is signed in on another device. Only one session is allowed at a time.
        </p>
        <button
          onClick={() => { dismissKicked(); logout(); }}
          className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
        >
          OK
        </button>
      </div>
    </div>
  );
}
