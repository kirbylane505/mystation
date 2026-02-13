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

      // Vault picks (track IDs user selected at 300pt tier)
      vaultPicks: [],

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
        const allPages = ['/', '/music', '/videos', '/live', '/about', '/merch'];
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

      // Vault pick management
      addVaultPick: (trackId) => {
        const state = get();
        if (state.vaultPicks.includes(trackId)) return;
        set({ vaultPicks: [...state.vaultPicks, trackId] });
      },

      removeVaultPick: (trackId) => {
        set(state => ({ vaultPicks: state.vaultPicks.filter(id => id !== trackId) }));
      },

      clearVaultPicks: () => set({ vaultPicks: [] }),

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
          vaultPicks: [],
        });
      },
    }),
    {
      name: 'mystation-engagement',
      version: 2,
    }
  )
);

// Points system
export const POINTS = {
  play: 10,           // Per track played
  dailyLogin: 25,     // Daily check-in
  streak3: 50,        // 3-day streak bonus
  streak7: 150,       // 7-day streak bonus
  streak30: 500,      // 30-day streak bonus
  reaction: 5,        // Per reaction
  share: 25,          // Sharing a track
  purchase: 100,      // Merch purchase
  donation: 200,      // Per donation (any amount)
  referral: 300,      // Per referral signup
  badge: 75,          // Per badge earned
  albumComplete: 250, // Completing full album
  // Kickback Lounge game points
  gameWin: 50,
  gameLoss: 10,
  dailyGame: 25,
  winStreak3: 100,
  winStreak5: 250,
  perfectBlackjack: 100,
};

// Vault access tiers (points-based)
export const VAULT_TIERS = [
  { name: 'Vault Preview', minPoints: 300, picks: 3, icon: '🔓', description: 'Pick 3 vault songs to stream' },
  { name: 'Full Vault Access', minPoints: 12345, picks: Infinity, icon: '🏆', description: 'Unlimited vault streaming' },
];

// Calculate total points from stats
export const calculatePoints = (stats) => {
  let total = 0;
  total += (stats.totalPlays || 0) * POINTS.play;
  total += (stats.totalReactions || 0) * POINTS.reaction;
  total += (stats.earnedBadges?.length || 0) * POINTS.badge;
  total += (stats.totalDonated > 0 ? 1 : 0) * POINTS.donation;
  total += (stats.currentStreak >= 30 ? POINTS.streak30 : stats.currentStreak >= 7 ? POINTS.streak7 : stats.currentStreak >= 3 ? POINTS.streak3 : 0);
  total += (stats.dailyLogins || 0) * POINTS.dailyLogin;
  total += (stats.shares || 0) * POINTS.share;
  total += (stats.purchases || 0) * POINTS.purchase;
  total += (stats.referralCount || 0) * POINTS.referral;
  return total;
};

// Fan ranks based on points
export const FAN_RANKS = [
  { name: 'New Fan', minPoints: 0, icon: '🌱', color: 'text-gray-400' },
  { name: 'Rising Star', minPoints: 100, icon: '⭐', color: 'text-yellow-400' },
  { name: 'Dedicated', minPoints: 500, icon: '🔥', color: 'text-orange-400' },
  { name: 'Superfan', minPoints: 1500, icon: '💎', color: 'text-blue-400' },
  { name: 'Legend', minPoints: 5000, icon: '👑', color: 'text-purple-400' },
  { name: 'Hall of Fame', minPoints: 15000, icon: '🏆', color: 'text-yellow-500' },
];

export const getFanRank = (points) => {
  let rank = FAN_RANKS[0];
  for (const r of FAN_RANKS) {
    if (points >= r.minPoints) rank = r;
  }
  return rank;
};

// Get vault access level based on points
export const getVaultAccess = (points) => {
  if (points >= 12345) return { level: 'full', picks: Infinity, tier: VAULT_TIERS[1] };
  if (points >= 300) return { level: 'preview', picks: 3, tier: VAULT_TIERS[0] };
  return { level: 'locked', picks: 0, tier: null };
};

// Fake leaderboard data with points
export const LEADERBOARD_DATA = [
  { rank: 1, name: 'ATLFan247', points: 18750, plays: 1247, donated: 250, streak: 45, badges: 12, city: 'Atlanta' },
  { rank: 2, name: 'ChiTownMike', points: 14320, plays: 983, donated: 150, streak: 32, badges: 10, city: 'Chicago' },
  { rank: 3, name: 'ElginOriginal', points: 12890, plays: 876, donated: 200, streak: 28, badges: 9, city: 'Elgin' },
  { rank: 4, name: 'FoundationFam', points: 11540, plays: 754, donated: 500, streak: 21, badges: 11, city: 'Houston' },
  { rank: 5, name: 'IDMGSupporter', points: 9870, plays: 698, donated: 75, streak: 19, badges: 8, city: 'Detroit' },
  { rank: 6, name: 'MusicLover99', points: 8210, plays: 621, donated: 100, streak: 15, badges: 7, city: 'New York' },
  { rank: 7, name: 'RealOneATL', points: 7340, plays: 589, donated: 50, streak: 14, badges: 6, city: 'Atlanta' },
  { rank: 8, name: 'DreamChaser', points: 6120, plays: 534, donated: 25, streak: 12, badges: 5, city: 'Miami' },
  { rank: 9, name: 'PageFam', points: 5430, plays: 487, donated: 80, streak: 10, badges: 6, city: 'Memphis' },
  { rank: 10, name: 'NewFan2026', points: 4210, plays: 423, donated: 15, streak: 7, badges: 4, city: 'Dallas' },
];
