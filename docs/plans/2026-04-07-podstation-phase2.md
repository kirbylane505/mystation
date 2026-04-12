# PodStation Phase 2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 6 features to PodStation: guest co-hosting, username prompt, recording/replay, music mix controls, host video fix, and auto-end on disconnect.

**Architecture:** All features build on existing LiveKit WebRTC stack + Supabase. New APIs for invite codes, egress recording, and LiveKit webhook. Client-side changes in StreamView, GoLivePanel, and new NamePrompt component. R2 for replay storage.

**Tech Stack:** Next.js 15 (App Router), LiveKit Cloud (livekit-server-sdk v2.15, @livekit/components-react v2.9), Supabase, Zustand, R2 (S3-compatible), Stripe

---

## Task 1: Database — Add `stream_invites` Table + Update `streams`

**Files:**
- Run SQL via Supabase

**Step 1: Create stream_invites table and add egress columns**

```sql
-- Guest invite codes
CREATE TABLE IF NOT EXISTS stream_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL UNIQUE,
  guest_name text,
  guest_email text,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '2 hours')
);

CREATE INDEX idx_stream_invites_code ON stream_invites(code);
CREATE INDEX idx_stream_invites_stream_id ON stream_invites(stream_id);

-- Egress recording ID column on streams
ALTER TABLE streams ADD COLUMN IF NOT EXISTS egress_id text;
```

**Step 2: Verify tables exist**

```bash
# Use supabase-sql.sh
bash /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "SELECT column_name FROM information_schema.columns WHERE table_name='stream_invites' ORDER BY ordinal_position;"
bash /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "SELECT column_name FROM information_schema.columns WHERE table_name='streams' WHERE column_name='egress_id';"
```

---

## Task 2: Username Prompt Component

**Files:**
- Create: `src/components/podstation/NamePrompt.jsx`
- Modify: `src/components/podstation/StreamView.jsx`

**Step 1: Create NamePrompt component**

Create `src/components/podstation/NamePrompt.jsx`:

