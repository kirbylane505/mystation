/**
 * Persistent player identity — subscriber-aware
 * Subscribers get stable ID (same across devices/sessions)
 * Anonymous users get random localStorage ID (original behavior)
 */
const STORAGE_KEY = 'ms-player-id';
const NAME_KEY = 'ms-player-name';
const ANON_BACKUP_KEY = 'ms-player-id-anonymous';

/**
 * Hash email to stable hex string (deterministic, same every time)
 */
async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/**
 * Read subscriber data from navbar-set localStorage
 */
function getSubscriberData() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mystation_user');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.email && data?.isSubscribed) return data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Get player ID — stable for subscribers, random for anonymous
 * Subscribers: sub_[hash(email)] — same on every device
 * Anonymous: player_[timestamp]_[random] — localStorage only
 */
export function getPlayerId() {
  if (typeof window === 'undefined') return null;

  const sub = getSubscriberData();
  if (sub?.email) {
    // Subscriber — use cached sync ID (async hash runs on init)
    const cached = localStorage.getItem('ms-sub-player-id');
    if (cached) {
      // Save old anonymous ID for migration (one-time)
      const anonId = localStorage.getItem(STORAGE_KEY);
      if (anonId && !anonId.startsWith('sub_') && !localStorage.getItem(ANON_BACKUP_KEY)) {
        localStorage.setItem(ANON_BACKUP_KEY, anonId);
      }
      // Update main key to subscriber ID
      localStorage.setItem(STORAGE_KEY, cached);
      return cached;
    }
  }

  // Anonymous fallback (original behavior)
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/**
 * Initialize subscriber player ID (call once on page load)
 * Computes hash async, caches result for sync getPlayerId()
 */
export async function initSubscriberIdentity() {
  if (typeof window === 'undefined') return;
  const sub = getSubscriberData();
  if (!sub?.email) return;

  const hash = await hashEmail(sub.email);
  const subId = `sub_${hash}`;
  localStorage.setItem('ms-sub-player-id', subId);

  // Save old anonymous ID for migration
  const anonId = localStorage.getItem(STORAGE_KEY);
  if (anonId && !anonId.startsWith('sub_') && !localStorage.getItem(ANON_BACKUP_KEY)) {
    localStorage.setItem(ANON_BACKUP_KEY, anonId);
  }

  // Update main key
  localStorage.setItem(STORAGE_KEY, subId);
}

/**
 * Get player display name — subscriber name or custom name
 */
export function getPlayerName() {
  if (typeof window === 'undefined') return 'Player';
  const sub = getSubscriberData();
  if (sub?.name) return sub.name;
  return localStorage.getItem(NAME_KEY) || 'Player';
}

export function setPlayerName(name) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NAME_KEY, name.trim().slice(0, 20));
  }
}

/**
 * Check if current player is a subscriber
 */
export function isSubscriberPlayer() {
  return !!getSubscriberData();
}

/**
 * Get the old anonymous player ID (for migration)
 * Returns null if no anonymous ID saved or already migrated
 */
export function getAnonymousPlayerId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ANON_BACKUP_KEY);
}

/**
 * Clear anonymous backup after successful migration
 */
export function clearAnonymousBackup() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ANON_BACKUP_KEY);
  }
}
