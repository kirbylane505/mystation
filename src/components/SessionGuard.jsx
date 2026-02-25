/**
 * MYSTATION - Session Guard
 * Sends heartbeat every 30s to enforce device limits per tier
 * Shows kicked modal when another device signs in with same email
 * Diamond ($14.99) = 2 devices, all others = 1 device
 */

'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/playerStore';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function SessionGuard() {
  const { isLoggedIn, email, sessionKicked, supporterTier, sendHeartbeat, dismissKicked, logout } = useUserStore();

  useEffect(() => {
    if (!isLoggedIn || !email) return;

    // Initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, email, sendHeartbeat]);

  if (!sessionKicked) return null;

  const isDiamond = supporterTier === 'diamond';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-red-900/50 to-mystation-navyDark rounded-3xl border border-red-500/30 overflow-hidden shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Session Expired</h2>
        <p className="text-white/60 text-sm mb-4">
          {isDiamond
            ? 'You have too many active sessions. One of your devices was signed out.'
            : 'This account is signed in on another device. Only one session is allowed at a time.'}
        </p>
        {!isDiamond && (
          <p className="text-blue-400 text-xs mb-6">
            Upgrade to <span className="font-bold text-white">Diamond ($14.99/mo)</span> to use 2 devices at once.
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => { dismissKicked(); logout(); }}
            className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
          >
            OK
          </button>
          {!isDiamond && (
            <Link
              href="/subscribe"
              onClick={dismissKicked}
              className="block w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition text-sm"
            >
              Upgrade to Diamond
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
