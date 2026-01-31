/**
 * MYSTATION ANALYTICS SYSTEM
 * Track plays, listeners, engagement
 */

// In-memory store (replace with database in production)
let analyticsData = {
  totalPlays: 0,
  uniqueListeners: new Set(),
  trackPlays: {},
  listenerHistory: {},
  topListeners: [],
  dailyPlays: {},
  deviceTypes: { mobile: 0, desktop: 0, tablet: 0 },
  locations: {},
  sessions: []
};

// Generate unique listener ID (stored in localStorage on client)
export const getListenerId = () => {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('mystation_listener_id');
  if (!id) {
    id = 'listener_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('mystation_listener_id', id);
  }
  return id;
};

// Track a play event
export const trackPlay = (trackId, trackTitle, listenerId) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Total plays
  analyticsData.totalPlays++;

  // Unique listeners
  if (listenerId) {
    analyticsData.uniqueListeners.add(listenerId);
  }

  // Track-specific plays
  if (!analyticsData.trackPlays[trackId]) {
    analyticsData.trackPlays[trackId] = {
      title: trackTitle,
      plays: 0,
      uniqueListeners: new Set(),
      lastPlayed: null
    };
  }
  analyticsData.trackPlays[trackId].plays++;
  analyticsData.trackPlays[trackId].lastPlayed = now;
  if (listenerId) {
    analyticsData.trackPlays[trackId].uniqueListeners.add(listenerId);
  }

  // Daily plays
  if (!analyticsData.dailyPlays[today]) {
    analyticsData.dailyPlays[today] = 0;
  }
  analyticsData.dailyPlays[today]++;

  // Listener history
  if (listenerId) {
    if (!analyticsData.listenerHistory[listenerId]) {
      analyticsData.listenerHistory[listenerId] = {
        totalPlays: 0,
        tracks: {},
        firstSeen: now,
        lastSeen: now
      };
    }
    analyticsData.listenerHistory[listenerId].totalPlays++;
    analyticsData.listenerHistory[listenerId].lastSeen = now;
    if (!analyticsData.listenerHistory[listenerId].tracks[trackId]) {
      analyticsData.listenerHistory[listenerId].tracks[trackId] = 0;
    }
    analyticsData.listenerHistory[listenerId].tracks[trackId]++;
  }

  return {
    success: true,
    totalPlays: analyticsData.totalPlays,
    trackPlays: analyticsData.trackPlays[trackId].plays
  };
};

// Track device type
export const trackDevice = (deviceType) => {
  if (analyticsData.deviceTypes[deviceType] !== undefined) {
    analyticsData.deviceTypes[deviceType]++;
  }
};

// Track location (city/region)
export const trackLocation = (location) => {
  if (!analyticsData.locations[location]) {
    analyticsData.locations[location] = 0;
  }
  analyticsData.locations[location]++;
};

// Get analytics summary
export const getAnalyticsSummary = () => {
  // Calculate top listeners
  const topListeners = Object.entries(analyticsData.listenerHistory)
    .map(([id, data]) => ({
      id,
      plays: data.totalPlays,
      tracksPlayed: Object.keys(data.tracks).length,
      lastSeen: data.lastSeen
    }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  // Calculate top tracks
  const topTracks = Object.entries(analyticsData.trackPlays)
    .map(([id, data]) => ({
      id,
      title: data.title,
      plays: data.plays,
      uniqueListeners: data.uniqueListeners.size
    }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  return {
    totalPlays: analyticsData.totalPlays,
    uniqueListeners: analyticsData.uniqueListeners.size,
    topTracks,
    topListeners,
    deviceBreakdown: analyticsData.deviceTypes,
    topLocations: Object.entries(analyticsData.locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    last7Days: getLast7DaysPlays()
  };
};

// Get last 7 days of plays
const getLast7DaysPlays = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      plays: analyticsData.dailyPlays[dateStr] || 0
    });
  }
  return days;
};

// Get listener stats
export const getListenerStats = (listenerId) => {
  if (!analyticsData.listenerHistory[listenerId]) {
    return null;
  }
  return analyticsData.listenerHistory[listenerId];
};

export default analyticsData;
