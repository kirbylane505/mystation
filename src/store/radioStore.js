/**
 * MYSTATION RADIO — Station + queue state
 * Pairs with playerStore (audio engine) to power the /mystationradio tab.
 * Persists last queue to localStorage so offline playback has a fallback.
 */
import { create } from 'zustand';
import { usePlayerStore } from './playerStore';

const LAST_QUEUE_KEY = 'mystation-radio-last-queue';

function saveLastQueue(station, queue) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_QUEUE_KEY, JSON.stringify({
      station,
      queue,
      savedAt: Date.now(),
    }));
  } catch {}
}

function loadLastQueue() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LAST_QUEUE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export const useRadioStore = create((set, get) => ({
  activeStation: null, // { slug, name, avatar }
  queue: [],           // Track[] pre-shuffled
  cursor: 0,
  isRadioActive: false,
  history: [],         // last 20 played
  refilling: false,

  startStation: async (station) => {
    let queue = null;
    try {
      const res = await fetch(`/api/mystationradio/station?artist=${encodeURIComponent(station.slug)}`);
      if (res.ok) {
        const data = await res.json();
        queue = data.queue;
      }
    } catch {}

    // Offline fallback — load last-saved queue for this station (or any)
    if (!queue || !queue.length) {
      const saved = loadLastQueue();
      if (saved?.queue?.length) {
        queue = saved.queue;
        station = saved.station || station;
      }
    }

    if (!queue?.length) return;
    saveLastQueue(station, queue);
    set({ activeStation: station, queue, cursor: 0, isRadioActive: true, history: [] });
    usePlayerStore.getState().setTrack(queue[0]);
  },

  peekNext: () => {
    const { queue, cursor, isRadioActive } = get();
    if (!isRadioActive || !queue.length) return null;
    return queue[cursor + 1] || null;
  },

  advance: (opts = {}) => {
    const { silent = false } = opts;
    const { queue, cursor, isRadioActive, history } = get();
    if (!isRadioActive || !queue.length) return;
    const nextIdx = cursor + 1;
    if (nextIdx >= queue.length) return;
    const nextTrack = queue[nextIdx];
    const prevTrack = queue[cursor];
    set({
      cursor: nextIdx,
      history: prevTrack ? [prevTrack, ...history].slice(0, 20) : history,
    });
    if (silent) {
      // Update currentTrack without triggering the audio-reload useEffect.
      // The caller has already swapped audio elements — setTrack would re-load.
      usePlayerStore.setState({
        currentTrack: nextTrack,
        progress: 0,
        isPlaying: true,
        lastPlayedTrack: nextTrack,
      });
    } else {
      usePlayerStore.getState().setTrack(nextTrack);
    }
    // Background refill when running low
    if (queue.length - nextIdx < 20) get().refillQueue();
  },

  skip: () => get().advance(),

  stop: () => {
    set({ activeStation: null, queue: [], cursor: 0, isRadioActive: false, history: [] });
    usePlayerStore.getState().pause();
  },

  refillQueue: async () => {
    const { activeStation, queue, refilling } = get();
    if (!activeStation || refilling) return;
    set({ refilling: true });
    try {
      // Exclude every track already in the current queue so the refill never repeats
      const exclude = queue.map((t) => String(t.id)).join(',');
      const url = `/api/mystationradio/station?artist=${encodeURIComponent(activeStation.slug)}&exclude=${encodeURIComponent(exclude)}`;
      const res = await fetch(url);
      if (res.ok) {
        const { queue: more } = await res.json();
        if (more?.length) set({ queue: [...queue, ...more] });
      }
    } finally {
      set({ refilling: false });
    }
  },
}));
