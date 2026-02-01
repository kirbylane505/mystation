/**
 * MYSTATION - Audio Player State Management
 * Using Zustand for simple, powerful state
 * Includes subscription & play tracking for engagement
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePlayerStore = create((set, get) => ({
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
  repeat: 'off', // 'off', 'all', 'one'

  // Engagement tracking
  playCount: 0,
  uniquePlaysThisSession: [],
  lastPlayedTrack: null,
  showSubscribeModal: false,
  pendingTrack: null, // Track waiting to play after subscription

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

  // Play count management for subscription wall
  incrementPlayCount: (trackId) => {
    const { uniquePlaysThisSession } = get();
    // Only count unique track plays
    if (!uniquePlaysThisSession.includes(trackId)) {
      set((state) => ({
        playCount: state.playCount + 1,
        uniquePlaysThisSession: [...state.uniquePlaysThisSession, trackId]
      }));
    }
  },

  // Check if can play (3 free plays allowed)
  canPlay: () => {
    const { playCount } = get();
    return playCount < 3;
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
}));

// User state with persistence
export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isSubscribed: false,
      supporterTier: 'free', // 'free', 'supporter', 'vip', 'foundation'
      favorites: [],
      email: '',

      setUser: (user) => set({
        user,
        isLoggedIn: !!user,
        isSubscribed: user?.isSubscribed || false,
        supporterTier: user?.tier || 'free'
      }),

      subscribe: (email) => set({
        isSubscribed: true,
        isLoggedIn: true,
        email,
        supporterTier: 'supporter',
        user: { email, isSubscribed: true, tier: 'supporter' }
      }),

      logout: () => set({
        user: null,
        isLoggedIn: false,
        isSubscribed: false,
        supporterTier: 'free',
        email: ''
      }),

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
        supporterTier: state.supporterTier
      })
    }
  )
);
