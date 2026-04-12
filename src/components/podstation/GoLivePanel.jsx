'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video, Mic, MicOff, VideoOff, Radio,
  Save, DollarSign, Loader2
} from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

export default function GoLivePanel() {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [title, setTitle] = useState('');
  const [saveReplay, setSaveReplay] = useState(false);
  const [wantToCharge, setWantToCharge] = useState(false);
  const [price, setPrice] = useState('');
  const [starting, setStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const { email, name, isSubscribed } = useUserStore();

  async function enableCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 },
        },
        audio: {
          sampleRate: 48000,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch (err) {
      console.error('Camera access failed:', err);
      setCameraError(err.message || 'Camera access denied. Check browser permissions.');
    }
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoEnabled(v => !v);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setAudioEnabled(a => !a);
    }
  }, []);

  async function handleGoLive() {
    if (!title.trim()) return;

    const streamerEmail = email || `streamer-${Date.now()}@mystation.live`;
    const streamerName = name || email?.split('@')[0] || 'Streamer';

    setStarting(true);

    try {
      const res = await fetch('/api/podstation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          userEmail: streamerEmail,
          userName: streamerName,
          saveReplay,
          isPaid: wantToCharge && isSubscribed,
          price: wantToCharge && isSubscribed ? parseFloat(price) : null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      router.push(`/podstation/${data.stream.id}?mode=host&token=${encodeURIComponent(data.token)}&room=${data.roomName}`);
    } catch (err) {
      console.error('Failed to go live:', err);
      setCameraError('Failed to start stream: ' + err.message);
      setStarting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Radio className="w-6 h-6 text-orange-500" />
        Go Live
      </h1>

      {/* Camera Preview */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
            <Video className="w-16 h-16 text-orange-500" />
            <button
              onClick={enableCamera}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <Video className="w-5 h-5" />
              Enable Camera & Mic
            </button>
          </div>
        )}
        {!videoEnabled && cameraReady && (
          <div className="absolute inset-0 bg-mystation-navy flex items-center justify-center">
            <VideoOff className="w-16 h-16 text-gray-500" />
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 bg-mystation-navy flex items-center justify-center flex-col gap-3">
            <VideoOff className="w-16 h-16 text-red-500" />
            <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
            <button
              onClick={enableCamera}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {cameraReady && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${videoEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600'} text-white transition-colors`}
            >
              {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${audioEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-600'} text-white transition-colors`}
            >
              {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Stream Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's your stream about?"
        maxLength={100}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:border-orange-500"
      />

      {/* Toggles */}
      <div className="space-y-3 mb-6">
        <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
          <span className="text-white text-sm flex items-center gap-2">
            <Save className="w-4 h-4 text-gray-400" />
            Save replay after stream ends
          </span>
          <input
            type="checkbox"
            checked={saveReplay}
            onChange={(e) => setSaveReplay(e.target.checked)}
            className="accent-orange-500 w-4 h-4"
          />
        </label>

        <label className={`flex items-center justify-between p-3 rounded-lg ${isSubscribed ? 'bg-white/5 cursor-pointer' : 'bg-white/[0.02] opacity-50'}`}>
          <span className="text-white text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            {isSubscribed ? 'Charge viewers' : 'Upgrade to $14.99/mo to charge'}
          </span>
          <input
            type="checkbox"
            checked={wantToCharge}
            onChange={(e) => setWantToCharge(e.target.checked)}
            disabled={!isSubscribed}
            className="accent-orange-500 w-4 h-4"
          />
        </label>

        {wantToCharge && isSubscribed && (
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Stream price ($)"
            min="1"
            max="100"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        )}
      </div>

      {/* Go Live Button */}
      <button
        onClick={handleGoLive}
        disabled={!title.trim() || starting || !cameraReady}
        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
      >
        {starting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Going Live...
          </>
        ) : (
          <>
            <Radio className="w-5 h-5" />
            Start Streaming
          </>
        )}
      </button>
    </div>
  );
}
