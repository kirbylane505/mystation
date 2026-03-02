/**
 * MYSTATION - Audio Player State Management
 * Using Zustand for simple, powerful state
 * v8: Removed browse timer / lockout system — all non-vault tracks are free
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

  // Universal gate — track IDs played by non-subscribers (session only, not persisted)
  freePlays: [], // [trackId1, trackId2]

  // Show account wall (triggered from navbar sign-in button)
  showAccountWall: false,

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

  // Show subscribe modal — NEVER for subscribers
  openSubscribeModal: (pendingTrack = null) => {
    // Check cookies first — subscribers never see the modal
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    if (cookies.includes('mystation-sub-flag=') || cookies.includes('mystation-sub=') || cookies.includes('mystation-friend=')) {
      // Subscriber — play the track directly instead of showing modal
      if (pendingTrack) {
        set({ currentTrack: pendingTrack, isPlaying: true, lastPlayedTrack: pendingTrack });
      }
      return;
    }
    // Also check Zustand user state
    if (useUserStore.getState().isSubscribed) {
      if (pendingTrack) {
        set({ currentTrack: pendingTrack, isPlaying: true, lastPlayedTrack: pendingTrack });
      }
      return;
    }
    set({ showSubscribeModal: true, pendingTrack });
  },

  closeSubscribeModal: () => set({
    showSubscribeModal: false,
    pendingTrack: null
  }),

  setShowAccountWall: (show) => set({ showAccountWall: show }),

  // Universal gate helpers
  recordFreePlay: (track) => {
    if (!track?.id) return;
    set((state) => {
      if (state.freePlays.includes(track.id)) return state;
      return { freePlays: [...state.freePlays, track.id] };
    });
  },

  initFreePlays: async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/audio/token');
      if (res.ok) {
        const { freePlays } = await res.json();
        set({ freePlays: freePlays || [] });
      }
    } catch {}
  },

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

  // Queue management — gate check before playing
  setQueue: (tracks, startIndex = 0) => {
    const target = tracks[startIndex];
    if (target && isGated(target)) {
      get().openSubscribeModal(target);
      return;
    }
    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: target,
      isPlaying: true,
      lastPlayedTrack: target
    });
  },

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
    if (isGated(nextTrack)) {
      set({ isPlaying: false });
      get().openSubscribeModal(nextTrack);
      return;
    }
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
    if (isGated(prevTrack)) {
      set({ isPlaying: false });
      get().openSubscribeModal(prevTrack);
      return;
    }
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
      version: 8, // v8: removed browse timer / lockout system entirely
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
      migrate: (persisted, version) => {
        // v8: removed browse timer / lockout — keep user preferences only
        if (version < 8) {
          return {
            volume: persisted.volume ?? 0.8,
            isMuted: persisted.isMuted ?? false,
            shuffle: persisted.shuffle ?? false,
            repeat: persisted.repeat ?? 'all',
          };
        }
        return persisted;
      },
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
      freeSignupSlotsRemaining: 26,
      sessionToken: null,
      sessionKicked: false,

      setUser: (user) => {
        set({
          user,
          isLoggedIn: !!user,
          isSubscribed: user?.isSubscribed || false,
          supporterTier: user?.tier || 'free'
        });
      },

      subscribe: (email, tier = 'regular') => {
        set({
          isSubscribed: true,
          isLoggedIn: true,
          email,
          supporterTier: tier,
          user: { email, isSubscribed: true, tier }
        });
      },

      setEmail: (email) => set({ email }),

      setFreeSignupSlots: (n) => set({ freeSignupSlotsRemaining: n }),

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

// Check if a track is blocked by the universal 2-song gate
// Returns true if BLOCKED, false if allowed
const FREE_SONGS_TOTAL = 2;

export function isGated(track) {
  if (!track?.id) return false;

  // Check Zustand subscriber state first (fastest, no DOM access)
  const { isSubscribed } = useUserStore.getState();
  if (isSubscribed) return false;

  // Subscribers & friends bypass completely (cookie = source of truth)
  // NOTE: mystation-auth is NOT a bypass — auth just means "we know who you are"
  // Only subscription and friend cookies grant unlimited music
  const cookies = typeof document !== 'undefined' ? document.cookie : '';
  if (cookies.includes('mystation-sub-flag=')) return false; // Client-readable sub flag
  if (cookies.includes('mystation-sub=')) return false; // httpOnly sub (server sees, client may not)
  if (cookies.includes('mystation-friend=')) return false;

  // Check total free plays
  const { freePlays } = usePlayerStore.getState();

  // Allow replay of already-played tracks
  if (freePlays.includes(track.id)) return false;

  // Block if at limit
  return freePlays.length >= FREE_SONGS_TOTAL;
}

// Backward compat alias
export const isAlbumGated = isGated;
