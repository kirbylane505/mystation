'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users, ArrowLeft, Copy, Check, Radio, Mic, MicOff,
  Volume2, VolumeX, Mail, Heart, DollarSign, Maximize,
  Minimize, Music, Clock, Crown, UserPlus, Link2, Monitor, MonitorOff
} from 'lucide-react';
import { usePodStationStore } from '@/store/podStationStore';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import LiveChat from './LiveChat';
import NamePrompt from './NamePrompt';
import Image from 'next/image';

export default function StreamView({ stream }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { email, name, isSubscribed } = useUserStore();
  const { viewerCount, resetStream, addChatMessage, setViewerCount } = usePodStationStore();
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const [token, setToken] = useState(searchParams.get('token') || null);
  const [copied, setCopied] = useState(false);
  const [lkLoaded, setLkLoaded] = useState(false);
  const [LKComponents, setLKComponents] = useState(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [gateEmail, setGateEmail] = useState('');
  const [gateSubmitted, setGateSubmitted] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [viewerName, setViewerName] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const isHostParam = searchParams.get('mode') === 'host';
  const isStreamOwner = email && stream?.user_email && email === stream.user_email;
  const isHost = isHostParam || isStreamOwner;
  const inviteParam = searchParams.get('invite');
  const roomName = searchParams.get('room') || stream?.livekit_room_name;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    Promise.all([
      import('@livekit/components-react'),
      import('livekit-client'),
    ]).then(([components, lkClient]) => {
      setLKComponents({
        LiveKitRoom: components.LiveKitRoom,
        RoomContext: components.RoomContext,
        VideoTrack: components.VideoTrack,
        AudioTrack: components.AudioTrack,
        RoomAudioRenderer: components.RoomAudioRenderer,
        useTracks: components.useTracks,
        useRoomContext: components.useRoomContext,
        useDataChannel: components.useDataChannel,
        Track: lkClient.Track,
      });
      setLkLoaded(true);
    });
  }, []);

  // Email gate after 60s for non-logged-in viewers
  useEffect(() => {
    if (!isHost && !isGuest && !email) {
      const timer = setTimeout(() => setShowEmailGate(true), 60000);
      return () => clearTimeout(timer);
    }
  }, [isHost, isGuest, email]);

  // Guest invite flow — redeem invite code to get publisher token
  useEffect(() => {
    if (inviteParam && viewerName && !token) {
      fetch(`/api/podstation/invite?code=${inviteParam}&name=${encodeURIComponent(viewerName)}`)
        .then(r => r.json())
        .then(data => {
          if (data.token) {
            setToken(data.token);
            setIsGuest(true);
          }
        })
        .catch(console.error);
    }
  }, [inviteParam, viewerName, token]);

  // Regular viewer token fetch
  useEffect(() => {
    if (!isHost && !inviteParam && !token && roomName && viewerName) {
      fetch('/api/podstation/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          userName: viewerName,
          isPublisher: false,
        }),
      })
        .then(r => r.json())
        .then(data => setToken(data.token))
        .catch(console.error);
    }
  }, [isHost, inviteParam, token, roomName, viewerName]);

  // Host auto-sets name
  useEffect(() => {
    if (isHost && !viewerName) {
      setViewerName(name || email?.split('@')[0] || 'Host');
    }
  }, [isHost, viewerName, name, email]);

  function handleEndStream() {
    if (isHost && stream?.id) {
      fetch('/api/podstation/stream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: stream.id }),
      }).then(() => {
        resetStream();
        router.push('/podstation');
      });
    } else {
      router.push('/podstation');
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/podstation/${stream?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleInviteGuest() {
    if (inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/podstation/${stream?.id}?invite=${inviteCode}`);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
      return;
    }
    try {
      const res = await fetch('/api/podstation/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: stream?.id, roomName }),
      });
      const data = await res.json();
      if (data.code) {
        setInviteCode(data.code);
        navigator.clipboard.writeText(`${window.location.origin}/podstation/${stream?.id}?invite=${data.code}`);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
      }
    } catch (err) {
      console.error('Invite error:', err);
    }
  }

  async function handleEmailGate(e) {
    e.preventDefault();
    if (!gateEmail.trim()) return;
    try {
      await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gateEmail.trim(), source: 'podstation' }),
      });
    } catch (err) {}
    setGateSubmitted(true);
    setShowEmailGate(false);
  }

  async function handleDonate(amount) {
    try {
      const res = await fetch('/api/podstation/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          streamId: stream?.id,
          streamerName: stream?.user_name,
          tipperName: viewerName || name || email?.split('@')[0] || 'Fan',
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      setShowDonate(false);
    } catch (err) {
      console.error('Donate error:', err);
    }
  }

  // Name prompt for non-host viewers (including invite guests)
  const handleNameSubmit = useCallback((n) => setViewerName(n), []);
  if (!isHost && !viewerName) {
    return <NamePrompt onSubmit={handleNameSubmit} />;
  }

  if (!lkLoaded || !token || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-3">
        <Radio className="w-8 h-8 text-orange-500 animate-pulse" />
        <p className="text-gray-400 text-sm">Connecting to stream...</p>
      </div>
    );
  }

  const { LiveKitRoom: LKRoom } = LKComponents;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/podstation')} className="text-gray-400 hover:text-white flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{stream?.title}</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              {stream?.user_name}
              <span className="flex items-center gap-1 text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <Users className="w-3 h-3" />
                {viewerCount}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {/* Invite Guest — host only */}
          {isHost && (
            <button
              onClick={handleInviteGuest}
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {inviteCopied ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {inviteCopied ? 'Link Copied!' : inviteCode ? 'Copy Invite' : 'Invite Guest'}
            </button>
          )}
          {/* Donate button for viewers */}
          {!isHost && !isGuest && (
            <button
              onClick={() => setShowDonate(!showDonate)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Donate
            </button>
          )}
          <button
            onClick={copyLink}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          {(isHost || stream?.is_live) && (
            <button
              onClick={handleEndStream}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              End Stream
            </button>
          )}
        </div>
      </div>

      {/* Donate dropdown */}
      {showDonate && (
        <div className="mb-3 bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white text-sm font-medium mb-3">Support {stream?.user_name}</p>
          <div className="flex gap-2 flex-wrap">
            {[1, 5, 10, 25, 50, 100].map(amt => (
              <button
                key={amt}
                onClick={() => handleDonate(amt)}
                className="px-4 py-2 bg-green-600/20 hover:bg-green-600 border border-green-500/30 hover:border-green-400 text-green-400 hover:text-white rounded-lg text-sm font-medium transition-all"
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LiveKit Room */}
      <LKRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={isHost}
        audio={false}
        options={{
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
        }}
      >
        <StreamContent
          stream={stream}
          isHost={isHost}
          isGuest={isGuest}
          LKComponents={LKComponents}
          addChatMessage={addChatMessage}
          setViewerCount={setViewerCount}
          currentTrack={currentTrack}
          isSubscribed={isSubscribed}
          userName={viewerName || name}
        />
      </LKRoom>

      {/* Email Gate */}
      {showEmailGate && !gateSubmitted && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-mystation-navy border border-white/10 rounded-2xl p-6 max-w-md w-full text-center">
            <Image src="/images/mystation-logo.png" alt="MyStation" width={120} height={40} className="mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold mb-2">Keep watching live!</h2>
            <p className="text-gray-400 text-sm mb-4">Enter your email to continue watching</p>
            <form onSubmit={handleEmailGate} className="flex gap-2">
              <input
                type="email"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StreamContent({ stream, isHost, isGuest, LKComponents, addChatMessage, setViewerCount, currentTrack, isSubscribed, userName }) {
  const { useTracks, VideoTrack, AudioTrack, RoomAudioRenderer, useRoomContext, useDataChannel, Track } = LKComponents;
  const [streamMuted, setStreamMuted] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [elapsed, setElapsed] = useState('0:00');
  const [micVolume, setMicVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(60);
  const [appAudioActive, setAppAudioActive] = useState(false);
  const [appAudioVolume, setAppAudioVolume] = useState(70);
  const videoContainerRef = useRef(null);
  const localVideoRef = useRef(null);
  const startTime = useRef(Date.now());

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false }
  );
  const room = useRoomContext();

  let sendChat = null;
  try {
    const dc = useDataChannel('chat');
    sendChat = dc.send;
    useEffect(() => {
      if (dc.message) {
        try {
          const decoder = new TextDecoder();
          const msg = JSON.parse(decoder.decode(dc.message.payload));
          addChatMessage(msg);
        } catch (e) {}
      }
    }, [dc.message]);
  } catch (e) {}

  // Stream timer
  useEffect(() => {
    if (stream?.started_at) startTime.current = new Date(stream.started_at).getTime();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime.current) / 1000);
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      setElapsed(hrs > 0
        ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        : `${mins}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [stream?.started_at]);

  useEffect(() => {
    if (room) {
      const update = () => setViewerCount(Math.max(0, room.numParticipants - 1));
      room.on('participantConnected', update);
      room.on('participantDisconnected', update);
      update();
      return () => {
        room.off('participantConnected', update);
        room.off('participantDisconnected', update);
      };
    }
  }, [room, setViewerCount]);

  // CLIENT-SIDE AUTO-END: host disconnect backup
  useEffect(() => {
    if (!room || !isHost) return;
    function onDisconnect() {
      fetch('/api/podstation/stream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: stream?.id }),
      }).catch(() => {});
    }
    room.on('disconnected', onDisconnect);
    window.addEventListener('beforeunload', onDisconnect);
    return () => {
      room.off('disconnected', onDisconnect);
      window.removeEventListener('beforeunload', onDisconnect);
    };
  }, [room, isHost, stream?.id]);

  // HOST: Publish mic + music mixed into one audio track
  useEffect(() => {
    if (!room || !isHost) return;
    let cancelled = false;

    async function publishMixedAudio() {
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        if (cancelled) { micStream.getTracks().forEach(t => t.stop()); return; }

        const ctx = new AudioContext({ sampleRate: 48000 });
        const dest = ctx.createMediaStreamDestination();

        const micSource = ctx.createMediaStreamSource(micStream);
        const micGainNode = ctx.createGain();
        micGainNode.gain.value = 1.0;
        micSource.connect(micGainNode).connect(dest);

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
            room._musicGain = musicGainNode;
          } catch (e) {}
        }

        const mainAudio = document.querySelector('audio');
        const sync = setInterval(() => {
          if (!mainAudio || cancelled) { clearInterval(sync); return; }
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

        room._musicCleanup = () => { clearInterval(sync); musicEl.pause(); };

        const { LocalAudioTrack, Track: LKTrack } = await import('livekit-client');
        const lkTrack = new LocalAudioTrack(dest.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(lkTrack, { source: LKTrack.Source.Microphone });

        room._micStream = micStream;
        room._ctx = ctx;
        room._dest = dest;
        room._micGain = micGainNode;
      } catch (err) {
        console.error('Mixed audio failed:', err);
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch (e) {}
      }
    }

    const timer = setTimeout(publishMixedAudio, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (room?._micStream) room._micStream.getTracks().forEach(t => t.stop());
      if (room?._appAudioStream) room._appAudioStream.getTracks().forEach(t => t.stop());
      if (room?._ctx) room._ctx.close().catch(() => {});
      if (room?._musicCleanup) room._musicCleanup();
    };
  }, [room, isHost]);

  // GUEST: Enable camera + mic on join
  useEffect(() => {
    if (!room || !isGuest) return;
    const timer = setTimeout(async () => {
      try {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (e) {
        console.error('Guest camera/mic failed:', e);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [room, isGuest]);

  // HOST VIDEO FIX: Attach local camera directly if useTracks misses it
  useEffect(() => {
    if (!room || !isHost) return;
    const checkLocal = setTimeout(() => {
      const localCam = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (localCam?.track && localVideoRef.current && !localVideoRef.current.srcObject) {
        const el = localCam.track.attach();
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'contain';
        localVideoRef.current.innerHTML = '';
        localVideoRef.current.appendChild(el);
      }
    }, 3000);
    return () => clearTimeout(checkLocal);
  }, [room, isHost, Track]);

  function toggleMic() {
    if (room?._micGain) {
      const newActive = !micActive;
      room._micGain.gain.value = newActive ? 1.0 : 0;
      setMicActive(newActive);
    } else if (room) {
      const newActive = !micActive;
      room.localParticipant.setMicrophoneEnabled(newActive);
      setMicActive(newActive);
    }
  }

  async function toggleAppAudio() {
    if (appAudioActive) {
      if (room?._appAudioStream) { room._appAudioStream.getTracks().forEach(t => t.stop()); room._appAudioStream = null; }
      if (room?._appAudioSource) { room._appAudioSource.disconnect(); room._appAudioSource = null; }
      if (room?._appAudioGain) { room._appAudioGain.disconnect(); room._appAudioGain = null; }
      setAppAudioActive(false);
      return;
    }
    try {
      const ctx = room?._ctx;
      const dest = room?._dest;
      if (!ctx || !dest) return;
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { systemAudio: 'include', echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      displayStream.getVideoTracks().forEach(t => t.stop());
      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) return;
      const appSource = ctx.createMediaStreamSource(new MediaStream(audioTracks));
      const appGain = ctx.createGain();
      appGain.gain.value = appAudioVolume / 100;
      appSource.connect(appGain).connect(dest);
      room._appAudioStream = displayStream;
      room._appAudioSource = appSource;
      room._appAudioGain = appGain;
      audioTracks[0].onended = () => { setAppAudioActive(false); room._appAudioStream = null; room._appAudioSource = null; room._appAudioGain = null; };
      setAppAudioActive(true);
    } catch (err) { console.error('App audio capture failed:', err); }
  }

  function toggleStreamMute() {
    setStreamMuted(!streamMuted);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // Floating reactions
  function sendReaction(emoji) {
    const id = Date.now() + Math.random();
    setReactions(prev => [...prev, { id, emoji, x: 20 + Math.random() * 60 }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);

    if (sendChat) {
      const msg = {
        id: id.toString(),
        user_name: userName || 'Viewer',
        emoji,
        created_at: new Date().toISOString(),
      };
      try {
        const encoder = new TextEncoder();
        sendChat(encoder.encode(JSON.stringify(msg)));
      } catch (e) {}
      addChatMessage(msg);
    }
  }

  // Get all video tracks (supports multi-participant split view)
  const allVideoTracks = tracks.filter(t => t.source === Track.Source.Camera && t.publication?.track);
  const multiView = allVideoTracks.length > 1;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-14rem)]">
      {/* Video + App Audio bar column */}
      <div className="flex-1 flex flex-col min-h-[250px]">
      {/* Video area */}
      <div className="flex-1 relative rounded-t-xl overflow-hidden bg-black" ref={videoContainerRef}>
        {allVideoTracks.length > 0 ? (
          <div className={multiView ? 'grid grid-cols-2 gap-1 w-full h-full' : 'w-full h-full'}>
            {allVideoTracks.map((track, i) => (
              <div key={track.participant?.sid || i} className="relative w-full h-full">
                <VideoTrack trackRef={track} className="w-full h-full object-contain" />
                {multiView && (
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
                    {track.participant?.identity || 'Unknown'}
                  </div>
                )}
              </div>
            ))}
            {!isHost && !streamMuted && <RoomAudioRenderer />}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-3" ref={localVideoRef}>
            <Radio className="w-20 h-20 text-orange-500 animate-pulse" />
            <p className="text-gray-400 text-sm">{isHost ? 'Publishing your camera...' : 'Waiting for streamer...'}</p>
          </div>
        )}

        {/* Floating reactions */}
        {reactions.map(r => (
          <div
            key={r.id}
            className="absolute text-3xl animate-bounce pointer-events-none"
            style={{
              left: `${r.x}%`,
              bottom: '80px',
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            {r.emoji}
          </div>
        ))}

        {/* Top left: LIVE + Timer */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {allVideoTracks.length > 0 && (
            <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded text-xs font-bold text-white">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-xs text-white">
            <Clock className="w-3 h-3" />
            {elapsed}
          </div>
          <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded text-xs text-white">
            <Users className="w-3 h-3" />
            {room?.numParticipants ? Math.max(0, room.numParticipants - 1) : 0}
          </div>
        </div>

        {/* Top right: MyStation branding */}
        <div className="absolute top-3 right-3 opacity-70">
          <Image src="/images/mystation-logo.png" alt="MyStation" width={90} height={28} />
        </div>

        {/* Now Playing — small pill under branding */}
        {currentTrack && (
          <div className="absolute bottom-12 right-3 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded text-[10px] max-w-[150px]">
            <Music className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
            <span className="text-white truncate">{currentTrack.title}</span>
          </div>
        )}

        {/* Bottom controls */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-3">
          {/* Left: Mic status */}
          <div className="flex items-center gap-2">
            {(isHost || isGuest) && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${micActive ? 'bg-green-600/80 text-white' : 'bg-red-600/80 text-white'}`}>
                {micActive ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                {micActive ? 'Mic On' : 'Muted'}
              </div>
            )}
          </div>

          {/* Center: Controls */}
          <div className="flex gap-2">
            {(isHost || isGuest) && (
              <button onClick={toggleMic} className={`p-2.5 rounded-full ${micActive ? 'bg-white/20' : 'bg-red-600'} text-white transition-colors`}>
                {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            )}
            {!isHost && !isGuest && (
              <button onClick={toggleStreamMute} className={`p-2.5 rounded-full ${!streamMuted ? 'bg-white/20' : 'bg-red-600'} text-white transition-colors`}>
                {streamMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={toggleFullscreen} className="p-2.5 rounded-full bg-white/20 text-white transition-colors hover:bg-white/30">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          {/* Right: Reactions */}
          <div className="flex gap-1.5">
            <button onClick={() => sendReaction('\u2764\uFE0F')} className="p-2 bg-white/10 hover:bg-red-600/50 rounded-full transition-colors text-lg" title="Heart">
              {'\u2764\uFE0F'}
            </button>
            <button onClick={() => sendReaction('\uD83D\uDD25')} className="p-2 bg-white/10 hover:bg-orange-600/50 rounded-full transition-colors text-lg" title="Fire">
              {'\uD83D\uDD25'}
            </button>
            <button onClick={() => sendReaction('\uD83D\uDC4F')} className="p-2 bg-white/10 hover:bg-yellow-600/50 rounded-full transition-colors text-lg" title="Clap">
              {'\uD83D\uDC4F'}
            </button>
            <button onClick={() => sendReaction('\uD83D\uDCAF')} className="p-2 bg-white/10 hover:bg-blue-600/50 rounded-full transition-colors text-lg" title="100">
              {'\uD83D\uDCAF'}
            </button>
          </div>
        </div>
      </div>

      {/* App Audio Bar — below video, host only */}
      {isHost && (
        <div className="bg-white/5 border border-white/10 border-t-0 rounded-b-xl px-4 py-2 flex items-center gap-3">
          <button
            onClick={toggleAppAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              appAudioActive
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {appAudioActive ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            {appAudioActive ? 'Stop App Audio' : 'Share App Audio'}
          </button>
          {appAudioActive && (
            <div className="flex items-center gap-2 flex-1">
              <Monitor className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <input type="range" min="0" max="100" value={appAudioVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setAppAudioVolume(v);
                  if (room?._appAudioGain) room._appAudioGain.gain.value = v / 100;
                }}
                className="flex-1 accent-purple-500 h-1.5" />
              <span className="text-[10px] text-gray-400 w-7 text-right">{appAudioVolume}%</span>
            </div>
          )}
          {!appAudioActive && (
            <span className="text-[10px] text-gray-500">Capture audio from Spotify, YouTube, or any app</span>
          )}
        </div>
      )}
      </div>

      {/* Right side: Mix controls (host) + Chat */}
      <div className="w-full lg:w-80 flex flex-col gap-2 h-64 lg:h-full">
        {/* Host mix controls */}
        {isHost && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p className="text-white text-xs font-medium">Stream Mix</p>
            <div className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <input type="range" min="0" max="100" value={micVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMicVolume(v);
                  if (room?._micGain) room._micGain.gain.value = v / 100;
                }}
                className="flex-1 accent-green-500 h-1.5" />
              <span className="text-[10px] text-gray-400 w-7 text-right">{micVolume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
              <input type="range" min="0" max="100" value={musicVolume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMusicVolume(v);
                  if (room?._musicGain) room._musicGain.gain.value = v / 100;
                }}
                className="flex-1 accent-orange-500 h-1.5" />
              <span className="text-[10px] text-gray-400 w-7 text-right">{musicVolume}%</span>
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <LiveChat sendData={sendChat} isSubscribed={isSubscribed} />
        </div>
      </div>

      {/* Float-up animation style */}
      <style jsx global>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 0.8; transform: translateY(-100px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-250px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}
