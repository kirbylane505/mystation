/**
 * MYSTATION - Timer Guard
 * Manages 26-minute browse timer, polls server, triggers lockout.
 * Shows visible countdown in last 5 minutes + persistent "26 min free" notice.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { Clock } from 'lucide-react';

// Pages that bypass the timer (ticketing, admin)
const OPEN_PATHS = ['/events', '/tickets', '/admin'];

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerGuard() {
  const pathname = usePathname();
  const { isLoggedIn, isSubscribed, setFreeSignupSlots } = useUserStore();
  const { isLocked, lockSite, setBrowseTimeRemaining, browseTimeRemaining, currentTrack } = usePlayerStore();

  const isOpenPath = OPEN_PATHS.some(p => pathname?.startsWith(p));
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const initializedRef = useRef(false);

  const checkSession = useCallback(async (isStart = false) => {
    // Authenticated users skip timer entirely
    if (isLoggedIn || isSubscribed) {
      setBrowseTimeRemaining(null);
      return;
    }

    try {
      const endpoint = isStart ? '/api/session/start' : '/api/session/check';
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      // Update free signup slots
      if (data.freeSignupSlots !== undefined) {
        setFreeSignupSlots(data.freeSignupSlots);
      }

      // If user is authenticated/subscribed/friend on server, no timer
      if (data.status === 'authenticated' || data.status === 'subscribed' || data.status === 'friend') {
        setBrowseTimeRemaining(null);
        return;
      }

      if (data.locked) {
        // Timer expired — lock the site
        const trackId = currentTrack?.id || null;
        lockSite(trackId);
        setBrowseTimeRemaining(0);
      } else if (data.timeRemaining !== null && data.timeRemaining !== undefined) {
        setBrowseTimeRemaining(Math.ceil(data.timeRemaining / 1000));
      }
    } catch {
      // Network error — don't lock (fail open)
    }
  }, [isLoggedIn, isSubscribed, lockSite, setBrowseTimeRemaining, setFreeSignupSlots, currentTrack]);

  // Initialize on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Start session (creates cookie if needed)
    checkSession(true);
  }, [checkSession]);

  // Poll every 30 seconds
  useEffect(() => {
    if (isLoggedIn || isSubscribed) {
      // No polling needed for authenticated users
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(() => {
      checkSession(false);
    }, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLoggedIn, isSubscribed, checkSession]);

  // Client-side countdown (cosmetic — server is authoritative)
  useEffect(() => {
    if (isLoggedIn || isSubscribed || isLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const remaining = usePlayerStore.getState().browseTimeRemaining;
      if (remaining === null) return; // no timer (authenticated)
      if (remaining <= 0) {
        // Time's up — lock site
        const trackId = usePlayerStore.getState().currentTrack?.id || null;
        lockSite(trackId);
        clearInterval(timerRef.current);
        return;
      }
      setBrowseTimeRemaining(remaining - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoggedIn, isSubscribed, isLocked, lockSite, setBrowseTimeRemaining]);

  // Don't show timer on ticketing/admin pages or for authenticated users
  if (isOpenPath) return null;
  if (isLoggedIn || isSubscribed) return null;
  if (browseTimeRemaining === null) return null;
  if (isLocked) return null;

  // Show countdown in last 5 minutes (300 seconds), subtle notice otherwise
  const isUrgent = browseTimeRemaining <= 300;
  const isCritical = browseTimeRemaining <= 60;

  return (
    <div className={`fixed top-20 right-4 z-[150] transition-all duration-500 ${
      isUrgent ? 'opacity-100 scale-100' : 'opacity-70 scale-95 hover:opacity-100 hover:scale-100'
    }`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md border text-sm font-medium shadow-lg ${
        isCritical
          ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
          : isUrgent
            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            : 'bg-white/5 border-white/10 text-white/50'
      }`}>
        <Clock size={14} />
        <span>{formatTime(browseTimeRemaining)}</span>
        {!isUrgent && <span className="text-xs opacity-60">free</span>}
        {isUrgent && !isCritical && <span className="text-xs">remaining</span>}
        {isCritical && <span className="text-xs font-bold">Subscribe now!</span>}
      </div>
    </div>
  );
}