```jsx
'use client';

import { useState, useEffect } from 'react';
import { User, Radio } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

export default function NamePrompt({ onSubmit }) {
  const { email, name } = useUserStore();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    // Auto-fill if user already has a name/email
    if (name) {
      onSubmit(name);
      return;
    }
    if (email) {
      onSubmit(email.split('@')[0]);
      return;
    }
    // Check sessionStorage
    const saved = sessionStorage.getItem('podstation_name');
    if (saved) {
      onSubmit(saved);
    }
  }, [name, email, onSubmit]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    sessionStorage.setItem('podstation_name', trimmed);
    onSubmit(trimmed);
  }

  // If user has name/email, this renders nothing (auto-submitted above)
  if (name || email) return null;
  if (sessionStorage.getItem('podstation_name')) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-mystation-navy border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
        <Radio className="w-10 h-10 text-orange-500 mx-auto mb-3" />
        <h2 className="text-white text-xl font-bold mb-1">Join the Stream</h2>
        <p className="text-gray-400 text-sm mb-4">Enter your name to chat and watch</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={!displayName.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white px-5 py-3 rounded-lg font-medium transition-colors"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Integrate NamePrompt into StreamView**

In `StreamView.jsx`, add state + gate before LiveKit connection:

- Add `const [viewerName, setViewerName] = useState(null);` at top
- Import NamePrompt
- If `!isHost && !viewerName`, show `<NamePrompt onSubmit={setViewerName} />`
- Pass `viewerName` to token fetch instead of auto-generated name
- Pass `viewerName` to `<StreamContent userName={viewerName || name}>` 

**Step 3: Commit**

```
feat(podstation): add username prompt for viewers
```

---

## Task 3: Guest Co-Hosting — Invite API + Link

**Files:**
- Create: `src/app/api/podstation/invite/route.js`
- Modify: `src/lib/livekit.js` (add canPublish grant for guests)

**Step 1: Create invite API**

Create `src/app/api/podstation/invite/route.js`:

```js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createToken } from '@/lib/livekit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST — Host generates invite link
export async function POST(req) {
  try {
    const { streamId, roomName } = await req.json();
    if (!streamId || !roomName) {
      return NextResponse.json({ error: 'Missing streamId or roomName' }, { status: 400 });
    }

    const code = crypto.randomUUID().slice(0, 8);

    const { error } = await supabaseAdmin
      .from('stream_invites')
      .insert({
        stream_id: streamId,
        code,
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ code });
  } catch (err) {
    console.error('Invite create error:', err);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

// GET — Guest redeems invite code, gets publisher token
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const guestName = searchParams.get('name') || 'Guest';

    if (!code) {
      return NextResponse.json({ error: 'Missing invite code' }, { status: 400 });
    }

    const { data: invite, error } = await supabaseAdmin
      .from('stream_invites')
      .select('*, streams(*)')
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    // Mark used
    await supabaseAdmin
      .from('stream_invites')
      .update({ used: true, guest_name: guestName })
      .eq('id', invite.id);

    // Generate publisher token for guest
    const token = await createToken(
      invite.streams.livekit_room_name,
      `${guestName} (Guest)`,
      true // canPublish = true for co-host
    );

    return NextResponse.json({
      token,
      roomName: invite.streams.livekit_room_name,
      streamId: invite.stream_id,
    });
  } catch (err) {
    console.error('Invite redeem error:', err);
    return NextResponse.json({ error: 'Failed to redeem invite' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```
feat(podstation): guest invite API — create + redeem codes
```

---

## Task 4: Guest Co-Hosting — UI (Invite Button + Split Video)

**Files:**
- Modify: `src/components/podstation/StreamView.jsx`

**Step 1: Add invite button for host**

In StreamView top bar (host only), add "Invite Guest" button that:
1. Calls `POST /api/podstation/invite` with streamId + roomName
2. Shows copyable invite URL: `{origin}/podstation/{streamId}?invite={code}`

**Step 2: Handle invite query param on viewer side**

In StreamView, detect `?invite=` query param:
1. Show NamePrompt first to get guest name
2. Call `GET /api/podstation/invite?code={code}&name={guestName}`
3. Get back publisher token — guest connects with canPublish=true
4. Set `isGuest = true` flag

**Step 3: Split-screen video layout**

In `StreamContent`, change video rendering:
- Filter all Camera tracks from `useTracks`
- If 1 track: full-screen (current behavior)
- If 2+ tracks: CSS grid `grid-cols-2` layout, each track gets half
- Label each with participant name

**Step 4: Commit**

```
feat(podstation): guest co-hosting UI — invite button + split video
```

---

## Task 5: Host Video Rendering Fix

**Files:**
- Modify: `src/components/podstation/StreamView.jsx`

**Step 1: Fix host self-view**

In `StreamContent`, the current code finds videoTrack via `tracks.find()`. For the host's own camera, the track may not appear via `useTracks` if `onlySubscribed` filtering is wrong.

Fix: After `useTracks`, also check `room.localParticipant`:

```js
// Get all camera tracks (including local for host)
const allVideoTracks = tracks.filter(t => t.source === Track.Source.Camera && t.publication?.track);

// If host and no video tracks found, try local participant directly
if (isHost && allVideoTracks.length === 0 && room?.localParticipant) {
  const localCam = room.localParticipant.getTrackPublication(Track.Source.Camera);
  if (localCam?.track) {
    // Render local camera via <video> element directly
    // localCam.track.attach() returns HTMLVideoElement
  }
}
```

**Step 2: Commit**

```
fix(podstation): host self-view camera track fallback
```

---

## Task 6: Music Mix Volume Controls

**Files:**
- Modify: `src/components/podstation/StreamView.jsx`

**Step 1: Add volume sliders for host**

In `StreamContent`, when `isHost`:
- Add state: `micVolume` (0-100, default 100), `musicVolume` (0-100, default 60)
- Render two sliders below video (only visible to host)
- On slider change, update `room._micGain.gain.value` and the music gain node
- Store gain nodes in refs accessible to the slider handlers

**Step 2: Add UI**

```jsx
{isHost && (
  <div className="flex gap-4 mt-2 bg-white/5 rounded-lg p-3">
    <div className="flex items-center gap-2 flex-1">
      <Mic className="w-4 h-4 text-green-400 flex-shrink-0" />
      <input type="range" min="0" max="100" value={micVolume}
        onChange={(e) => {
          const v = Number(e.target.value);
          setMicVolume(v);
          if (room?._micGain) room._micGain.gain.value = v / 100;
        }}
        className="flex-1 accent-green-500" />
      <span className="text-xs text-gray-400 w-8">{micVolume}%</span>
    </div>
    <div className="flex items-center gap-2 flex-1">
      <Music className="w-4 h-4 text-orange-400 flex-shrink-0" />
      <input type="range" min="0" max="100" value={musicVolume}
        onChange={(e) => {
          const v = Number(e.target.value);
          setMusicVolume(v);
          if (room?._musicGain) room._musicGain.gain.value = v / 100;
        }}
        className="flex-1 accent-orange-500" />
      <span className="text-xs text-gray-400 w-8">{musicVolume}%</span>
    </div>
  </div>
)}
```

**Step 3: Expose music gain node**

In the `publishMixedAudio` function, add `room._musicGain = musicGainNode;` after creating it (currently only `_micGain` is saved).

**Step 4: Commit**

```
feat(podstation): mic/music volume sliders for host
```

---

## Task 7: LiveKit Webhook — Auto-End on Disconnect

**Files:**
- Create: `src/app/api/podstation/webhook/route.js`
- Modify: `src/lib/livekit.js` (export WebhookReceiver helper)

**Step 1: Add webhook receiver to livekit.js**

Add to `src/lib/livekit.js`:

```js
import { WebhookReceiver } from 'livekit-server-sdk';

export function getWebhookReceiver() {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }
  return new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}
```

**Step 2: Create webhook endpoint**

Create `src/app/api/podstation/webhook/route.js`:

```js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWebhookReceiver } from '@/lib/livekit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.text();
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const receiver = getWebhookReceiver();
    const event = await receiver.receive(body, authHeader);

    console.log('LiveKit webhook:', event.event, event.room?.name);

    // Host left the room — end stream
    if (event.event === 'participant_left' && event.participant) {
      const isPublisher = event.participant.permission?.canPublish;
      const roomName = event.room?.name;

      if (isPublisher && roomName?.startsWith('podstation-')) {
        // Check if ANY publishers remain in the room
        const remainingPublishers = (event.room?.numPublishers || 0);

        if (remainingPublishers === 0) {
          // No publishers left — end the stream
          const { data, error } = await supabaseAdmin
            .from('streams')
            .update({ is_live: false, ended_at: new Date().toISOString() })
            .eq('livekit_room_name', roomName)
            .eq('is_live', true)
            .select()
            .single();

          if (data) {
            console.log(`Stream auto-ended: ${data.title} (${roomName})`);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('LiveKit webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

**Step 3: Client-side backup — room disconnect handler**

In StreamView's `StreamContent`, add:

```js
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
  // Also handle browser close
  window.addEventListener('beforeunload', onDisconnect);
  return () => {
    room.off('disconnected', onDisconnect);
    window.removeEventListener('beforeunload', onDisconnect);
  };
}, [room, isHost, stream?.id]);
```

**Step 4: Register webhook URL in LiveKit dashboard**

After deploy: Go to cloud.livekit.io → "mystation live key" project → Webhooks → Add URL: `https://mystationlive.com/api/podstation/webhook`

**Step 5: Commit**

```
feat(podstation): auto-end stream on host disconnect (webhook + client)
```

---

## Task 8: Recording/Replay — Egress API

**Files:**
- Create: `src/app/api/podstation/egress/route.js`
- Modify: `src/lib/livekit.js` (add EgressClient helper)
- Modify: `src/app/api/podstation/stream/route.js` (start egress on stream create)
- Modify: `src/app/api/podstation/webhook/route.js` (handle egress_ended event)

**Step 1: Add EgressClient to livekit.js**

Add to `src/lib/livekit.js`:

```js
import { EgressClient } from 'livekit-server-sdk';

export function getEgressClient() {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit credentials not configured');
  }
  return new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
}
```

**Step 2: Create egress API**

Create `src/app/api/podstation/egress/route.js`:

```js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEgressClient } from '@/lib/livekit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Start recording a room
export async function POST(req) {
  try {
    const { roomName, streamId } = await req.json();
    if (!roomName || !streamId) {
      return NextResponse.json({ error: 'Missing roomName or streamId' }, { status: 400 });
    }

    const egress = getEgressClient();

    // Room composite egress — records all video + audio into one MP4
    const output = {
      fileType: 0, // MP4
      filepath: `podstation-replays/${streamId}.mp4`,
      s3: {
        accessKey: process.env.R2_ACCESS_KEY_ID,
        secret: process.env.R2_SECRET_ACCESS_KEY,
        bucket: process.env.R2_BUCKET_NAME,
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        forcePathStyle: true,
      },
    };

    const info = await egress.startRoomCompositeEgress(roomName, { file: output }, {
      layout: 'grid',
      audioOnly: false,
    });

    // Save egress ID to stream
    await supabaseAdmin
      .from('streams')
      .update({ egress_id: info.egressId })
      .eq('id', streamId);

    return NextResponse.json({ egressId: info.egressId });
  } catch (err) {
    console.error('Egress start error:', err);
    return NextResponse.json({ error: 'Failed to start recording' }, { status: 500 });
  }
}

// Stop recording
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const egressId = searchParams.get('egressId');
    if (!egressId) {
      return NextResponse.json({ error: 'Missing egressId' }, { status: 400 });
    }

    const egress = getEgressClient();
    await egress.stopEgress(egressId);

    return NextResponse.json({ stopped: true });
  } catch (err) {
    console.error('Egress stop error:', err);
    return NextResponse.json({ error: 'Failed to stop recording' }, { status: 500 });
  }
}
```

**Step 3: Auto-start egress when saveReplay=true in stream creation**

In `src/app/api/podstation/stream/route.js` POST handler, after creating the stream, if `saveReplay` is true:

```js
if (saveReplay) {
  // Fire and forget — start recording
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com'}/api/podstation/egress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName, streamId: stream.id }),
  }).catch(err => console.error('Egress auto-start failed:', err));
}
```

**Step 4: Handle egress_ended webhook for replay URL**

In `src/app/api/podstation/webhook/route.js`, add handler:

```js
if (event.event === 'egress_ended' && event.egressInfo) {
  const egressId = event.egressInfo.egressId;
  const replayUrl = `${process.env.R2_PUBLIC_URL}/podstation-replays/${egressId}.mp4`;

  // Find stream by egress_id and set replay_url
  await supabaseAdmin
    .from('streams')
    .update({ replay_url: replayUrl })
    .eq('egress_id', egressId);

  console.log('Replay saved:', replayUrl);
}
```

Actually — the file is named by streamId not egressId. Fix the replay URL lookup:

```js
if (event.event === 'egress_ended' && event.egressInfo) {
  const egressId = event.egressInfo.egressId;

  // Find stream, get its ID for the file path
  const { data: stream } = await supabaseAdmin
    .from('streams')
    .select('id')
    .eq('egress_id', egressId)
    .single();

  if (stream) {
    const replayUrl = `${process.env.R2_PUBLIC_URL}/podstation-replays/${stream.id}.mp4`;
    await supabaseAdmin
      .from('streams')
      .update({ replay_url: replayUrl })
      .eq('id', stream.id);
    console.log('Replay saved:', replayUrl);
  }
}
```

**Step 5: Commit**

```
feat(podstation): recording/replay via LiveKit Egress → R2
```

---

## Task 9: PodStation Grid — Show Replays

**Files:**
- Modify: `src/app/api/podstation/rooms/route.js` (add replay query)
- Modify: `src/components/podstation/PodStationLanding.jsx` (show replays section)
- Modify: `src/components/podstation/StreamCard.jsx` (replay badge + link)

**Step 1: Add replays to rooms API**

In `GET /api/podstation/rooms`, after fetching live streams, also fetch recent replays:

```js
const { data: replays } = await supabaseAdmin
  .from('streams')
  .select('*')
  .eq('is_live', false)
  .not('replay_url', 'is', null)
  .order('ended_at', { ascending: false })
  .limit(12);

return NextResponse.json({ streams: streams || [], replays: replays || [] });
```

**Step 2: Show replays in PodStationLanding**

Below the live streams grid, add a "Recent Replays" section with StreamCards that link to the replay URL (or a replay page). For now, link directly to the MP4 via `<a href>` (external, not internal nav).

**Step 3: Update StreamCard for replay state**

If `stream.is_live === false && stream.replay_url`, show "REPLAY" badge (blue) instead of "LIVE" badge (red). Show `ended_at` duration instead of elapsed time.

**Step 4: Commit**

```
feat(podstation): show replays grid on PodStation landing
```

---

## Task 10: Final Integration + Deploy

**Step 1: Local build test**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npx next build
```

Expected: 0 errors

**Step 2: Deploy**

```bash
./deploy.sh
```

**Step 3: Verify all pages**

```bash
for p in / /music /search /merch /podstation; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 4: Register LiveKit webhook**

Go to cloud.livekit.io → "mystation live key" → Webhooks → Add:
`https://mystationlive.com/api/podstation/webhook`

**Step 5: Commit all remaining changes**

```
feat(podstation): phase 2 complete — guests, names, replay, mix controls, auto-end
```

---

## Dependency Order

```
Task 1 (DB) → can run first, no deps
Task 2 (NamePrompt) → no deps
Task 3 (Invite API) → needs Task 1 (stream_invites table)
Task 4 (Invite UI + Split Video) → needs Task 3
Task 5 (Host Video Fix) → no deps, can parallel with Task 2
Task 6 (Music Mix Controls) → no deps
Task 7 (Webhook Auto-End) → no deps
Task 8 (Egress Recording) → needs Task 7 (webhook handler to extend)
Task 9 (Replay Grid) → needs Task 8
Task 10 (Deploy) → needs all above
```

**Parallel groups:**
- Group A: Task 1, Task 2, Task 5, Task 6, Task 7 (all independent)
- Group B: Task 3 (after Task 1), Task 8 (after Task 7)
- Group C: Task 4 (after Task 3), Task 9 (after Task 8)
- Group D: Task 10 (after all)
