# PodStation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Twitch-like live streaming tab (PodStation) to MyStation where anyone can go live with 4K video, hi-fi audio, live chat, and MyStation music as independent background audio.

**Architecture:** LiveKit (WebRTC) for real-time video/audio/chat. Next.js API routes for token generation and room management. Supabase for stream metadata and chat persistence. Zustand store for client state. Cloudflare R2 for replay storage.

**Tech Stack:** LiveKit (livekit-client, @livekit/components-react, livekit-server-sdk), Next.js 15 App Router, Supabase, Zustand, Tailwind CSS

---

## Phase 1: Foundation

### Task 1: Install LiveKit Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run:
```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npm install livekit-client @livekit/components-react livekit-server-sdk
```

**Step 2: Add env vars to `.env.local`**

```
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.com
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install LiveKit dependencies for PodStation"
```

---

### Task 2: Create Supabase Tables

**Files:**
- Run SQL via Supabase dashboard or `tools/supabase-sql.sh`

**Step 1: Create streams table**

```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  title TEXT NOT NULL DEFAULT 'Untitled Stream',
  is_live BOOLEAN DEFAULT false,
  viewer_count INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  livekit_room_name TEXT UNIQUE,
  save_replay BOOLEAN DEFAULT false,
  replay_url TEXT,
  thumbnail_url TEXT,
  background_track_id INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_streams_is_live ON streams(is_live);
CREATE INDEX idx_streams_user_id ON streams(user_id);
CREATE INDEX idx_streams_viewer_count ON streams(viewer_count DESC);
```

**Step 2: Create stream_chat table**

```sql
CREATE TABLE stream_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT NOT NULL,
  user_name TEXT,
  message TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stream_chat_stream_id ON stream_chat(stream_id);
CREATE INDEX idx_stream_chat_created_at ON stream_chat(created_at);
```

**Step 3: Enable RLS**

```sql
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;

-- Anyone can read live streams
CREATE POLICY "streams_select" ON streams FOR SELECT USING (true);

-- Users can insert/update their own streams
CREATE POLICY "streams_insert" ON streams FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "streams_update" ON streams FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Anyone can read chat
CREATE POLICY "chat_select" ON stream_chat FOR SELECT USING (true);

-- Logged in users can post chat
CREATE POLICY "chat_insert" ON stream_chat FOR INSERT
  WITH CHECK (user_email IS NOT NULL);
```

**Step 4: Commit** (no files to commit — DB only)

---

### Task 3: Create Zustand Store

**Files:**
- Create: `src/store/podStationStore.js`

**Step 1: Write the store**

```javascript
/**
 * MYSTATION - PodStation Store
 * State management for live streaming
 */

import { create } from 'zustand';

export const usePodStationStore = create((set, get) => ({
  // Active streams list (for grid)
  streams: [],
  setStreams: (streams) => set({ streams }),

  // Current stream being watched
  currentStream: null,
  setCurrentStream: (stream) => set({ currentStream: stream }),

  // Streaming state (when user is live)
  isStreaming: false,
  setIsStreaming: (val) => set({ isStreaming: val }),

  // Stream settings
  streamTitle: '',
  setStreamTitle: (title) => set({ streamTitle: title }),
  saveReplay: false,
  setSaveReplay: (val) => set({ saveReplay: val }),
  isPaidStream: false,
  setIsPaidStream: (val) => set({ isPaidStream: val }),
  streamPrice: 0,
  setStreamPrice: (price) => set({ streamPrice: price }),
  backgroundTrackId: null,
  setBackgroundTrackId: (id) => set({ backgroundTrackId: id }),

  // Chat
  chatMessages: [],
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [...state.chatMessages.slice(-200), msg]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // Viewer count
  viewerCount: 0,
  setViewerCount: (count) => set({ viewerCount: count }),

  // Reset on stream end
  resetStream: () => set({
    currentStream: null,
    isStreaming: false,
    streamTitle: '',
    saveReplay: false,
    isPaidStream: false,
    streamPrice: 0,
    backgroundTrackId: null,
    chatMessages: [],
    viewerCount: 0,
  }),
}));
```

