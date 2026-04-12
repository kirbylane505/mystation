'use client';

/**
 * StreamEngine — Persistent live stream connection
 * Lives in root layout (like AudioPlayer). Survives page navigation.
 * When host is live and navigates away, stream keeps running.
 * Shows floating LIVE pill to return to stream page.
 */

import { useEffect } from 'react';
import { usePodStationStore } from '@/store/podStationStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// ===== MODULE-SCOPE — survives React unmounts =====
let globalRoom = null;
let globalCtx = null;
let globalDest = null;
let globalMicStream = null;
let globalMicGain = null;
let globalMusicGain = null;
let globalMusicEl = null;
let globalMusicSync = null;
let globalAppAudioStream = null;
let globalAppAudioGain = null;
let globalAppAudioSource = null;
let streamConnected = false;

/** Get the persistent LiveKit Room instance */
export function getStreamRoom() {
  return globalRoom;
}

/** Check if a host stream is actively connected */
export function isStreamConnected() {
  return streamConnected && globalRoom?.state === 'connected';
}

/** Get audio nodes for Stream Mix controls */
export function getStreamAudio() {
  return {
    ctx: globalCtx,
    dest: globalDest,
    micGain: globalMicGain,
    musicGain: globalMusicGain,
    appAudioGain: globalAppAudioGain,
  };
}

/** Initialize host stream — called from StreamView when going live */
export async function initHostStream(token, livekitUrl) {
  if (streamConnected && globalRoom?.state === 'connected') {
    return globalRoom; // Already connected
  }

  const { Room, Track: LKTrack, LocalAudioTrack } = await import('livekit-client');

  const room = new Room({
    videoCaptureDefaults: {
      resolution: { width: 1280, height: 720 },
      facingMode: 'user',
    },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
    },
    publishDefaults: {
      videoCodec: 'vp8',
      simulcast: true,
    },
  });

  await room.connect(livekitUrl, token);
  await room.localParticipant.setCameraEnabled(true);

  // Publish mixed audio (mic + MyStation music)
  try {
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });

    const ctx = new AudioContext({ sampleRate: 48000 });
    const dest = ctx.createMediaStreamDestination();

    // Mic into mix
    const micSource = ctx.createMediaStreamSource(micStream);
    const micGainNode = ctx.createGain();
    micGainNode.gain.value = 1.0;
    micSource.connect(micGainNode).connect(dest);

    // Music into mix — mirrors the main player
    const musicEl = new Audio();
    musicEl.crossOrigin = 'anonymous';
    musicEl.volume = 0;
    let musicConnected = false;
    let musicGainNode = null;

    function connectMusic() {
      if (musicConnected) return;
      try {
        const ms = ctx.createMediaElementSource(musicEl);
        musicGainNode = ctx.createGain();
        musicGainNode.gain.value = 0.6;
        ms.connect(musicGainNode).connect(dest);
        musicConnected = true;
        globalMusicGain = musicGainNode;
      } catch (e) {}
    }

    // Sync loop — watches global audio element
    const sync = setInterval(() => {
      const mainAudio = document.querySelector('audio');
      if (!mainAudio) return;

      if (!mainAudio.paused && mainAudio.src) {
        if (musicEl.src !== mainAudio.src) {
          musicEl.src = mainAudio.src;
          musicEl.currentTime = mainAudio.currentTime;
          connectMusic();
          musicEl.play().catch(() => {});
        }
        if (musicEl.paused) {
          musicEl.currentTime = mainAudio.currentTime;
          connectMusic();
          musicEl.play().catch(() => {});
        }
        if (Math.abs(mainAudio.currentTime - musicEl.currentTime) > 2) {
          musicEl.currentTime = mainAudio.currentTime;
        }
      }
      if (mainAudio.paused && !musicEl.paused) {
        musicEl.pause();
      }
    }, 500);

    // Publish mixed track to LiveKit
    const lkTrack = new LocalAudioTrack(dest.stream.getAudioTracks()[0]);
    await room.localParticipant.publishTrack(lkTrack, { source: LKTrack.Source.Microphone });

    // Store at module scope
    // Patch disconnect to prevent LiveKitRoom unmount from killing the stream
    room._originalDisconnect = room.disconnect.bind(room);
    room.disconnect = function() {
      if (this._allowDisconnect) {
        return this._originalDisconnect();
      }
      return Promise.resolve();
    };

    globalRoom = room;
    globalCtx = ctx;
    globalDest = dest;
    globalMicStream = micStream;
    globalMicGain = micGainNode;
    globalMusicEl = musicEl;
    globalMusicSync = sync;
    streamConnected = true;

  } catch (err) {
    console.error('StreamEngine: Mixed audio failed, falling back to mic-only:', err);
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (e) {}
    globalRoom = room;
    streamConnected = true;
  }

  return room;
}

