/**
 * MYSTATION - Extension Bridge
 * Receives voice commands from the MyStation Voice Chrome extension
 * and routes them to the player store / router
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';
import { tracks } from '@/data/tracks';

function fuzzyMatch(query, title) {
  const q = query.toLowerCase();
  const t = title.toLowerCase();
  if (t === q) return 1;
  if (t.includes(q)) return 0.95;
  if (t.startsWith(q)) return 0.9;

  const queryWords = q.split(/\s+/);
  const titleWords = t.split(/\s+/);
  let matches = 0;
  for (const qw of queryWords) {
    for (const tw of titleWords) {
      if (tw.includes(qw) || qw.includes(tw)) {
        matches++;
        break;
      }
    }
  }
  return queryWords.length > 0 ? matches / queryWords.length : 0;
}

function findBestTrack(query, includeVault = false) {
  let best = null;
  let bestScore = 0;
  const searchable = includeVault ? tracks : tracks.filter(t => t.albumId !== 'vault');
  for (const track of searchable) {
    const score = fuzzyMatch(query, track.title);
    if (score > bestScore) {
      bestScore = score;
      best = track;
    }
  }
  return bestScore >= 0.3 ? best : null;
}

export default function ExtensionBridge() {
  const router = useRouter();

  useEffect(() => {
    function handleMessage(event) {
      // Only accept messages from our extension
      if (event.data?.source !== 'mystation-voice-extension') return;

      const cmd = (event.data.command || '').toLowerCase().trim();
      if (!cmd) return;

      const store = usePlayerStore.getState();

      // Playback commands
      if (cmd === 'pause' || cmd === 'stop') {
        store.pause();
      } else if (cmd === 'resume' || cmd === 'unpause' || cmd === 'play') {
        store.play();
      } else if (cmd === 'next' || cmd === 'skip') {
        store.nextTrack();
      } else if (cmd === 'previous' || cmd === 'back') {
        store.prevTrack();
      } else if (cmd === 'shuffle') {
        store.toggleShuffle();
      } else if (cmd === 'volume up' || cmd === 'louder') {
        store.setVolume(Math.min(1, store.volume + 0.15));
      } else if (cmd === 'volume down' || cmd === 'quieter') {
        store.setVolume(Math.max(0, store.volume - 0.15));
      } else if (cmd === 'mute') {
        store.toggleMute();
      }
      // Navigation
      else if (cmd.includes('go to music') || cmd.includes('music page') || cmd === 'music') {
        router.push('/music');
      } else if (cmd.includes('go to merch') || cmd.includes('merch') || cmd === 'store' || cmd === 'shop') {
        router.push('/merch');
      } else if (cmd.includes('lotl') || cmd.includes('festival') || cmd.includes('lawn')) {
        router.push('/lotl');
      } else if (cmd.includes('go home') || cmd.includes('home page') || cmd === 'home') {
        router.push('/');
      } else if (cmd.includes('vault')) {
        router.push('/vault');
      }
      // Play a specific song
      else if (cmd.startsWith('play ')) {
        const query = cmd.replace('play ', '').trim();
        const vaultOpen = store.vaultUnlocked;
        if (query === 'all' || query === 'everything') {
          const playable = vaultOpen ? tracks : tracks.filter(t => t.albumId !== 'vault');
          store.setQueue(playable, 0);
        } else if (query === 'vault' && vaultOpen) {
          const vaultTracks = tracks.filter(t => t.albumId === 'vault');
          if (vaultTracks.length > 0) store.setQueue(vaultTracks, 0);
        } else {
          const track = findBestTrack(query, vaultOpen);
          if (track) {
            store.setTrack(track);
          }
        }
      }
      // Bare query — try to match a song
      else {
        const track = findBestTrack(cmd, store.vaultUnlocked);
        if (track) {
          store.setTrack(track);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return null;
}
