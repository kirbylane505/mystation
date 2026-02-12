/**
 * MYSTATION - Audio Player State Management
 * Using Zustand for simple, powerful state
 * Includes subscription & play tracking for engagement
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePlayerStore = create(
  persist(
    (set, get) => ({
  // Current track
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,

  // Queue
  queue: [],
  queueIndex: 0,
  shuffle: false,
  repeat: 'all', // 'off', 'all', 'one' — default to continuous play

  // Vault access (session-only, not persisted)
  vaultUnlocked: false,
  setVaultUnlocked: (val) => set({ vaultUnlocked: val }),

  // Engagement tracking
  playCount: 0,
  uniquePlaysThisSession: [],
  lastPlayedTrack: null,
  showSubscribeModal: false,
  pendingTrack: null, // Track waiting to play after subscription
  firstVisitTime: null, // 24-hour free trial start timestamp

  // Actions
  setTrack: (track) => set({
    currentTrack: track,
    progress: 0,
    isPlaying: true,
    lastPlayedTrack: track
  }),

  togglePlay: () => set((state) => ({
    isPlaying: !state.isPlaying
  })),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({
    volume,
    isMuted: volume === 0
  }),

  toggleMute: () => set((state) => ({
    isMuted: !state.isMuted
  })),

  // Play count management for analytics
  incrementPlayCount: (trackId) => {
    const { uniquePlaysThisSession } = get();
    if (!uniquePlaysThisSession.includes(trackId)) {
      set((state) => ({
        playCount: state.playCount + 1,
        uniquePlaysThisSession: [...state.uniquePlaysThisSession, trackId]
      }));
    }
  },

  // Initialize first visit timestamp (called on first play)
  initTrial: () => {
    const { firstVisitTime } = get();
    if (!firstVisitTime) {
      const now = Date.now();
      set({ firstVisitTime: now });
      if (typeof window !== 'undefined') {
        localStorage.setItem('mystation-trial-start', String(now));
      }
    }
  },

  // Get trial time remaining in ms (0 = expired)
  getTrialRemaining: () => {
    let start = get().firstVisitTime;
    // Fallback to localStorage
    if (!start && typeof window !== 'undefined') {
      const stored = localStorage.getItem('mystation-trial-start');
      if (stored) {
        start = parseInt(stored, 10);
        set({ firstVisitTime: start });
      }
    }
    if (!start) return 24 * 60 * 60 * 1000; // Full 24h if never visited
    const elapsed = Date.now() - start;
    const total = 24 * 60 * 60 * 1000; // 24 hours
    return Math.max(0, total - elapsed);
  },

  // Check if can play (24-hour free trial, then subscription wall)
  canPlay: (trackId) => {
    const { isSubscribed } = useUserStore.getState();
    if (isSubscribed) return true;
    // Fallback: check localStorage in case zustand state was cleared
    if (typeof window !== 'undefined' && localStorage.getItem('mystation-subscribed') === 'true') {
      useUserStore.getState().subscribe(localStorage.getItem('mystation-user-email') || 'subscriber');
      return true;
    }

    // 24-hour free trial check
    const remaining = get().getTrialRemaining();
    return remaining > 0;
  },

  // Show subscribe modal
  openSubscribeModal: (pendingTrack = null) => set({
    showSubscribeModal: true,
    pendingTrack
  }),

  closeSubscribeModal: () => set({
    showSubscribeModal: false,
    pendingTrack: null
  }),

  // Return to last played track
  returnToLastPlayed: () => {
    const { lastPlayedTrack } = get();
    if (lastPlayedTrack) {
      set({
        currentTrack: lastPlayedTrack,
        showSubscribeModal: false,
        pendingTrack: null
      });
    }
  },

  // Queue management
  setQueue: (tracks, startIndex = 0) => set({
    queue: tracks,
    queueIndex: startIndex,
    currentTrack: tracks[startIndex],
    isPlaying: true,
    lastPlayedTrack: tracks[startIndex]
  }),

  nextTrack: () => {
    const { queue, queueIndex, repeat, shuffle } = get();
    if (queue.length === 0) return;

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (queueIndex >= queue.length - 1) {
      nextIndex = repeat === 'all' ? 0 : queueIndex;
      if (repeat !== 'all') {
        set({ isPlaying: false });
        return;
      }
    } else {
      nextIndex = queueIndex + 1;
    }

    const nextTrack = queue[nextIndex];
    set({
      queueIndex: nextIndex,
      currentTrack: nextTrack,
      progress: 0,
      isPlaying: true,
      lastPlayedTrack: nextTrack
    });
  },

  prevTrack: () => {
    const { queue, queueIndex, progress } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1;
    const prevTrack = queue[prevIndex];
    set({
      queueIndex: prevIndex,
      currentTrack: prevTrack,
      progress: 0,
      lastPlayedTrack: prevTrack
    });
  },

  toggleShuffle: () => set((state) => ({
    shuffle: !state.shuffle
  })),

  toggleRepeat: () => set((state) => {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(state.repeat);
    return { repeat: modes[(currentIndex + 1) % 3] };
  }),
}),
    {
      name: 'mystation-player',
      version: 2, // Bump to clear cached player state for all users
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        shuffle: state.shuffle,
        repeat: state.repeat,
        // Track/queue NOT persisted — fresh auto-play queue on every visit
        // This prevents stale tracks from replaying on return visits
      })
    }
  )
);

// User state with persistence + concurrent session prevention
export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isSubscribed: false,
      supporterTier: 'free', // 'free', 'regular', 'premium', 'diamond'
      favorites: [],
      email: '',
      sessionToken: null,
      sessionKicked: false,

      setUser: (user) => set({
        user,
        isLoggedIn: !!user,
        isSubscribed: user?.isSubscribed || false,
        supporterTier: user?.tier || 'free'
      }),

      subscribe: (email, tier = 'regular') => set({
        isSubscribed: true,
        isLoggedIn: true,
        email,
        supporterTier: tier,
        user: { email, isSubscribed: true, tier }
      }),

      logout: () => {
        set({
          user: null,
          isLoggedIn: false,
          isSubscribed: false,
          supporterTier: 'free',
          email: '',
          sessionToken: null,
          sessionKicked: false,
        });
      },

      // Session heartbeat — call every 30s to enforce single device login
      sendHeartbeat: async () => {
        const { email, sessionToken, isLoggedIn } = get();
        if (!isLoggedIn || !email) return;

        try {
          const res = await fetch('/api/auth/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, sessionToken }),
          });
          const data = await res.json();

          if (data.kicked) {
            // Another device signed in — force logout
            set({ sessionKicked: true, isLoggedIn: false, isSubscribed: false });
            return;
          }

          if (data.sessionToken && data.sessionToken !== sessionToken) {
            set({ sessionToken: data.sessionToken });
          }
        } catch {
          // Network error — don't kick on connectivity issues
        }
      },

      // Initialize session on login
      initSession: async (email) => {
        try {
          const res = await fetch('/api/auth/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, sessionToken: null }),
          });
          const data = await res.json();
          if (data.sessionToken) {
            set({ sessionToken: data.sessionToken, sessionKicked: false });
          }
        } catch {}
      },

      dismissKicked: () => set({ sessionKicked: false }),

      toggleFavorite: (trackId) => set((state) => ({
        favorites: state.favorites.includes(trackId)
          ? state.favorites.filter(id => id !== trackId)
          : [...state.favorites, trackId]
      })),
    }),
    {
      name: 'mystation-user',
      partialize: (state) => ({
        isSubscribed: state.isSubscribed,
        email: state.email,
        favorites: state.favorites,
        supporterTier: state.supporterTier,
        sessionToken: state.sessionToken,
      })
    }
  )
);
