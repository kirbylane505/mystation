/**
 * MYSTATION - Subscriber Thank You Toast
 * Gentle appreciation toast for subscribers — max 2x per day.
 * Uses direct DOM injection for bulletproof rendering.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/store/playerStore';

const STORAGE_KEY = 'ms-sub-thanks';
const MAX_PER_DAY = 2;
const SHOW_DELAY_MS = 4000;
const AUTO_DISMISS_MS = 6000;

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

function showToast() {
  const el = document.createElement('div');
  el.id = 'ms-sub-toast';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding-right:24px">
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(59,130,246,0.3)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:14px;line-height:1.3">Thank you for choosing MyStation</div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px">We value every stream. Being independent means everything.</div>
      </div>
    </div>
    <div style="margin-top:12px;height:2px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
      <div id="ms-sub-toast-bar" style="height:100%;background:linear-gradient(90deg,#3b82f6,#6366f1);border-radius:2px;width:100%"></div>
    </div>
    <button id="ms-sub-toast-close" style="position:absolute;top:12px;right:12px;width:24px;height:24px;background:rgba(255,255,255,0.1);border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(255,255,255,0.4);font-size:14px;line-height:1">✕</button>
  `;
  Object.assign(el.style, {
    position: 'fixed',
    top: '96px',
    left: '50%',
    transform: 'translateX(-50%) translateY(-20px)',
    opacity: '0',
    zIndex: '85',
    width: '92%',
    maxWidth: '384px',
    background: 'linear-gradient(135deg, #0f1a2e, #131d33)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 25px 50px -12px rgba(59,130,246,0.1)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
  });
  document.body.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'translateX(-50%) translateY(0)';
      el.style.opacity = '1';
    });
  });

  // Progress bar animation
  const bar = document.getElementById('ms-sub-toast-bar');
  if (bar) {
    bar.style.transition = `width ${AUTO_DISMISS_MS}ms linear`;
    requestAnimationFrame(() => { bar.style.width = '0%'; });
  }

  // Close button
  const closeBtn = document.getElementById('ms-sub-toast-close');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  // Auto-dismiss
  const timer = setTimeout(dismiss, AUTO_DISMISS_MS);

  function dismiss() {
    clearTimeout(timer);
    el.style.transform = 'translateX(-50%) translateY(-20px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
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
      showToast();
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isSubscribed]);

  return null;
}
