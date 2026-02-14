/**
 * MYSTATION - Timer Guard
 * Manages 10-minute browse timer, polls server, triggers lockout.
 * Invisible component — no UI except optional countdown in last 2 minutes.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';

export default function TimerGuard() {
  const { isLoggedIn, isSubscribed, setFreeSignupSlots } = useUserStore();
  const { isLocked, lockSite, setBrowseTimeRemaining, currentTrack } = usePlayerStore();
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

  // No visible UI — AccountWall handles the lockout overlay
  return null;
}