**Step 2: Commit**

```bash
git add src/store/podStationStore.js
git commit -m "feat: add PodStation Zustand store"
```

---

### Task 4: Create LiveKit Helper

**Files:**
- Create: `src/lib/livekit.js`

**Step 1: Write the server-side helper**

```javascript
/**
 * MYSTATION - LiveKit Server Helper
 * Token generation and room management for PodStation
 */

import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace('wss://', 'https://');

export function createToken(roomName, participantName, isPublisher = false) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    ttl: '6h',
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isPublisher,
    canSubscribe: true,
    canPublishData: true, // for chat
  });

  return token.toJwt();
}

export function getRoomService() {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }
  return new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}

export async function listActiveRooms() {
  try {
    const roomService = getRoomService();
    const rooms = await roomService.listRooms();
    return rooms;
  } catch (err) {
    console.error('Failed to list rooms:', err);
    return [];
  }
}

export async function getRoom(roomName) {
  try {
    const roomService = getRoomService();
    const rooms = await roomService.listRooms([roomName]);
    return rooms[0] || null;
  } catch (err) {
    console.error('Failed to get room:', err);
    return null;
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/livekit.js
git commit -m "feat: add LiveKit server helper for PodStation"
```

---

### Task 5: Create API Routes

**Files:**
- Create: `src/app/api/podstation/token/route.js`
- Create: `src/app/api/podstation/rooms/route.js`
- Create: `src/app/api/podstation/stream/route.js`

**Step 1: Token route**

```javascript
// src/app/api/podstation/token/route.js
import { NextResponse } from 'next/server';
import { createToken } from '@/lib/livekit';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { roomName, userName, isPublisher } = await req.json();

    if (!roomName || !userName) {
      return NextResponse.json({ error: 'Missing roomName or userName' }, { status: 400 });
    }

    const token = await createToken(roomName, userName, isPublisher);

    return NextResponse.json({ token });
  } catch (err) {
    console.error('Token generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
```

**Step 2: Rooms route (list active streams)**

```javascript
// src/app/api/podstation/rooms/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data: streams, error } = await supabaseAdmin
      .from('streams')
      .select('*')
      .eq('is_live', true)
      .order('viewer_count', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ streams: streams || [] });
  } catch (err) {
    console.error('Failed to list streams:', err);
    return NextResponse.json({ streams: [] });
  }
}
```

**Step 3: Stream route (create/end stream)**

```javascript
// src/app/api/podstation/stream/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken } from '@/lib/livekit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create a new stream
export async function POST(req) {
  try {
    const { title, userEmail, userName, userId, saveReplay, isPaid, price, backgroundTrackId } = await req.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const roomName = `podstation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data: stream, error } = await supabaseAdmin
      .from('streams')
      .insert({
        user_id: userId || '00000000-0000-0000-0000-000000000000',
        user_email: userEmail,
        user_name: userName || userEmail.split('@')[0],
        title: title || 'Untitled Stream',
        is_live: true,
        livekit_room_name: roomName,
        save_replay: saveReplay || false,
        is_paid: isPaid || false,
        price: price || null,
        background_track_id: backgroundTrackId || null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Generate publisher token
    const token = await createToken(roomName, userName || userEmail.split('@')[0], true);

    return NextResponse.json({ stream, token, roomName });
  } catch (err) {
    console.error('Failed to create stream:', err);
    return NextResponse.json({ error: 'Failed to create stream' }, { status: 500 });
  }
}

