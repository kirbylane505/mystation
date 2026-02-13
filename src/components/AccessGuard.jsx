/**
 * MYSTATION - Access Guard
 * Client-side enforcement overlay for locked pages after trial expires.
 * Shows "Subscribe to continue" when trial is over on premium routes.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Lock, ShoppingBag, Ticket, CreditCard, Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

// Routes that are ALWAYS free (no sub needed)
const FREE_ROUTES = [
  '/', '/merch', '/checkout', '/lotl', '/about', '/contact',
  '/terms', '/privacy', '/subscribe',
];

function isFreePage(pathname) {
  if (pathname === '/') return true;
  return FREE_ROUTES.some(r => pathname.startsWith(r));
}

export default function AccessGuard() {
  const pathname = usePathname();
  const { isSubscribed, accessStatus, setTrialStatus } = useUserStore();
  const [showLock, setShowLock] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkAccess = useCallback(async () => {
    // Free pages never lock
    if (isFreePage(pathname)) {
      setShowLock(false);
      setChecking(false);
      return;
    }

    // If store says subscribed, trust it
    if (isSubscribed) {
      setShowLock(false);
      setChecking(false);
      return;
    }

    try {
      const res = await fetch('/api/trial/check', { cache: 'no-store' });
      const data = await res.json();

      setTrialStatus(data.status, data.expiresAt || null);

      if (data.status === 'subscribed' || data.status === 'trial') {
        setShowLock(false);
      } else {
        // expired or none — lock this page
        setShowLock(true);
      }
    } catch {
      // On error, don't lock (fail open for UX)
      setShowLock(false);
    }
    setChecking(false);
  }, [pathname, isSubscribed, setTrialStatus]);

  useEffect(() => {
    setChecking(true);
    checkAccess();
  }, [checkAccess]);

  // Don't show anything while checking or on free pages
  if (checking || !showLock) return null;

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-lg text-center">
        {/* Lock icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full flex items-center justify-center">
          <Lock size={36} className="text-orange-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
          Your Free Preview Has Ended
        </h1>
        <p className="text-white/60 text-sm sm:text-base mb-8 max-w-md mx-auto">
          Subscribe to keep streaming music, creating playlists, and accessing all premium features.
        </p>

        {/* Subscribe button */}
        <a
          href="/subscribe"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-blue-500/30 text-lg mb-6"
        >
          <CreditCard size={20} />
          Subscribe — Starting at $4.99/mo
        </a>

        {/* Alternative access methods */}
        <div className="mt-6 space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider font-bold">Or get free access by:</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/merch"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 hover:bg-white/10 transition text-sm"
            >
              <ShoppingBag size={16} className="text-green-400" />
              Buy merch = 1 month free
            </a>
            <a
              href="/lotl"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 hover:bg-white/10 transition text-sm"
            >
              <Ticket size={16} className="text-purple-400" />
              Buy tickets = 1 month free
            </a>
          </div>
        </div>

        {/* Still-free pages */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            { label: 'Home', href: '/' },
            { label: 'Merch', href: '/merch' },
            { label: 'LOTL Festival', href: '/lotl' },
            { label: 'About', href: '/about' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-white/40 hover:text-white/70 text-xs border border-white/5 rounded-lg hover:border-white/20 transition"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
