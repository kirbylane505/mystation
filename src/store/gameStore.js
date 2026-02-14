/**
 * KICKBACK LOUNGE — Game Store (Zustand)
 * Client-side state for game rooms, players, chat, turn timers
 * Integrates with Supabase Realtime for live multiplayer
 */

'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { GAME_TYPES } from '@/lib/games/constants';

export const useGameStore = create((set, get) => ({
  // Room state
  room: null, // { id, code, game_type, status, host_id, settings, created_at }
  players: [], // [{ id, user_id, display_name, seat, team, score, ready, connected }]
  gameState: null, // sanitized game state from server
  myPlayerId: null,

  // Chat
  messages: [], // [{ id, sender, text, emote, timestamp }]

  // Turn timer
  turnTimeRemaining: null,
  turnTimerInterval: null,

  // Lobby
  openRooms: [],
  onlineUsers: [],

  // Stats
  myStats: null, // { wins, losses, streak, rating, gamesPlayed }

  // Connection
  channels: {}, // { game, room, chat }
  connected: false,

  // Loading states
  loading: false,
  error: null,

  // ── Room Actions ──

  createRoom: async (gameType, displayName) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/lounge/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room');

      set({
        room: data.room,
        players: data.players,
        myPlayerId: data.myPlayerId,
        loading: false,
      });

      // Subscribe to realtime channels
      get().subscribeToRoom(data.room.id);

      return data.room;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  joinRoom: async (code, displayName) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/lounge/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join room');

      set({
        room: data.room,
        players: data.players,
        myPlayerId: data.myPlayerId,
        loading: false,
      });

      get().subscribeToRoom(data.room.id);

      return data.room;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  leaveRoom: async () => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      await fetch('/api/lounge/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: myPlayerId }),
      });
    } catch (err) {
      console.error('Leave error:', err);
    }

    get().unsubscribeAll();
    set({
      room: null, players: [], gameState: null, myPlayerId: null,
      messages: [], turnTimeRemaining: null,
    });
  },

  toggleReady: async () => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      const res = await fetch('/api/lounge/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: myPlayerId }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ players: data.players });
      }
    } catch (err) {
      console.error('Ready toggle error:', err);
    }
  },

  startGame: async () => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      const res = await fetch('/api/lounge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: myPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start');

      // Update room status locally (don't wait for broadcast)
      set({ room: { ...get().room, status: 'playing' } });

      // Fetch personalized game state
      get().fetchGameState();
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── Game Actions ──

  submitMove: async (action, data = {}) => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      const res = await fetch('/api/lounge/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          playerId: myPlayerId,
          action,
          ...data,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        set({ error: result.error });
        return;
      }
      // Fetch updated state directly (don't wait for broadcast)
      get().fetchGameState();
    } catch (err) {
      console.error('Move error:', err);
    }
  },

  fetchGameState: async () => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      const res = await fetch(`/api/lounge/state/${room.id}?playerId=${myPlayerId}`);
      const data = await res.json();
      if (res.ok) {
        set({ gameState: data.gameState });
      }
    } catch (err) {
      console.error('State fetch error:', err);
    }
  },

  // ── Chat ──

  sendMessage: async (text) => {
    const { room, myPlayerId } = get();
    if (!room || !text.trim()) return;

    try {
      await fetch('/api/lounge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: myPlayerId, text }),
      });
    } catch (err) {
      console.error('Chat error:', err);
    }
  },

  sendEmote: async (emoteId) => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      await fetch('/api/lounge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: myPlayerId, emote: emoteId }),
      });
    } catch (err) {
      console.error('Emote error:', err);
    }
  },

  // ── Lobby ──

  fetchOpenRooms: async () => {
    try {
      const res = await fetch('/api/lounge/rooms');
      const data = await res.json();
      if (res.ok) {
        set({ openRooms: data.rooms || [] });
      }
    } catch (err) {
      console.error('Fetch rooms error:', err);
    }
  },

  // ── Realtime Subscriptions ──

  subscribeToRoom: (roomId) => {
    if (!supabase) return;

    // Game state channel
    const gameChannel = supabase.channel(`game:${roomId}`)
      .on('broadcast', { event: 'game:state' }, ({ payload }) => {
        set({ gameState: payload.gameState });
      })
      .on('broadcast', { event: 'game:start' }, ({ payload }) => {
        set({
          gameState: payload.gameState,
          room: { ...get().room, status: 'playing' },
        });
      })
      .on('broadcast', { event: 'game:end' }, ({ payload }) => {
        set({
          gameState: payload.gameState,
          room: { ...get().room, status: 'finished' },
        });
      })
      .subscribe();

    // Room presence channel
    const roomChannel = supabase.channel(`room:${roomId}`)
      .on('broadcast', { event: 'room:players' }, ({ payload }) => {
        set({ players: payload.players });
      })
      .on('broadcast', { event: 'room:ready' }, ({ payload }) => {
        set({ players: payload.players });
      })
      .subscribe();

    // Chat channel
    const chatChannel = supabase.channel(`chat:${roomId}`)
      .on('broadcast', { event: 'chat:message' }, ({ payload }) => {
        set(s => ({
          messages: [...s.messages, payload.message].slice(-100),
        }));
      })
      .subscribe();

    set({
      channels: { game: gameChannel, room: roomChannel, chat: chatChannel },
      connected: true,
    });
  },

  subscribeLobby: () => {
    if (!supabase) return;

    const lobbyChannel = supabase.channel('lounge:lobby')
      .on('presence', { event: 'sync' }, () => {
        const state = lobbyChannel.presenceState();
        const users = Object.values(state).flat();
        set({ onlineUsers: users });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await lobbyChannel.track({
            user_id: get().myPlayerId || 'anon-' + Date.now(),
            online_at: new Date().toISOString(),
          });
        }
      });

    set(s => ({ channels: { ...s.channels, lobby: lobbyChannel } }));
  },

  unsubscribeAll: () => {
    const { channels } = get();
    Object.values(channels).forEach(ch => {
      if (ch && typeof ch.unsubscribe === 'function') {
        ch.unsubscribe();
      }
    });
    set({ channels: {}, connected: false });
  },

  // ── Turn Timer ──

  startTurnTimer: (seconds = 30) => {
    const existing = get().turnTimerInterval;
    if (existing) clearInterval(existing);

    set({ turnTimeRemaining: seconds });
    const interval = setInterval(() => {
      const remaining = get().turnTimeRemaining;
      if (remaining <= 0) {
        clearInterval(interval);
        set({ turnTimeRemaining: 0, turnTimerInterval: null });
        return;
      }
      set({ turnTimeRemaining: remaining - 1 });
    }, 1000);

    set({ turnTimerInterval: interval });
  },

  stopTurnTimer: () => {
    const interval = get().turnTimerInterval;
    if (interval) clearInterval(interval);
    set({ turnTimeRemaining: null, turnTimerInterval: null });
  },

  // ── Cleanup ──
  reset: () => {
    get().unsubscribeAll();
    get().stopTurnTimer();
    set({
      room: null, players: [], gameState: null, myPlayerId: null,
      messages: [], turnTimeRemaining: null, openRooms: [],
      onlineUsers: [], loading: false, error: null,
    });
  },
}));
