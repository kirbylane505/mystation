/**
 * MYSTATION - Playlist Store
 * Create and manage playlists mixing MyStation + Spotify tracks
 * Persists to localStorage with zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePlaylistStore = create(
  persist(
    (set, get) => ({
      playlists: [],

      // Create a new playlist
      createPlaylist: (name, description = '') => {
        const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const playlist = {
          id,
          name,
          description,
          tracks: [],
          coverArt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ playlists: [playlist, ...state.playlists] }));
        return id;
      },

      // Delete a playlist
      deletePlaylist: (playlistId) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
      },

      // Rename a playlist
      renamePlaylist: (playlistId, name) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId ? { ...p, name, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      // Add a track to a playlist
      // track shape: { id, spotifyId, title, artist, album, albumArt, previewUrl, audioSrc, source, duration }
      addTrack: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            // Prevent duplicates
            const key = track.source === 'spotify' ? track.spotifyId : track.id;
            const exists = p.tracks.some((t) =>
              t.source === 'spotify' ? t.spotifyId === key : t.id === key
            );
            if (exists) return p;
            const newTracks = [...p.tracks, { ...track, addedAt: new Date().toISOString() }];
            return {
              ...p,
              tracks: newTracks,
              coverArt: p.coverArt || track.albumArt || null,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      // Remove a track from a playlist
      removeTrack: (playlistId, trackIndex) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const newTracks = p.tracks.filter((_, i) => i !== trackIndex);
            return { ...p, tracks: newTracks, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      // Reorder tracks in a playlist
      reorderTrack: (playlistId, fromIndex, toIndex) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const newTracks = [...p.tracks];
            const [moved] = newTracks.splice(fromIndex, 1);
            newTracks.splice(toIndex, 0, moved);
            return { ...p, tracks: newTracks, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      // Get a single playlist
      getPlaylist: (playlistId) => {
        return get().playlists.find((p) => p.id === playlistId) || null;
      },
    }),
    {
      name: 'mystation-playlists-v1',
    }
  )
);

export default usePlaylistStore;
