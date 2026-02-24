/**
 * KICKBACK LOUNGE — Game Store (Zustand)
 * Client-side state for game rooms, players, chat, turn timers
 * Integrates with Supabase Realtime for live multiplayer
 */

'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { GAME_TYPES } from '@/lib/games/constants';
import { getPlayerId, getPlayerName } from '@/lib/playerId';

export const useGameStore = create((set, get) => ({
  // Room state
  room: null, // { id, code, game_type, status, host_id, settings, created_at }
  players: [], // [{ id, user_id, display_name, seat, team, score, ready, connected }]
  gameState: null, // sanitized game state from server
  myPlayerId: null,

  // Chat
  messages: [], // [{ id, sender, text, emote, timestamp, reactions }]
  typingUsers: {}, // { [userId]: lastTypingTimestamp }

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
      const persistentId = getPlayerId();
      const name = displayName || getPlayerName();
      const res = await fetch('/api/lounge/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, displayName: name, playerId: persistentId }),
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
      const persistentId = getPlayerId();
      const name = displayName || getPlayerName();
      const res = await fetch('/api/lounge/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, displayName: name, playerId: persistentId }),
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
      // silently handle leave errors
    }

    get().unsubscribeAll();
    set({
      room: null, players: [], gameState: null, myPlayerId: null,
      messages: [], turnTimeRemaining: null, isSpectator: false,
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
      // silently handle ready toggle errors
    }
  },

  startGame: async (options = {}) => {
    const { room, myPlayerId } = get();
    if (!room) return;

    try {
      const res = await fetch('/api/lounge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, playerId: myPlayerId, withBots: options.withBots }),
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
      // State arrives via personalized broadcast — no need to fetch
    } catch (err) {
      // silently handle move errors
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
      // silently handle state fetch errors
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
      // silently handle chat errors
    }
  },

  sendTypingIndicator: () => {
    const { channels, myPlayerId } = get();
    if (channels.chat) {
      channels.chat.send({
        type: 'broadcast',
        event: 'chat:typing',
        payload: { userId: myPlayerId },
      });
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
      // silently handle emote errors
    }
  },

  // ── Spectator ──

  spectateRoom: async (roomId, displayName) => {
    const persistentId = getPlayerId();
    const name = displayName || getPlayerName();
    set({ loading: true, error: null });

    try {
      const res = await fetch('/api/lounge/spectate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId: persistentId, displayName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to spectate');

      set({
        room: data.room,
        players: data.players,
        myPlayerId: persistentId,
        gameState: data.gameState,
        isSpectator: true,
        loading: false,
      });

      get().subscribeToRoom(roomId);
      return data.room;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  isSpectator: false,

  // ── Reconnection ──

  reconnectToRoom: async (roomId) => {
    const playerId = getPlayerId();
    if (!playerId || !roomId) return null;

    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/lounge/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, playerId }),
      });
      const data = await res.json();
      if (res.ok && data.room) {
        set({
          room: data.room,
          players: data.players,
          myPlayerId: playerId,
          loading: false,
        });
        get().subscribeToRoom(roomId);
        if (data.room.status === 'playing') {
          get().fetchGameState();
        }
        return data.room;
      }
      set({ loading: false });
      return null;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
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
      // silently handle fetch rooms errors
    }
  },

  // ── Realtime Subscriptions ──

  subscribeToRoom: (roomId) => {
    if (!supabase) return;

    // Game state channel (personalized + generic)
    const myId = get().myPlayerId;
    const gameChannel = supabase.channel(`game:${roomId}`)
      // Personalized state (priority — for games with hidden info)
      .on('broadcast', { event: `game:state:${myId}` }, ({ payload }) => {
        set({ gameState: payload.gameState });
      })
      .on('broadcast', { event: `game:end:${myId}` }, ({ payload }) => {
        set({
          gameState: payload.gameState,
          room: { ...get().room, status: 'finished' },
        });
      })
      // Generic broadcast (for games without hidden info + spectators)
      .on('broadcast', { event: 'game:state' }, ({ payload }) => {
        // Only use generic if we didn't get a personalized event
        const room = get().room;
        const hiddenInfoGames = ['blackjack', 'spades', 'dominoes', 'quiz'];
        if (!hiddenInfoGames.includes(room?.game_type)) {
          set({ gameState: payload.gameState });
        }
      })
      .on('broadcast', { event: 'game:start' }, ({ payload }) => {
        set({
          gameState: payload.gameState,
          room: { ...get().room, status: 'playing' },
        });
        // Fetch personalized state for hidden-info games
        const room = get().room;
        const hiddenInfoGames = ['blackjack', 'spades', 'dominoes', 'quiz'];
        if (hiddenInfoGames.includes(room?.game_type)) {
          get().fetchGameState();
        }
      })
      .on('broadcast', { event: 'game:end' }, ({ payload }) => {
        const room = get().room;
        const hiddenInfoGames = ['blackjack', 'spades', 'dominoes', 'quiz'];
        if (!hiddenInfoGames.includes(room?.game_type)) {
          set({
            gameState: payload.gameState,
            room: { ...get().room, status: 'finished' },
          });
        }
      })
      .subscribe();

    // Room presence channel (broadcast + presence tracking)
    const roomChannel = supabase.channel(`room:${roomId}`)
      .on('broadcast', { event: 'room:players' }, ({ payload }) => {
        set({ players: payload.players });
      })
      .on('broadcast', { event: 'room:ready' }, ({ payload }) => {
        set({ players: payload.players });
      })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = roomChannel.presenceState();
        const onlinePlayers = Object.values(presenceState).flat().map(p => p.user_id);
        set(s => ({
          players: s.players.map(p => ({
            ...p,
            connected: onlinePlayers.includes(p.user_id),
          })),
        }));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const joined = newPresences[0];
        if (joined && joined.user_id !== get().myPlayerId) {
          set(s => ({
            messages: [...s.messages, {
              id: `sys_join_${Date.now()}`,
              sender: 'system',
              text: `${joined.display_name || 'A player'} connected`,
              timestamp: new Date().toISOString(),
            }].slice(-100),
          }));
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const left = leftPresences[0];
        if (left && left.user_id !== get().myPlayerId) {
          set(s => ({
            messages: [...s.messages, {
              id: `sys_leave_${Date.now()}`,
              sender: 'system',
              text: `${left.display_name || 'A player'} disconnected`,
              timestamp: new Date().toISOString(),
            }].slice(-100),
          }));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: get().myPlayerId,
            display_name: getPlayerName(),
            joined_at: new Date().toISOString(),
          });
        }
      });

    // Chat channel
    const chatChannel = supabase.channel(`chat:${roomId}`)
      .on('broadcast', { event: 'chat:message' }, ({ payload }) => {
        set(s => ({
          messages: [...s.messages, payload.message].slice(-100),
        }));
      })
      .on('broadcast', { event: 'chat:typing' }, ({ payload }) => {
        set(s => ({
          typingUsers: { ...s.typingUsers, [payload.userId]: Date.now() },
        }));
      })
      .on('broadcast', { event: 'chat:reaction' }, ({ payload }) => {
        set(s => ({
          messages: s.messages.map(m => {
            if (m.id === payload.messageId) {
              const reactions = { ...(m.reactions || {}) };
              reactions[payload.emoji] = (reactions[payload.emoji] || 0) + 1;
              return { ...m, reactions };
            }
            return m;
          }),
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
      }, () => {
        // Room created/updated/deleted — refresh the list
        get().fetchOpenRooms();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await lobbyChannel.track({
            user_id: get().myPlayerId || getPlayerId(),
            display_name: getPlayerName(),
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
      onlineUsers: [], loading: false, error: null, isSpectator: false,
    });
  },
}));
