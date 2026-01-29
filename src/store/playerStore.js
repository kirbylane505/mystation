/**
 * MYSTATION - Audio Player State Management
 * Using Zustand for simple, powerful state
 */

import { create } from 'zustand';

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

  // Actions
  setTrack: (track) => set({
    currentTrack: track,
    progress: 0,
    isPlaying: true
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

  // Queue management
  setQueue: (tracks, startIndex = 0) => set({
    queue: tracks,
    queueIndex: startIndex,
    currentTrack: tracks[startIndex],
    isPlaying: true
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

    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      progress: 0
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
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      progress: 0
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

// Donation state
export const useDonationStore = create((set) => ({
  donationAmount: null,
  showDonationModal: false,
  recentDonations: [],
  totalRaised: 0,

  setDonationAmount: (amount) => set({ donationAmount: amount }),
  openDonationModal: () => set({ showDonationModal: true }),
  closeDonationModal: () => set({ showDonationModal: false }),

  addDonation: (donation) => set((state) => ({
    recentDonations: [donation, ...state.recentDonations].slice(0, 10),
    totalRaised: state.totalRaised + donation.amount
  })),
}));

// User state
export const useUserStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  supporterTier: 'free', // 'free', 'supporter', 'vip', 'foundation'
  favorites: [],

  setUser: (user) => set({
    user,
    isLoggedIn: !!user,
    supporterTier: user?.tier || 'free'
  }),

  logout: () => set({
    user: null,
    isLoggedIn: false,
    supporterTier: 'free'
  }),

  toggleFavorite: (trackId) => set((state) => ({
    favorites: state.favorites.includes(trackId)
      ? state.favorites.filter(id => id !== trackId)
      : [...state.favorites, trackId]
  })),
}));
