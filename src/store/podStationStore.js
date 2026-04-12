/**
 * MYSTATION - PodStation Store
 * State management for live streaming
 */

import { create } from 'zustand';

export const usePodStationStore = create((set) => ({
  // Active streams list (for grid)
  streams: [],
  setStreams: (streams) => set({ streams }),

  // Current stream being watched
  currentStream: null,
  setCurrentStream: (stream) => set({ currentStream: stream }),

  // Streaming state (when user is live)
  isStreaming: false,
  setIsStreaming: (val) => set({ isStreaming: val }),

  // Stream settings
  streamTitle: '',
  setStreamTitle: (title) => set({ streamTitle: title }),
  saveReplay: false,
  setSaveReplay: (val) => set({ saveReplay: val }),
  isPaidStream: false,
  setIsPaidStream: (val) => set({ isPaidStream: val }),
  streamPrice: 0,
  setStreamPrice: (price) => set({ streamPrice: price }),
  backgroundTrackId: null,
  setBackgroundTrackId: (id) => set({ backgroundTrackId: id }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-200), msg]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // Viewer count
  viewerCount: 0,
  setViewerCount: (count) => set({ viewerCount: count }),

  // Host live state — persists across navigation
  isHostLive: false,
  hostStreamId: null,
  hostToken: null,
  hostRoomName: null,
  setHostLive: (streamId, token, roomName) => set({
    isHostLive: true,
    hostStreamId: streamId,
    hostToken: token,
    hostRoomName: roomName,
  }),
  endHostLive: () => set({
    isHostLive: false,
    hostStreamId: null,
    hostToken: null,
    hostRoomName: null,
  }),

  // Reset on stream end
  resetStream: () => set({
    currentStream: null,
    isStreaming: false,
    isHostLive: false,
    hostStreamId: null,
    hostToken: null,
    hostRoomName: null,
    streamTitle: '',
    saveReplay: false,
    isPaidStream: false,
    streamPrice: 0,
    backgroundTrackId: null,
    chatMessages: [],
    viewerCount: 0,
  }),
}));
