/**
 * MYSTATION - Loyalty System Store
 * Track streams, streaks, and unlock vault access
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Loyalty Tiers
export const LOYALTY_TIERS = {
  NEWCOMER: { name: 'Newcomer', days: 0, color: 'gray', unlocks: [], rewards: [] },
  SUPPORTER: { name: 'Supporter', days: 30, color: 'blue', unlocks: ['behind-the-scenes'], rewards: ['Exclusive wallpapers'] },
  DEDICATED: { name: 'Dedicated', days: 60, color: 'purple', unlocks: ['behind-the-scenes', 'snippets'], rewards: ['Exclusive wallpapers', 'Early access to drops'] },
  VAULT_MEMBER: {
    name: 'Vault Member',
    days: 90,
    color: 'gold',
    unlocks: ['behind-the-scenes', 'snippets', 'vault'],
    rewards: [
      'Full Vault Access',
      'Free concert/event passes',
      'Exclusive merch drops',
      'Meet & greet priority',
      'Free signed merchandise',
      'VIP at Love on the Lawn Festival',
      'Direct line to Mike Page'
    ]
  },
};

// Reward details for 90-day members
export const VAULT_REWARDS = [
  {
    id: 'concert-pass',
    name: 'Free Concert Pass',
    description: 'Free entry to any Mike Page live show or event',
    icon: 'ticket',
    claimed: false,
  },
  {
    id: 'lotl-vip',
    name: 'Love on the Lawn VIP',
    description: 'VIP access to the annual Love on the Lawn Festival',
    icon: 'crown',
    claimed: false,
  },
  {
    id: 'signed-merch',
    name: 'Signed Merchandise',
    description: 'Free signed item from the IDMG collection',
    icon: 'gift',
    claimed: false,
  },
  {
    id: 'meet-greet',
    name: 'Meet & Greet Priority',
    description: 'First in line for all meet & greet opportunities',
    icon: 'users',
    claimed: false,
  },
  {
    id: 'exclusive-drops',
    name: 'Exclusive Merch Drops',
    description: 'Access to limited edition items before anyone else',
    icon: 'shopping-bag',
    claimed: false,
  },
  {
    id: 'direct-line',
    name: 'Direct Line',
    description: 'Personal contact for questions, requests, and updates',
    icon: 'phone',
    claimed: false,
  },
];

// Get tier based on streak days
export const getTier = (streakDays) => {
  if (streakDays >= 90) return LOYALTY_TIERS.VAULT_MEMBER;
  if (streakDays >= 60) return LOYALTY_TIERS.DEDICATED;
  if (streakDays >= 30) return LOYALTY_TIERS.SUPPORTER;
  return LOYALTY_TIERS.NEWCOMER;
};

// Check if date is today
const isToday = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Check if date is yesterday
const isYesterday = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const useLoyaltyStore = create(
  persist(
    (set, get) => ({
      // User data
      oderId: null,
      username: null,
      email: null,

      // Streaming stats
      totalPlays: 0,
      totalMinutes: 0,
      uniqueTracks: [],

      // Streak tracking
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: null,
      streakHistory: [], // Array of dates played

      // Tier status
      currentTier: LOYALTY_TIERS.NEWCOMER,
      vaultUnlocked: false,

      // Leaderboard rank (updated from server)
      leaderboardRank: null,
      isTop100: false,

      // Register a play - call this when a track plays
      registerPlay: (trackId, durationSeconds = 0) => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const lastDate = state.lastPlayDate;

        let newStreak = state.currentStreak;
        let streakHistory = [...state.streakHistory];

        // Check streak logic
        if (!isToday(lastDate)) {
          if (isYesterday(lastDate)) {
            // Continuing streak
            newStreak = state.currentStreak + 1;
          } else if (lastDate === null) {
            // First ever play
            newStreak = 1;
          } else {
            // Streak broken - reset
            newStreak = 1;
          }
          streakHistory.push(today);
        }

        // Track unique tracks
        const uniqueTracks = state.uniqueTracks.includes(trackId)
          ? state.uniqueTracks
          : [...state.uniqueTracks, trackId];

        // Calculate new tier
        const newTier = getTier(newStreak);
        const vaultUnlocked = newStreak >= 90 && state.isTop100;

        set({
          totalPlays: state.totalPlays + 1,
          totalMinutes: state.totalMinutes + Math.floor(durationSeconds / 60),
          uniqueTracks,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, state.longestStreak),
          lastPlayDate: today,
          streakHistory,
          currentTier: newTier,
          vaultUnlocked,
        });

        // Return updated stats for potential API sync
        return {
          totalPlays: state.totalPlays + 1,
          currentStreak: newStreak,
          tier: newTier.name,
        };
      },

      // Check if streak is still active (called on app load)
      checkStreak: () => {
        const state = get();
        const lastDate = state.lastPlayDate;

        // If last play wasn't today or yesterday, streak is broken
        if (lastDate && !isToday(lastDate) && !isYesterday(lastDate)) {
          set({
            currentStreak: 0,
            currentTier: LOYALTY_TIERS.NEWCOMER,
            vaultUnlocked: false,
          });
        }
      },

      // Update leaderboard rank (from server)
      updateLeaderboardRank: (rank, isTop100) => {
        const state = get();
        const vaultUnlocked = state.currentStreak >= 90 && isTop100;
        set({
          leaderboardRank: rank,
          isTop100,
          vaultUnlocked,
        });
      },

      // Set user info
      setUser: (userId, username, email) => {
        set({ userId, username, email });
      },

      // Check vault access
      canAccessVault: () => {
        const state = get();
        return state.currentStreak >= 90 && state.isTop100;
      },

      // Check content unlock
      canAccess: (contentType) => {
        const state = get();
        return state.currentTier.unlocks.includes(contentType);
      },

      // Get progress to next tier
      getProgress: () => {
        const state = get();
        const streak = state.currentStreak;

        if (streak >= 90) {
          return { current: streak, target: 90, percent: 100, nextTier: null };
        }
        if (streak >= 60) {
          return { current: streak, target: 90, percent: (streak / 90) * 100, nextTier: LOYALTY_TIERS.VAULT_MEMBER };
        }
        if (streak >= 30) {
          return { current: streak, target: 60, percent: (streak / 60) * 100, nextTier: LOYALTY_TIERS.DEDICATED };
        }
        return { current: streak, target: 30, percent: (streak / 30) * 100, nextTier: LOYALTY_TIERS.SUPPORTER };
      },

      // Reset (for testing)
      reset: () => {
        set({
          totalPlays: 0,
          totalMinutes: 0,
          uniqueTracks: [],
          currentStreak: 0,
          longestStreak: 0,
          lastPlayDate: null,
          streakHistory: [],
          currentTier: LOYALTY_TIERS.NEWCOMER,
          vaultUnlocked: false,
          leaderboardRank: null,
          isTop100: false,
        });
      },
    }),
    {
      name: 'mystation-loyalty',
    }
  )
);
