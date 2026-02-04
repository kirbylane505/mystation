/**
 * MYSTATION - Mux Live Streaming Integration
 * Stream directly on your platform, keep all the money
 */

// Mux API configuration
// Get your keys at: https://dashboard.mux.com
export const MUX_CONFIG = {
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
};

// Stream states
export const STREAM_STATUS = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  LIVE: 'active',
  ENDED: 'ended',
};

// Helper to format stream URL for OBS/Streamlabs
export function getStreamUrl(streamKey) {
  return {
    server: 'rtmps://global-live.mux.com:443/app',
    streamKey: streamKey,
  };
}

// Helper to get playback URL
export function getPlaybackUrl(playbackId) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

// Helper to get thumbnail
export function getThumbnail(playbackId, time = 0) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}
