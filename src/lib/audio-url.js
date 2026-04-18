/**
 * MYSTATION - Audio URL selector
 * Returns hi-fi URL only when monetization is enforced AND the user's tier
 * allows it AND the track has a hi-fi file populated. Falls back to the
 * standard audio_url otherwise. Dormant in grow mode.
 */

import { gateFor } from '@/lib/monetization';

export function selectAudioUrl(track, userTier) {
  if (!track) return null;
  const { allowed } = gateFor('hi_fi_audio', userTier);
  if (allowed && track.audio_url_hifi) return track.audio_url_hifi;
  return track.audio_url || null;
}
