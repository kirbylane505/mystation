/**
 * MYSTATION - Creator Station State Management
 * Handles station setup, products, playlists, and creator data
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStationStore = create(
  persist(
    (set, get) => ({
      // Station basics
      station: null,
      isCreator: false,
      setupStep: 0, // 0=not started, 1=category, 2=profile, 3=products, 4=playlists, 5=complete

      // Station data structure
      stationData: {
        username: '',
        displayName: '',
        category: null,
        bio: '',
        avatar: '',
        coverImage: '',
        socialLinks: {
          instagram: '',
          twitter: '',
          tiktok: '',
          youtube: '',
          website: ''
        },
        products: [],
        playlists: [],
        merch: [],
        tips: {
          enabled: false,
          amounts: [5, 10, 25, 50]
        },
        theme: {
          primaryColor: '#3B82F6',
          accentColor: '#8B5CF6'
        },
        stats: {
          followers: 0,
          totalSales: 0,
          totalStreams: 0,
          totalTips: 0
        }
      },

      // Actions
      startSetup: () => set({ setupStep: 1 }),

      setCategory: (category) => set((state) => ({
        stationData: { ...state.stationData, category },
        setupStep: 2
      })),

      setProfile: (profile) => set((state) => ({
        stationData: {
          ...state.stationData,
          username: profile.username,
          displayName: profile.displayName,
          bio: profile.bio,
          avatar: profile.avatar || state.stationData.avatar,
          socialLinks: { ...state.stationData.socialLinks, ...profile.socialLinks }
        },
        setupStep: 3
      })),

      addProduct: (product) => set((state) => ({
        stationData: {
          ...state.stationData,
          products: [...state.stationData.products, {
            id: Date.now(),
            ...product,
            createdAt: new Date().toISOString()
          }]
        }
      })),

      updateProduct: (productId, updates) => set((state) => ({
        stationData: {
          ...state.stationData,
          products: state.stationData.products.map(p =>
            p.id === productId ? { ...p, ...updates } : p
          )
        }
      })),

      removeProduct: (productId) => set((state) => ({
        stationData: {
          ...state.stationData,
          products: state.stationData.products.filter(p => p.id !== productId)
        }
      })),

      addPlaylist: (playlist) => set((state) => ({
        stationData: {
          ...state.stationData,
          playlists: [...state.stationData.playlists, {
            id: Date.now(),
            ...playlist,
            tracks: playlist.tracks || [],
            createdAt: new Date().toISOString()
          }]
        }
      })),

      updatePlaylist: (playlistId, updates) => set((state) => ({
        stationData: {
          ...state.stationData,
          playlists: state.stationData.playlists.map(p =>
            p.id === playlistId ? { ...p, ...updates } : p
          )
        }
      })),

      removePlaylist: (playlistId) => set((state) => ({
        stationData: {
          ...state.stationData,
          playlists: state.stationData.playlists.filter(p => p.id !== playlistId)
        }
      })),

      addTrackToPlaylist: (playlistId, track) => set((state) => ({
        stationData: {
          ...state.stationData,
          playlists: state.stationData.playlists.map(p =>
            p.id === playlistId
              ? { ...p, tracks: [...p.tracks, { id: Date.now(), ...track }] }
              : p
          )
        }
      })),

      setTipsEnabled: (enabled) => set((state) => ({
        stationData: {
          ...state.stationData,
          tips: { ...state.stationData.tips, enabled }
        }
      })),

      setTheme: (theme) => set((state) => ({
        stationData: {
          ...state.stationData,
          theme: { ...state.stationData.theme, ...theme }
        }
      })),

      completeSetup: () => set((state) => ({
        setupStep: 5,
        isCreator: true,
        station: { ...state.stationData, isLive: true }
      })),

      goToStep: (step) => set({ setupStep: step }),

      // Reset station (for testing)
      resetStation: () => set({
        station: null,
        isCreator: false,
        setupStep: 0,
        stationData: {
          username: '',
          displayName: '',
          category: null,
          bio: '',
          avatar: '',
          coverImage: '',
          socialLinks: {
            instagram: '',
            twitter: '',
            tiktok: '',
            youtube: '',
            website: ''
          },
          products: [],
          playlists: [],
          merch: [],
          tips: {
            enabled: false,
            amounts: [5, 10, 25, 50]
          },
          theme: {
            primaryColor: '#3B82F6',
            accentColor: '#8B5CF6'
          },
          stats: {
            followers: 0,
            totalSales: 0,
            totalStreams: 0,
            totalTips: 0
          }
        }
      })
    }),
    {
      name: 'mystation-creator',
      partialize: (state) => ({
        station: state.station,
        isCreator: state.isCreator,
        setupStep: state.setupStep,
        stationData: state.stationData
      })
    }
  )
);
