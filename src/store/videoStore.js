/**
 * VIDEO STORE - View Tracking for MyStation
 * Tracks video views within the app independently from YouTube
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useVideoStore = create(
  persist(
    (set, get) => ({
      // View counts per video ID
      views: {},

      // Currently playing video
      currentVideo: null,

      // Watch history
      watchHistory: [],

      // Track a view (called when video starts playing)
      trackView: (videoId) => {
        const { views, watchHistory } = get();
        const newViews = {
          ...views,
          [videoId]: (views[videoId] || 0) + 1
        };

        // Add to watch history (keep last 50)
        const historyEntry = {
          videoId,
          timestamp: new Date().toISOString()
        };
        const newHistory = [historyEntry, ...watchHistory].slice(0, 50);

        set({ views: newViews, watchHistory: newHistory });
      },

      // Get view count for a video
      getViews: (videoId) => {
        return get().views[videoId] || 0;
      },

      // Get total views across all videos
      getTotalViews: () => {
        const { views } = get();
        return Object.values(views).reduce((sum, count) => sum + count, 0);
      },

      // Get top videos by view count
      getTopVideos: (limit = 5) => {
        const { views } = get();
        return Object.entries(views)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([id, count]) => ({ id, views: count }));
      },

      // Set current video
      setCurrentVideo: (video) => set({ currentVideo: video }),

      // Clear current video
      clearCurrentVideo: () => set({ currentVideo: null }),

      // Get watch history
      getWatchHistory: () => get().watchHistory
    }),
    {
      name: 'mystation-video-views',
      version: 1
    }
  )
);
