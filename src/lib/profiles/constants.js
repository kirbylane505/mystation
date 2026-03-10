/**
 * MYSTATION — Profile Constants
 */

export const AVATAR_STYLES = [
  'initials', 'geometric', 'gradient', 'rings', 'dots', 'waves', 'blocks', 'diamond',
];

export const TIER_BADGES = {
  free: { label: 'Listener', color: '#64748b', border: 'border-slate-500' },
  subscriber: { label: 'Subscriber', color: '#8b5cf6', border: 'border-purple-500' },
  diamond: { label: 'Diamond', color: '#f59e0b', border: 'border-amber-500' },
};

export const PROFILE_LIMITS = {
  displayNameMax: 24,
  usernameMin: 3,
  usernameMax: 20,
  bioMax: 160,
  playlistNameMax: 40,
  playlistDescMax: 120,
  maxPlaylists: 10,
  maxTracksPerPlaylist: 50,
  maxFollowsPerHour: 50,
  avatarMaxSize: 2 * 1024 * 1024,
};

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
