/**
 * MYSTATION — Profile State Management
 */

import { create } from 'zustand';

export const useProfileStore = create((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        set({ loading: false, error: 'not_authenticated' });
        throw new Error('not_authenticated');
      }
      const data = await res.json();
      set({ profile: data.profile, loading: false });
      return data.profile;
    } catch (err) {
      set({ error: err.message || 'Failed to load profile', loading: false });
      if (err.message === 'not_authenticated') throw err;
      return null;
    }
  },

  updateProfile: async (updates) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.profile) {
        set({ profile: data.profile });
        return { success: true, profile: data.profile };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error' };
    }
  },

  checkUsername: async (username) => {
    try {
      const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      return data.available;
    } catch {
      return false;
    }
  },

  toggleFollow: async (targetUserId) => {
    try {
      const res = await fetch('/api/profile/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { error: 'Network error' };
    }
  },

  clearProfile: () => set({ profile: null, loading: false, error: null }),
}));
