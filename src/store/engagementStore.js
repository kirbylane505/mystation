/**
 * MYSTATION - Engagement Store
 * Handles streaks, badges, reactions, leaderboard, unlocks, and gamification
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Badge definitions
export const BADGES = {
  // Streak badges
  streak3: { id: 'streak3', name: '3-Day Streak', icon: '🔥', description: 'Listened 3 days in a row', requirement: 'streak:3' },
  streak7: { id: 'streak7', name: 'Week Warrior', icon: '🔥', description: 'Listened 7 days straight', requirement: 'streak:7' },
  streak30: { id: 'streak30', name: 'Monthly Maven', icon: '💎', description: '30-day listening streak', requirement: 'streak:30' },

  // Listening badges
  firstPlay: { id: 'firstPlay', name: 'First Play', icon: '🎵', description: 'Played your first track', requirement: 'plays:1' },
  dedicated: { id: 'dedicated', name: 'Dedicated Fan', icon: '🎧', description: 'Played 50 tracks', requirement: 'plays:50' },
  superfan: { id: 'superfan', name: 'Superfan', icon: '⭐', description: 'Played 200 tracks', requirement: 'plays:200' },

  // Album badges
  cindysSon: { id: 'cindysSon', name: "Cindy's Son Certified", icon: '👑', description: 'Listened to full album', requirement: 'album:cindys-son' },

  // Donation badges
  supporter: { id: 'supporter', name: 'Foundation Supporter', icon: '💙', description: 'Made your first donation', requirement: 'donated:1' },
  champion: { id: 'champion', name: 'Foundation Champion', icon: '🏆', description: 'Donated $50+', requirement: 'donated:50' },

  // Special badges
  earlyBird: { id: 'earlyBird', name: 'Early Bird', icon: '🌅', description: 'One of the first 100 users', requirement: 'special:early' },
  explorer: { id: 'explorer', name: 'Explorer', icon: '🗺️', description: 'Visited every page', requirement: 'pages:all' },
  reactor: { id: 'reactor', name: 'Reactor', icon: '⚡', description: 'Reacted to 10 songs', requirement: 'reactions:10' },
};

// Reaction types
export const REACTIONS = {
  fire: { id: 'fire', emoji: '🔥', label: 'Fire' },
  real: { id: 'real', emoji: '💯', label: 'Real' },
  feels: { id: 'feels', emoji: '😭', label: 'In My Feels' },
  classic: { id: 'classic', emoji: '👑', label: 'Classic' },
};

// Unlockable content
export const UNLOCKS = {
  acapella: { id: 'acapella', name: 'Exclusive Acapellas', requirement: 'plays:10', content: 'Access to vocal-only tracks' },
  studioSession: { id: 'studioSession', name: 'Studio Session Video', requirement: 'donated:5', content: 'Behind the scenes footage' },
  unreleased: { id: 'unreleased', name: 'Unreleased Track', requirement: 'referrals:3', content: 'Exclusive vault track' },
  behindTrack: { id: 'behindTrack', name: 'Behind The Track', requirement: 'streak:5', content: 'Story behind each song' },
};

// Spin wheel prizes
export const SPIN_PRIZES = [
  { id: 'bonus', label: 'Bonus Content', icon: '🎁', weight: 30 },
  { id: 'shoutout', label: 'Shoutout Entry', icon: '📣', weight: 25 },
  { id: 'discount', label: '10% Merch Code', icon: '🏷️', weight: 20 },
  { id: 'lottery', label: 'Foundation Lottery', icon: '🎟️', weight: 15 },
  { id: 'exclusive', label: 'Exclusive Track', icon: '💿', weight: 8 },
  { id: 'jackpot', label: 'VIP Access!', icon: '👑', weight: 2 },
];

// Cities for activity feed
const CITIES = ['Atlanta', 'Chicago', 'New York', 'Los Angeles', 'Houston', 'Detroit', 'Miami', 'Elgin', 'Memphis', 'Dallas'];

export const useEngagementStore = create(
  persist(
    (set, get) => ({
      // User stats
      totalPlays: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayDate: null,
      totalDonated: 0,
      referralCount: 0,
      pagesVisited: [],

      // Badges
      earnedBadges: [],

      // Reactions (trackId -> reaction type)
      trackReactions: {},
      totalReactions: 0,

      // Album completion tracking
      albumProgress: {},

      // Unlocked content
      unlockedContent: [],

      // Daily spin
      lastSpinDate: null,
      spinHistory: [],

      // Activity feed (simulated for now)
      activityFeed: [],

      // Leaderboard position
      leaderboardPosition: null,

      // Record a play
      recordPlay: (trackId, albumId) => {
        const state = get();
        const today = new Date().toDateString();
        const lastPlay = state.lastPlayDate;

        let newStreak = state.currentStreak;

        // Check streak
        if (lastPlay) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastPlay === today) {
            // Same day, no streak change
          } else if (lastPlay === yesterday.toDateString()) {
            // Consecutive day, increase streak
            newStreak += 1;
          } else {
            // Streak broken
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        // Track album progress
        const newAlbumProgress = { ...state.albumProgress };
        if (albumId) {
          if (!newAlbumProgress[albumId]) {
            newAlbumProgress[albumId] = [];
          }
          if (!newAlbumProgress[albumId].includes(trackId)) {
            newAlbumProgress[albumId].push(trackId);
          }
        }

        set({
          totalPlays: state.totalPlays + 1,
          currentStreak: newStreak,
          longestStreak: Math.max(state.longestStreak, newStreak),
          lastPlayDate: today,
          albumProgress: newAlbumProgress,
        });

        // Check for new badges
        get().checkBadges();

        // Add to activity feed
        get().addActivity('play', trackId);
      },

      // Add reaction to track
      addReaction: (trackId, reactionType) => {
        const state = get();
        const newReactions = { ...state.trackReactions };

        // Toggle reaction
        if (newReactions[trackId] === reactionType) {
          delete newReactions[trackId];
          set({
            trackReactions: newReactions,
            totalReactions: state.totalReactions - 1
          });
        } else {
          newReactions[trackId] = reactionType;
          set({
            trackReactions: newReactions,
            totalReactions: state.totalReactions + 1
          });
        }

        get().checkBadges();
      },

      // Record donation
      recordDonation: (amount) => {
        set(state => ({
          totalDonated: state.totalDonated + amount
        }));
        get().checkBadges();
        get().addActivity('donation', amount);
      },

      // Record page visit
      visitPage: (pageName) => {
        const state = get();
        if (!state.pagesVisited.includes(pageName)) {
          set({ pagesVisited: [...state.pagesVisited, pageName] });
          get().checkBadges();
        }
      },

      // Check and award badges
      checkBadges: () => {
        const state = get();
        const newBadges = [...state.earnedBadges];

        // Check streak badges
        if (state.currentStreak >= 3 && !newBadges.includes('streak3')) newBadges.push('streak3');
        if (state.currentStreak >= 7 && !newBadges.includes('streak7')) newBadges.push('streak7');
        if (state.currentStreak >= 30 && !newBadges.includes('streak30')) newBadges.push('streak30');

        // Check play badges
        if (state.totalPlays >= 1 && !newBadges.includes('firstPlay')) newBadges.push('firstPlay');
        if (state.totalPlays >= 50 && !newBadges.includes('dedicated')) newBadges.push('dedicated');
        if (state.totalPlays >= 200 && !newBadges.includes('superfan')) newBadges.push('superfan');

        // Check donation badges
        if (state.totalDonated >= 1 && !newBadges.includes('supporter')) newBadges.push('supporter');
        if (state.totalDonated >= 50 && !newBadges.includes('champion')) newBadges.push('champion');

        // Check reaction badge
        if (state.totalReactions >= 10 && !newBadges.includes('reactor')) newBadges.push('reactor');

        // Check album completion
        if (state.albumProgress['cindys-son']?.length >= 23 && !newBadges.includes('cindysSon')) {
          newBadges.push('cindysSon');
        }

        // Check pages visited
        const allPages = ['/', '/music', '/videos', '/live', '/about', '/name-this-song'];
        if (allPages.every(p => state.pagesVisited.includes(p)) && !newBadges.includes('explorer')) {
          newBadges.push('explorer');
        }

        // Check unlocks
        const newUnlocks = [...state.unlockedContent];
        if (state.totalPlays >= 10 && !newUnlocks.includes('acapella')) newUnlocks.push('acapella');
        if (state.totalDonated >= 5 && !newUnlocks.includes('studioSession')) newUnlocks.push('studioSession');
        if (state.referralCount >= 3 && !newUnlocks.includes('unreleased')) newUnlocks.push('unreleased');
        if (state.currentStreak >= 5 && !newUnlocks.includes('behindTrack')) newUnlocks.push('behindTrack');

        set({
          earnedBadges: newBadges,
          unlockedContent: newUnlocks
        });
      },

      // Daily spin
      canSpin: () => {
        const state = get();
        if (!state.lastSpinDate) return true;
        const today = new Date().toDateString();
        return state.lastSpinDate !== today;
      },

      spin: () => {
        const state = get();
        if (!get().canSpin()) return null;

        // Weighted random selection
        const totalWeight = SPIN_PRIZES.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = SPIN_PRIZES[0];

        for (const prize of SPIN_PRIZES) {
          random -= prize.weight;
          if (random <= 0) {
            selectedPrize = prize;
            break;
          }
        }

        set({
          lastSpinDate: new Date().toDateString(),
          spinHistory: [...state.spinHistory, { prize: selectedPrize.id, date: new Date().toISOString() }]
        });

        return selectedPrize;
      },

      // Activity feed
      addActivity: (type, data) => {
        const state = get();
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];

        const activity = {
          id: Date.now(),
          type,
          data,
          city,
          timestamp: new Date().toISOString()
        };

        set({
          activityFeed: [activity, ...state.activityFeed].slice(0, 50)
        });
      },

      // Generate fake activity for demo
      generateFakeActivity: () => {
        const types = ['play', 'donation', 'reaction'];
        const type = types[Math.floor(Math.random() * types.length)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];

        let data;
        if (type === 'play') {
          data = Math.floor(Math.random() * 23) + 1; // Track ID
        } else if (type === 'donation') {
          data = [5, 10, 25, 50, 100][Math.floor(Math.random() * 5)];
        } else {
          data = { trackId: Math.floor(Math.random() * 23) + 1, reaction: Object.keys(REACTIONS)[Math.floor(Math.random() * 4)] };
        }

        const activity = {
          id: Date.now() + Math.random(),
          type,
          data,
          city,
          timestamp: new Date().toISOString(),
          isSimulated: true
        };

        set(state => ({
          activityFeed: [activity, ...state.activityFeed].slice(0, 50)
        }));
      },

      // Reset for testing
      resetEngagement: () => {
        set({
          totalPlays: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastPlayDate: null,
          totalDonated: 0,
          referralCount: 0,
          pagesVisited: [],
          earnedBadges: [],
          trackReactions: {},
          totalReactions: 0,
          albumProgress: {},
          unlockedContent: [],
          lastSpinDate: null,
          spinHistory: [],
          activityFeed: [],
        });
      },
    }),
    {
      name: 'mystation-engagement',
    }
  )
);

// Fake leaderboard data
export const LEADERBOARD_DATA = [
  { rank: 1, name: 'ATLFan247', plays: 1247, donated: 250, streak: 45, badges: 12 },
  { rank: 2, name: 'ChiTownMike', plays: 983, donated: 150, streak: 32, badges: 10 },
  { rank: 3, name: 'ElginOriginal', plays: 876, donated: 200, streak: 28, badges: 9 },
  { rank: 4, name: 'FoundationFam', plays: 754, donated: 500, streak: 21, badges: 11 },
  { rank: 5, name: 'IDMGSupporter', plays: 698, donated: 75, streak: 19, badges: 8 },
  { rank: 6, name: 'MusicLover99', plays: 621, donated: 100, streak: 15, badges: 7 },
  { rank: 7, name: 'RealOneATL', plays: 589, donated: 50, streak: 14, badges: 6 },
  { rank: 8, name: 'DreamChaser', plays: 534, donated: 25, streak: 12, badges: 5 },
  { rank: 9, name: 'PageFam', plays: 487, donated: 80, streak: 10, badges: 6 },
  { rank: 10, name: 'NewFan2026', plays: 423, donated: 15, streak: 7, badges: 4 },
];
