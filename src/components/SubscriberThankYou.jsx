/**
 * MYSTATION - Subscriber Thank You Toast
 * Gentle appreciation popup for subscribers — max 2x per day, auto-dismiss 6s.
 * Shows on page load after a brief delay so it doesn't compete with initial render.
 */

'use client';

import { useState, useEffect } from 'react';
import { Heart, X } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

const STORAGE_KEY = 'ms-sub-thanks';
const MAX_PER_DAY = 2;
const AUTO_DISMISS_MS = 6000;
const SHOW_DELAY_MS = 4000; // Wait 4s after page load

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
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { isSubscribed } = useUserStore();

  useEffect(() => {
    if (!isSubscribed) return;
    if (!canShowToday()) return;

    const showTimer = setTimeout(() => {
      setShow(true);
      recordShow();
    }, SHOW_DELAY_MS);

    return () => clearTimeout(showTimer);
  }, [isSubscribed]);

  // Auto-dismiss
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [show]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => setShow(false), 300);
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '6rem',
        left: '50%',
        transform: exiting ? 'translateX(-50%) translateY(-20px)' : 'translateX(-50%) translateY(0)',
        opacity: exiting ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        zIndex: 85,
        width: '92%',
        maxWidth: '24rem',
      }}
    >
      <div className="relative bg-gradient-to-r from-[#0f1a2e] to-[#131d33] border border-blue-500/20 rounded-2xl p-4 shadow-2xl shadow-blue-500/10">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 pr-6">
          {/* Heart icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
            <Heart size={20} className="text-white fill-white" />
          </div>

          {/* Message */}
          <div>
            <p className="text-white font-bold text-sm">
              Thank you for choosing MyStation
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              We value every stream. Being independent means everything.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            style={{
              width: '100%',
              animation: `subThanksShrink ${AUTO_DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>

      {/* Global keyframe — not scoped */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subThanksShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      ` }} />
    </div>
  );
}
