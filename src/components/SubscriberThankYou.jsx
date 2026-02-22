/**
 * MYSTATION - Subscriber Thank You Toast
 * Gentle appreciation toast for subscribers — max 2x per day.
 * Uses sonner toast (already in layout) for reliable rendering.
 */

'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useUserStore } from '@/store/playerStore';

const STORAGE_KEY = 'ms-sub-thanks';
const MAX_PER_DAY = 2;
const SHOW_DELAY_MS = 4000;

function canShowToday() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const data = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (data.date !== today) return true;
    return (data.count || 0) < MAX_PER_DAY;
  } catch {
    return true;
  }
}

function recordShow() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = raw ? JSON.parse(raw) : {};
    if (data.date !== today) {
      data = { date: today, count: 0 };
    }
    data.count = (data.count || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export default function SubscriberThankYou() {
  const { isSubscribed } = useUserStore();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isSubscribed) return;
    if (firedRef.current) return;
    if (!canShowToday()) return;

    const timer = setTimeout(() => {
      firedRef.current = true;
      recordShow();
      toast('Thank you for choosing MyStation', {
        description: 'We value every stream. Being independent means everything.',
        duration: 6000,
        icon: '💙',
      });
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isSubscribed]);

  return null;
}
