/**
 * MYSTATION - Progress Bridge
 * Lightweight progress broadcast system that bypasses Zustand
 * Prevents 4Hz re-renders across all 35+ store subscribers
 */

let currentProgress = 0;
let currentDuration = 0;
const listeners = new Set();

export const progressBridge = {
  set(progress, duration) {
    currentProgress = progress;
    currentDuration = duration;
    listeners.forEach(fn => fn(progress, duration));
  },

  get() {
    return { progress: currentProgress, duration: currentDuration };
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  reset() {
    currentProgress = 0;
    currentDuration = 0;
  },
};
