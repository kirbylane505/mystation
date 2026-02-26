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

  // Album gate — tracks played per album for non-subscribers (session only, not persisted)
  albumPlays: {}, // { albumId: [trackId1, trackId2] }

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

  // Show subscribe modal
  openSubscribeModal: (pendingTrack = null) => set({
    showSubscribeModal: true,
    pendingTrack
  }),

  closeSubscribeModal: () => set({
    showSubscribeModal: false,
    pendingTrack: null
  }),

  setShowAccountWall: (show) => set({ showAccountWall: show }),

  // Album gate helpers
  recordAlbumPlay: (track) => {
    if (!track?.albumId) return;
    set((state) => {
      const plays = { ...state.albumPlays };
      const albumTracks = plays[track.albumId] || [];
      if (!albumTracks.includes(track.id)) {
        plays[track.albumId] = [...albumTracks, track.id];
      }
      return { albumPlays: plays };
    });
  },

  initAlbumPlays: () => {
    if (typeof document === 'undefined') return;
    try {
      const match = document.cookie.match(/ms-album-plays=([^;]+)/);
      if (match) {
        const plays = JSON.parse(decodeURIComponent(match[1]));
        set({ albumPlays: plays });
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

// Check if a track is blocked by the album gate
// Returns true if BLOCKED, false if allowed
const FREE_SONGS_PER_ALBUM = 2;
const EXEMPT_ALBUM_IDS = ['singles-2026'];

export function isAlbumGated(track) {
  if (!track?.albumId) return false;
  if (EXEMPT_ALBUM_IDS.includes(track.albumId)) return false;

  // Subscribers & friends bypass completely
  const cookies = typeof document !== 'undefined' ? document.cookie : '';
  if (cookies.includes('mystation-sub=')) return false;
  if (cookies.includes('mystation-friend=')) return false;
  if (cookies.includes('mystation-auth=')) return false;

  // Check album plays
  const { albumPlays } = usePlayerStore.getState();
  const played = albumPlays[track.albumId] || [];

  // Allow replay of already-played tracks
  if (played.includes(track.id)) return false;

  // Block if at limit
  return played.length >= FREE_SONGS_PER_ALBUM;
}
