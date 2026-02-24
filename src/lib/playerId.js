/**
 * Persistent player identity — survives page refreshes
 * Uses localStorage visitor ID, upgrades to Supabase auth if available
 */
const STORAGE_KEY = 'ms-player-id';
const NAME_KEY = 'ms-player-name';

export function getPlayerId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getPlayerName() {
  if (typeof window === 'undefined') return 'Player';
  return localStorage.getItem(NAME_KEY) || 'Player';
}

export function setPlayerName(name) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 20));
  }
}