/** Start capturing app/tab audio into the mix */
export async function startAppAudio() {
  const ctx = globalCtx;
  const dest = globalDest;
  if (!ctx || !dest) return false;

  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: { systemAudio: 'include', echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    displayStream.getVideoTracks().forEach(t => t.stop());
    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    const appSource = ctx.createMediaStreamSource(new MediaStream(audioTracks));
    const appGain = ctx.createGain();
    appGain.gain.value = 0.7;
    appSource.connect(appGain).connect(dest);

    globalAppAudioStream = displayStream;
    globalAppAudioSource = appSource;
    globalAppAudioGain = appGain;

    audioTracks[0].onended = () => {
      globalAppAudioStream = null;
      globalAppAudioSource = null;
      globalAppAudioGain = null;
    };

    return true;
  } catch (err) {
    return false;
  }
}

/** Stop app audio capture */
export function stopAppAudio() {
  if (globalAppAudioStream) {
    globalAppAudioStream.getTracks().forEach(t => t.stop());
    globalAppAudioStream = null;
  }
  if (globalAppAudioSource) {
    globalAppAudioSource.disconnect();
    globalAppAudioSource = null;
  }
  if (globalAppAudioGain) {
    globalAppAudioGain.disconnect();
    globalAppAudioGain = null;
  }
}

/** End stream — full cleanup */
export function cleanupStream() {
  if (globalMicStream) {
    globalMicStream.getTracks().forEach(t => t.stop());
    globalMicStream = null;
  }
  stopAppAudio();
  if (globalMusicSync) {
    clearInterval(globalMusicSync);
    globalMusicSync = null;
  }
  if (globalMusicEl) {
    globalMusicEl.pause();
    globalMusicEl = null;
  }
  if (globalCtx) {
    globalCtx.close().catch(() => {});
    globalCtx = null;
    globalDest = null;
  }
  if (globalRoom) {
    globalRoom._allowDisconnect = true;
    if (globalRoom._originalDisconnect) {
      globalRoom._originalDisconnect();
    } else {
      globalRoom.disconnect();
    }
    globalRoom = null;
  }
  globalMicGain = null;
  globalMusicGain = null;
  streamConnected = false;
}

// ===== React Component — only renders floating LIVE pill =====
export default function StreamEngine() {
  const isHostLive = usePodStationStore(s => s.isHostLive);
  const hostStreamId = usePodStationStore(s => s.hostStreamId);
  const pathname = usePathname();

  // Auto-cleanup if store says not live but connection exists
  useEffect(() => {
    if (!isHostLive && streamConnected) {
      cleanupStream();
    }
  }, [isHostLive]);

  // Auto-end stream on tab close
  useEffect(() => {
    function onUnload() {
      if (isHostLive && hostStreamId) {
        // Best-effort end stream API call
        navigator.sendBeacon('/api/podstation/stream', JSON.stringify({
          streamId: hostStreamId,
        }));
        cleanupStream();
      }
    }
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [isHostLive, hostStreamId]);

  // Don't render anything if not live
  if (!isHostLive || !hostStreamId) return null;

  // Don't show pill if already on the stream page
  const isOnStreamPage = pathname?.includes(`/podstation/${hostStreamId}`) || pathname?.includes('/podstation/go-live');
  if (isOnStreamPage) return null;

  // Floating LIVE pill — tap to return
  return (
    <Link
      href={`/podstation/${hostStreamId}?mode=host`}
      className="fixed bottom-28 left-4 z-[60] flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white pl-2.5 pr-3 py-2 rounded-full shadow-lg shadow-red-900/40 transition-all hover:scale-105"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>
      <span className="text-xs font-bold tracking-wide">LIVE</span>
      <span className="text-[10px] opacity-80 hidden sm:inline">— tap to return</span>
    </Link>
  );
}