// End a stream
export async function PATCH(req) {
  try {
    const { streamId, userEmail } = await req.json();

    if (!streamId || !userEmail) {
      return NextResponse.json({ error: 'Missing streamId or userEmail' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', streamId)
      .eq('user_email', userEmail)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ stream: data });
  } catch (err) {
    console.error('Failed to end stream:', err);
    return NextResponse.json({ error: 'Failed to end stream' }, { status: 500 });
  }
}
```

**Step 4: Commit**

```bash
git add src/app/api/podstation/
git commit -m "feat: add PodStation API routes (token, rooms, stream)"
```

---

## Phase 2: PodStation Grid Page

### Task 6: Create PodStation Main Page

**Files:**
- Create: `src/app/podstation/page.jsx`
- Create: `src/components/podstation/StreamCard.jsx`

**Step 1: StreamCard component**

```javascript
// src/components/podstation/StreamCard.jsx
'use client';

import { useState } from 'react';
import { Users, Clock, Radio } from 'lucide-react';
import Link from 'next/link';

function formatDuration(startedAt) {
  if (!startedAt) return '';
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function StreamCard({ stream }) {
  return (
    <Link href={`/podstation/${stream.id}`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group-hover:scale-[1.02]">
        {/* Thumbnail or gradient placeholder */}
        {stream.thumbnail_url ? (
          <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-900/40 via-mystation-navy to-purple-900/30 flex items-center justify-center">
            <Radio className="w-12 h-12 text-orange-500/50" />
          </div>
        )}

        {/* LIVE badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-bold text-white">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Viewer count */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
          <Users className="w-3 h-3" />
          {stream.viewer_count || 0}
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
          <Clock className="w-3 h-3" />
          {formatDuration(stream.started_at)}
        </div>

        {/* Paid badge */}
        {stream.is_paid && (
          <div className="absolute bottom-3 left-3 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
            ${stream.price}
          </div>
        )}
      </div>

      {/* Info below card */}
      <div className="mt-2 px-1">
        <h3 className="text-white font-medium text-sm truncate">{stream.title}</h3>
        <p className="text-gray-400 text-xs truncate">{stream.user_name}</p>
      </div>
    </Link>
  );
}
```

**Step 2: PodStation page**

```javascript
// src/app/podstation/page.jsx
import PodStationGrid from '@/components/podstation/PodStationGrid';

export const metadata = {
  title: 'PodStation | MyStation',
  description: 'Live streaming on MyStation. Go live, watch streams, chat in real-time.',
};

export default function PodStationPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-mystation-navy to-mystation-black" />
        <div className="relative max-w-6xl mx-auto px-4">
          <PodStationGrid />
        </div>
      </section>
    </div>
  );
}
```

**Step 3: PodStationGrid component**

```javascript
// src/components/podstation/PodStationGrid.jsx
'use client';

import { useEffect, useState } from 'react';
import { Radio, Plus } from 'lucide-react';
import Link from 'next/link';
import StreamCard from './StreamCard';

export default function PodStationGrid() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function fetchStreams() {
    try {
      const res = await fetch('/api/podstation/rooms');
      const data = await res.json();
      setStreams(data.streams || []);
    } catch (err) {
      console.error('Failed to fetch streams:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-orange-500" />
            PodStation
          </h1>
          <p className="text-gray-400 text-sm mt-1">Live streams from the MyStation community</p>
        </div>
        <Link
          href="/podstation/go-live"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Go Live
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No one's live yet</h2>
          <p className="text-gray-400 mb-6">Be the first to go live on PodStation</p>
          <Link
            href="/podstation/go-live"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Start Streaming
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/podstation/page.jsx src/components/podstation/
git commit -m "feat: add PodStation grid page with StreamCard"
```

---

## Phase 3: Go Live

### Task 7: Create Go Live Page

**Files:**
- Create: `src/app/podstation/go-live/page.jsx`
- Create: `src/components/podstation/GoLivePanel.jsx`

**Step 1: GoLivePanel component**

```javascript
// src/components/podstation/GoLivePanel.jsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video, Mic, MicOff, VideoOff, Settings, Radio,
  Save, DollarSign, Music, Loader2, Camera, Monitor
} from 'lucide-react';
import { useUserStore } from '@/store/playerStore';
import { usePodStationStore } from '@/store/podStationStore';

export default function GoLivePanel() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [title, setTitle] = useState('');
  const [saveReplay, setSaveReplay] = useState(false);
  const [wantToCharge, setWantToCharge] = useState(false);
  const [price, setPrice] = useState('');
  const [starting, setStarting] = useState(false);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  const { email, name, isSubscribed } = useUserStore();
  const is1499Tier = isSubscribed; // $14.99 tier check

  // Get camera preview
  useEffect(() => {
    async function startPreview() {
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
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Enumerate devices
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          video: deviceList.filter(d => d.kind === 'videoinput'),
          audio: deviceList.filter(d => d.kind === 'audioinput'),
        });
      } catch (err) {
        console.error('Camera access failed:', err);
      }
    }
    startPreview();
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleVideo = useCallback(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setVideoEnabled(v => !v);
    }
  }, [mediaStream]);

  const toggleAudio = useCallback(() => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setAudioEnabled(a => !a);
    }
  }, [mediaStream]);

  async function handleGoLive() {
    if (!title.trim()) return;
    setStarting(true);

    try {
      // Stop preview stream (LiveKit will create its own)
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }

      const res = await fetch('/api/podstation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          userEmail: email,
          userName: name || email?.split('@')[0],
          saveReplay,
          isPaid: wantToCharge && is1499Tier,
          price: wantToCharge && is1499Tier ? parseFloat(price) : null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Navigate to the live stream page
      router.push(`/podstation/${data.stream.id}?mode=host&token=${encodeURIComponent(data.token)}&room=${data.roomName}`);
    } catch (err) {
      console.error('Failed to go live:', err);
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
          className="w-full h-full object-cover"
        />
        {!videoEnabled && (
          <div className="absolute inset-0 bg-mystation-navy flex items-center justify-center">
            <VideoOff className="w-16 h-16 text-gray-500" />
          </div>
        )}

        {/* Camera/Mic toggles */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${videoEnabled ? 'bg-white/20' : 'bg-red-600'} text-white`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${audioEnabled ? 'bg-white/20' : 'bg-red-600'} text-white`}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Device selectors */}
      {devices.video.length > 1 && (
        <select
          value={selectedVideoDevice}
          onChange={(e) => setSelectedVideoDevice(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-3"
        >
          {devices.video.map(d => (
            <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>
          ))}
        </select>
      )}

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
        {/* Save Replay */}
        <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
          <span className="text-white text-sm flex items-center gap-2">
            <Save className="w-4 h-4 text-gray-400" />
            Save replay after stream ends
          </span>
          <input
            type="checkbox"
            checked={saveReplay}
            onChange={(e) => setSaveReplay(e.target.checked)}
            className="accent-orange-500"
          />
        </label>

        {/* Charge viewers */}
        <label className={`flex items-center justify-between p-3 rounded-lg ${is1499Tier ? 'bg-white/5 cursor-pointer' : 'bg-white/[0.02] opacity-50'}`}>
          <span className="text-white text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            {is1499Tier ? 'Charge viewers' : 'Upgrade to $14.99/mo to charge'}
          </span>
          <input
            type="checkbox"
            checked={wantToCharge}
            onChange={(e) => setWantToCharge(e.target.checked)}
            disabled={!is1499Tier}
            className="accent-orange-500"
          />
        </label>

        {wantToCharge && is1499Tier && (
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
        disabled={!title.trim() || starting}
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
```

**Step 2: Go Live page wrapper**

```javascript
// src/app/podstation/go-live/page.jsx
import GoLivePanel from '@/components/podstation/GoLivePanel';

export const metadata = {
  title: 'Go Live | PodStation | MyStation',
  description: 'Start streaming live on MyStation PodStation.',
};

export default function GoLivePage() {
  return (
    <div className="min-h-screen py-8">
      <GoLivePanel />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/podstation/go-live/ src/components/podstation/GoLivePanel.jsx
git commit -m "feat: add Go Live page with camera preview and stream settings"
```

---

## Phase 4: Stream View + Chat

### Task 8: Create Stream View Page

**Files:**
- Create: `src/app/podstation/[id]/page.jsx`
- Create: `src/components/podstation/StreamView.jsx`
- Create: `src/components/podstation/LiveChat.jsx`
- Create: `src/components/podstation/ChatMessage.jsx`

**Step 1: ChatMessage component**

```javascript
// src/components/podstation/ChatMessage.jsx
'use client';

import { useState } from 'react';
import { User, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ChatMessage({ msg }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const isEmoji = msg.emoji && !msg.message;

  return (
    <div className="relative group">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full text-left px-3 py-1.5 hover:bg-white/5 rounded transition-colors"
      >
        {isEmoji ? (
          <span className="text-sm">
            <span className="font-medium text-orange-400">{msg.user_name}</span>
            <span className="ml-2 text-lg">{msg.emoji}</span>
          </span>
        ) : (
          <p className="text-sm">
            <span className="font-medium text-orange-400">{msg.user_name}</span>
            <span className="text-gray-300 ml-2">{msg.message}</span>
          </p>
        )}
      </button>

      {/* User dropdown */}
      {showDropdown && (
        <div className="absolute left-3 bottom-full mb-1 bg-mystation-navy border border-white/10 rounded-lg p-3 shadow-xl z-50 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{msg.user_name}</p>
              <p className="text-gray-400 text-xs">{msg.user_email?.split('@')[0]}@...</p>
            </div>
          </div>
          <Link
            href={`/profile/${msg.user_email?.split('@')[0]}`}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            onClick={() => setShowDropdown(false)}
          >
            <ExternalLink className="w-3 h-3" />
            View Profile
          </Link>
        </div>
      )}
    </div>
  );
}
```

**Step 2: LiveChat component**

```javascript
// src/components/podstation/LiveChat.jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flame, X } from 'lucide-react';
import { usePodStationStore } from '@/store/podStationStore';
import { useUserStore } from '@/store/playerStore';
import ChatMessage from './ChatMessage';

export default function LiveChat({ roomName, dataChannel }) {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);
  const { chatMessages, addChatMessage } = usePodStationStore();
  const { email, name } = useUserStore();

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function sendMessage(text, emoji = null) {
    if (!text && !emoji) return;
    const msg = {
      id: Date.now(),
      user_name: name || email?.split('@')[0] || 'Anonymous',
      user_email: email,
      message: text || null,
      emoji: emoji || null,
      created_at: new Date().toISOString(),
    };

    // Send via LiveKit data channel
    if (dataChannel) {
      const encoder = new TextEncoder();
      dataChannel(encoder.encode(JSON.stringify(msg)));
    }

    addChatMessage(msg);
    setMessage('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message.trim());
    }
  }

  function sendFire() {
    sendMessage(null, '🔥');
  }

  return (
    <div className="flex flex-col h-full bg-mystation-darker/50 rounded-xl border border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-medium text-sm">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Chat is empty. Say something!</p>
        ) : (
          chatMessages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex gap-2">
        <button
          type="button"
          onClick={sendFire}
          className="p-2 bg-white/5 hover:bg-orange-600/30 rounded-lg transition-colors"
          title="Send fire"
        >
          <Flame className="w-5 h-5 text-orange-500" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 rounded-lg transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
```

**Step 3: StreamView component**

```javascript
// src/components/podstation/StreamView.jsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useRoomContext,
  useDataChannel,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Users, ArrowLeft, Share2, Radio, Copy, Check } from 'lucide-react';
import { usePodStationStore } from '@/store/podStationStore';
import { useUserStore } from '@/store/playerStore';
import LiveChat from './LiveChat';

function StreamContent({ stream, isHost }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const room = useRoomContext();
  const { addChatMessage, setViewerCount } = usePodStationStore();

  // Data channel for chat
  const { send, message: incomingMessage } = useDataChannel('chat');

  // Handle incoming chat messages
  useEffect(() => {
    if (incomingMessage) {
      try {
        const decoder = new TextDecoder();
        const msg = JSON.parse(decoder.decode(incomingMessage.payload));
        addChatMessage(msg);
      } catch (e) {}
    }
  }, [incomingMessage]);

  // Track viewer count
  useEffect(() => {
    if (room) {
      const update = () => setViewerCount(room.numParticipants - 1);
      room.on('participantConnected', update);
      room.on('participantDisconnected', update);
      update();
      return () => {
        room.off('participantConnected', update);
        room.off('participantDisconnected', update);
      };
    }
  }, [room]);

  const videoTrack = tracks.find(
    t => t.source === Track.Source.Camera && t.participant.isLocal === isHost
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)]">
      {/* Video */}
      <div className="flex-1 relative rounded-xl overflow-hidden bg-black">
        {videoTrack ? (
          <VideoTrack
            trackRef={videoTrack}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Radio className="w-20 h-20 text-gray-600 animate-pulse" />
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="w-full lg:w-80 h-64 lg:h-full">
        <LiveChat roomName={stream?.livekit_room_name} dataChannel={send} />
      </div>
    </div>
  );
}

export default function StreamView({ stream }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { email, name } = useUserStore();
  const { viewerCount, resetStream } = usePodStationStore();
  const [token, setToken] = useState(searchParams.get('token') || null);
  const [copied, setCopied] = useState(false);

  const isHost = searchParams.get('mode') === 'host';
  const roomName = searchParams.get('room') || stream?.livekit_room_name;
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Get viewer token if not host
  useEffect(() => {
    if (!isHost && !token && roomName) {
      fetch('/api/podstation/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          userName: name || email?.split('@')[0] || 'Viewer',
          isPublisher: false,
        }),
      })
        .then(r => r.json())
        .then(data => setToken(data.token))
        .catch(console.error);
    }
  }, [isHost, token, roomName]);

  function handleEndStream() {
    if (isHost && stream?.id) {
      fetch('/api/podstation/stream', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId: stream.id, userEmail: email }),
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

  if (!token || !livekitUrl) {
    return (
      <div className="flex items-center justify-center h-64">
        <Radio className="w-8 h-8 text-orange-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={handleEndStream} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">{stream?.title}</h1>
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
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          {isHost && (
            <button
              onClick={handleEndStream}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
            >
              End Stream
            </button>
          )}
        </div>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        video={isHost}
        audio={isHost}
        options={{
          videoCaptureDefaults: {
            resolution: { width: 3840, height: 2160 },
            facingMode: 'user',
          },
          audioCaptureDefaults: {
            sampleRate: 48000,
            channelCount: 2,
            echoCancellation: true,
            noiseSuppression: true,
          },
          publishDefaults: {
            videoCodec: 'vp9',
            videoEncoding: {
              maxBitrate: 15_000_000, // 15 Mbps for 4K
              maxFramerate: 30,
            },
            simulcast: true,
            audioPreset: { maxBitrate: 256_000 },
          },
        }}
      >
        <StreamContent stream={stream} isHost={isHost} />
      </LiveKitRoom>
    </div>
  );
}
```

**Step 4: Stream page wrapper**

```javascript
// src/app/podstation/[id]/page.jsx
import StreamView from '@/components/podstation/StreamView';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: stream } = await supabaseAdmin
    .from('streams')
    .select('title, user_name, is_live')
    .eq('id', id)
    .single();

  if (!stream) {
    return { title: 'Stream Not Found | MyStation' };
  }

  return {
    title: `${stream.user_name} is LIVE | MyStation`,
    description: stream.title,
    openGraph: {
      title: `${stream.user_name} is LIVE on MyStation`,
      description: stream.title,
      images: [`/api/og?title=${encodeURIComponent(stream.title)}&artist=${encodeURIComponent(stream.user_name)}&album=LIVE%20NOW&year=PodStation`],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${stream.user_name} is LIVE on MyStation`,
      description: stream.title,
    },
  };
}

export default async function StreamPage({ params }) {
  const { id } = await params;
  const { data: stream } = await supabaseAdmin
    .from('streams')
    .select('*')
    .eq('id', id)
    .single();

  return (
    <div className="min-h-screen py-4">
      <StreamView stream={stream} />
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/app/podstation/[id]/ src/components/podstation/StreamView.jsx src/components/podstation/LiveChat.jsx src/components/podstation/ChatMessage.jsx
git commit -m "feat: add stream view with 4K video, live chat, and fire emoji reactions"
```

---

## Phase 5: Navigation + Sharing

### Task 9: Add PodStation to Navigation

**Files:**
- Modify: `src/components/Navbar.jsx:41-48` (add to navItems)
- Modify: `src/components/BottomTabBar.jsx:7-13` (add to tabs)

**Step 1: Add to Navbar navItems array (line 41-48)**

Add after the Events entry:
```javascript
{ href: '/podstation', icon: Radio, label: 'PodStation', mobileOrder: 7 },
```

Import `Radio` from lucide-react at the top of the file.

**Step 2: Add to BottomTabBar tabs array (line 7-13)**

Replace the Search tab (users can search from navbar) or add as 6th tab:
```javascript
{ href: '/podstation', icon: Radio, label: 'Live' },
```

Import `Radio` from lucide-react at the top of the file.

**Step 3: Commit**

```bash
git add src/components/Navbar.jsx src/components/BottomTabBar.jsx
git commit -m "feat: add PodStation tab to desktop and mobile navigation"
```

---

### Task 10: Add to AccountWall bypass list

**Files:**
- Modify: `src/components/AccountWall.jsx` (OPEN_PATHS array)

**Step 1: Add /podstation to OPEN_PATHS**

The stream view page needs to work for shared links. Add `/podstation` to the bypass list so the email gate shows inline on the stream page (not a full wall block).

Actually — the email gate should STILL show. Just ensure `/podstation` routes render the stream page first, and the email input is part of the stream view UI (enter email to start watching). This matches the shared link play system.

**Step 2: Commit**

```bash
git add src/components/AccountWall.jsx
git commit -m "feat: configure PodStation access for shared stream links"
```

---

## Phase 6: Paid Streams + Replays (Future)

### Task 11: Paid Stream Gate (after core is working)
- Check subscriber tier before allowing charge toggle
- Stripe payment link for stream access
- Gate stream view behind payment verification

### Task 12: Replay Recording (after core is working)
- LiveKit Egress API to record stream to R2
- Store replay_url in streams table
- Replay playback page at `/podstation/[id]` (when stream is no longer live)

---

## Execution Order

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1. Foundation | Tasks 1-5 (deps, DB, store, lib, API) | BUILD FIRST |
| 2. Grid | Task 6 (browse page) | BUILD SECOND |
| 3. Go Live | Task 7 (streaming page) | BUILD THIRD |
| 4. Watch | Task 8 (viewer + chat) | BUILD FOURTH |
| 5. Nav + Share | Tasks 9-10 (navigation, OG, links) | BUILD FIFTH |
| 6. Paid + Replays | Tasks 11-12 | AFTER CORE WORKS |

**Total estimated components:** 8 new files, 2 modified files, 3 API routes, 2 DB tables, 1 store, 1 lib helper

**Dependencies:** LiveKit account (self-hosted or Cloud), Supabase tables created, env vars set
