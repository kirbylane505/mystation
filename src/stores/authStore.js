/**
 * MYSTATION - Auth Store
 * User authentication state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      // Set user
      setUser: (user) => set({ user, error: null }),

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();

          if (!data.success) {
            throw new Error(data.error || 'Login failed');
          }

          set({ user: data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return { success: false, error: err.message };
        }
      },

      // Signup
      signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });
          const data = await res.json();

          if (!data.success) {
            throw new Error(data.error || 'Signup failed');
          }

          set({ user: data.user, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return { success: false, error: err.message };
        }
      },

      // Logout
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
          console.error('Logout error:', err);
        }
        set({ user: null, error: null });
      },

      // Check session
      checkSession: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/session');
          const data = await res.json();

          if (data.user) {
            set({ user: data.user, isLoading: false });
          } else {
            set({ user: null, isLoading: false });
          }
        } catch (err) {
          set({ user: null, isLoading: false });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Check if logged in
      isLoggedIn: () => !!get().user,
    }),
    {
      name: 'mystation-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
