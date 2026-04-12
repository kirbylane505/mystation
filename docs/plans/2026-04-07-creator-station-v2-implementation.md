# Creator Station v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Kill the fake localStorage creator system, unify on real Supabase backend, add free follow system with push alerts, video saves from live streams, creator-to-creator messaging, and FB/IG-style profile editing.

**Architecture:** System A (localStorage at `/station/*`) gets deleted. All creator functionality runs through System B (Supabase at `/creators/*`, `/dashboard/*`, `/artist/*`). New tables for videos and messages. LiveKit PodStation integration for live streaming on creator profiles. Push notifications to followers on live/upload events.

**Tech Stack:** Next.js 15 (App Router), Supabase (Postgres + Storage), Stripe, LiveKit, web-push, R2 CDN, Zustand (remove stationStore)

---

## Task 1: Database — Create New Tables & Alter Existing

**Files:**
- Modify: `src/lib/db/creator-platform-schema.sql` (append new tables)
- Execute: SQL via Supabase SQL Editor or `tools/supabase-sql.sh`

**Step 1: Add push_subscription to creator_followers**

```sql
ALTER TABLE creator_followers ADD COLUMN IF NOT EXISTS push_subscription JSONB;
```

**Step 2: Add is_live and current_stream_id to creators**

```sql
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS current_stream_id TEXT;
```

**Step 3: Add fitness_wellness to category check constraint**

```sql
ALTER TABLE creators DROP CONSTRAINT IF EXISTS creators_category_check;
ALTER TABLE creators ADD CONSTRAINT creators_category_check 
  CHECK (category IN ('musician', 'podcaster', 'producer', 'dj', 'content_creator', 'fitness_wellness'));
```

**Step 4: Create creator_videos table**

```sql
CREATE TABLE IF NOT EXISTS creator_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  stream_id UUID,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_videos_creator ON creator_videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_videos_status ON creator_videos(status);

ALTER TABLE creator_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active videos"
  ON creator_videos FOR SELECT USING (status = 'active');
CREATE POLICY "Creators can insert own videos"
  ON creator_videos FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));
CREATE POLICY "Creators can update own videos"
  ON creator_videos FOR UPDATE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));
```

**Step 5: Create creator_messages table**

```sql
CREATE TABLE IF NOT EXISTS creator_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_messages_receiver ON creator_messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_creator_messages_conversation ON creator_messages(sender_id, receiver_id);

ALTER TABLE creator_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own messages"
  ON creator_messages FOR SELECT
  USING (
    sender_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid()))
    OR receiver_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid()))
  );
CREATE POLICY "Creators can send messages"
  ON creator_messages FOR INSERT
  WITH CHECK (sender_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));
CREATE POLICY "Creators can mark own received messages read"
  ON creator_messages FOR UPDATE
  USING (receiver_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));
```

**Step 6: Update schema file**

Append the new tables and alterations to `src/lib/db/creator-platform-schema.sql`.

**Step 7: Run SQL via supabase-sql.sh**

```bash
/Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "ALTER TABLE creator_followers ADD COLUMN IF NOT EXISTS push_subscription JSONB;"
```

Run each SQL statement. Verify with:
```bash
/Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "SELECT column_name FROM information_schema.columns WHERE table_name='creator_videos' ORDER BY ordinal_position;"
```

**Step 8: Commit**

```bash
git add src/lib/db/creator-platform-schema.sql
git commit -m "feat: add creator_videos, creator_messages tables + alter creators/followers"
```

---

## Task 2: Kill System A — Delete Fake localStorage Creator System

**Files:**
- Delete: `src/store/stationStore.js`
- Delete: `src/app/station/create/page.jsx`
- Delete: `src/app/station/create/layout.jsx`
- Delete: `src/app/station/dashboard/page.jsx`
- Delete: `src/app/station/[username]/page.jsx`
- Delete: `src/app/station/[username]/CreatorStationContent.jsx`
- Modify: `src/components/Navbar.jsx` — remove stationStore import + fix links

**Step 1: Delete System A files**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
rm src/store/stationStore.js
rm -rf src/app/station/
```

**Step 2: Fix Navbar.jsx — remove stationStore import (line 20)**

Remove this line:
```javascript
import { useStationStore } from '@/store/stationStore';
```

Remove this line:
```javascript
const isCreator = useStationStore(s => s.isCreator);
```

**Step 3: Fix Navbar.jsx — replace desktop creator button (lines 263-280)**

Replace the entire `{/* Create Station / Dashboard Button */}` block with:

```jsx
{/* Create Station / Dashboard Button */}
<Link
  href="/creators/signup"
  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition text-white font-bold text-sm"
>
  <Crown size={16} />
  Create Station
</Link>
```

NOTE: We remove the `isCreator` conditional entirely. Logged-in creators access their dashboard via `/dashboard` which they can reach from their profile or the "Creators" nav item. The CTA is always "Create Station" for non-creators. If we want to show "My Station" for logged-in creators later, we'll check via the `mystation-email` cookie + API call — NOT localStorage.

**Step 4: Fix Navbar.jsx — replace mobile creator button (lines 527-546)**

Replace the mobile `{/* Create Station / Dashboard Button - Mobile */}` block with:

```jsx
{/* Create Station Button - Mobile */}
<Link
  href="/creators/signup"
  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-bold mb-2"
  onClick={() => setMobileMenuOpen(false)}
>
  <Crown size={16} />
  Create Your Station
</Link>
```

**Step 5: Verify build compiles**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npx next build 2>&1 | tail -20
```

Expected: Build succeeds with 0 errors (no remaining imports of stationStore).

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: kill System A (localStorage creator) — unify on Supabase backend"
```

---

## Task 3: Fix Follow System — Push Subscriptions + Bug Fix

**Files:**
- Modify: `src/app/api/creators/follow/route.js`
- Modify: `src/app/artist/[slug]/page.jsx` (follow button bug fix)

**Step 1: Fix the double-fetch bug in artist/[slug]/page.jsx (lines 28-57)**

The current `handleFollow` sends TWO fetch calls for unfollow (one POST with no body, then another DELETE). Replace the entire `handleFollow` function:

```javascript
const handleFollow = async () => {
  const email = document.cookie
    .split('; ')
    .find((c) => c.startsWith('mystation-email='))
    ?.split('=')[1];

  if (!email) {
    alert('Enter your email to follow creators');
    return;
  }

  const decodedEmail = decodeURIComponent(email);

  if (following) {
    await fetch(`/api/creators/follow?creatorSlug=${slug}&followerEmail=${encodeURIComponent(decodedEmail)}`, {
      method: 'DELETE',
    });
  } else {
    await fetch('/api/creators/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorSlug: slug, followerEmail: decodedEmail }),
    });
  }

  setFollowing(!following);
};
```

**Step 2: Update POST in follow/route.js to accept push_subscription**

In the POST handler, after the upsert, add push_subscription support:

```javascript
const { creatorSlug, followerEmail, pushSubscription } = await request.json();
```

And update the upsert:
```javascript
await supabase
  .from('creator_followers')
  .upsert(
    { 
      creator_id: creator.id, 
      follower_email: followerEmail.toLowerCase(),
      ...(pushSubscription ? { push_subscription: pushSubscription } : {}),
    },
    { onConflict: 'creator_id,follower_email' }
  );
```

**Step 3: Commit**

```bash
git add src/app/api/creators/follow/route.js src/app/artist/\[slug\]/page.jsx
git commit -m "fix: follow button double-fetch bug + add push subscription support"
```

---

## Task 4: Creator Profile Image Upload API

**Files:**
- Create: `src/app/api/creators/upload-image/route.js`
- Modify: `src/app/dashboard/settings/page.jsx` — add file upload inputs

**Step 1: Create upload-image route**

Create `src/app/api/creators/upload-image/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'avatar' or 'banner'
    const email = formData.get('email');

    if (!file || !type || !email) {
      return NextResponse.json({ error: 'file, type, and email required' }, { status: 400 });
    }

    if (!['avatar', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'type must be avatar or banner' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug')
      .eq('email', email)
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `creators/${creator.slug}/${type}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[upload-image] Storage error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filename);

    // Update creator record
    const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
    await supabase
      .from('creators')
      .update({ [field]: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', creator.id);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('[upload-image] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Step 2: Update dashboard/settings/page.jsx — add file upload for avatar and banner**

Replace the Avatar URL text input with a file upload input. Replace the entire component with the upgraded version that has:
- File input for avatar (with preview)
- File input for banner (with preview)
- Category dropdown
- All existing fields preserved

See design doc for the full settings page spec. Key change: replace `<input type="url" ... avatar_url>` with:

```jsx
<div>
  <label className="block text-sm text-[#a1a1aa] mb-1">Profile Photo</label>
  {form.avatar_url && (
    <img src={form.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover mb-2" />
  )}
  <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files[0], 'avatar')}
    className="w-full text-sm text-[#a1a1aa] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#27272a] file:text-white hover:file:bg-[#3f3f46]" />
</div>
```

Add the `uploadImage` helper function:

```javascript
const uploadImage = async (file, type) => {
  if (!file) return;
  const email = getEmail();
  if (!email) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('type', type);
  fd.append('email', email);

  const res = await fetch('/api/creators/upload-image', { method: 'POST', body: fd });
  const data = await res.json();
  if (data.url) {
    setForm(prev => ({ ...prev, [type === 'avatar' ? 'avatar_url' : 'banner_url']: data.url }));
  }
};
```

Also add banner upload, and a category dropdown with these options:
```javascript
const categories = [
  { value: 'musician', label: 'Musician' },
  { value: 'podcaster', label: 'Podcaster' },
  { value: 'producer', label: 'Producer' },
  { value: 'dj', label: 'DJ' },
  { value: 'content_creator', label: 'Content Creator' },
  { value: 'fitness_wellness', label: 'Fitness & Wellness' },
];
```

**Step 3: Update settings API to allow category updates**

In `src/app/api/creators/settings/route.js` line 25, add 'category' to allowed fields:
```javascript
const allowed = ['display_name', 'bio', 'avatar_url', 'banner_url', 'genre_tags', 'social_links', 'category'];
```

**Step 4: Commit**

```bash
git add src/app/api/creators/upload-image/route.js src/app/dashboard/settings/page.jsx src/app/api/creators/settings/route.js
git commit -m "feat: creator profile image upload + category editing (FB/IG style)"
```

---

## Task 5: Creator Videos API + Dashboard Page

**Files:**
- Create: `src/app/api/creators/videos/route.js`
- Create: `src/app/dashboard/videos/page.jsx`
- Modify: `src/app/dashboard/layout.jsx` — add Videos nav item

**Step 1: Create videos API route**

Create `src/app/api/creators/videos/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// List creator's videos
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');
  const email = searchParams.get('email');

  const supabase = getSupabaseAdmin();

  let query = supabase.from('creator_videos').select('*').eq('status', 'active').order('created_at', { ascending: false });

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  } else if (email) {
    const { data: creator } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
    if (!creator) return NextResponse.json({ videos: [] });
    query = query.eq('creator_id', creator.id);
  }

  const { data: videos } = await query.limit(50);
  return NextResponse.json({ videos: videos || [] });
}

// Save a video (from live stream recording)
export async function POST(request) {
  try {
    const { email, title, description, videoUrl, thumbnailUrl, duration, streamId } = await request.json();
    if (!email || !title || !videoUrl) {
      return NextResponse.json({ error: 'email, title, and videoUrl required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, subscription_status')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: 'Active creator required' }, { status: 403 });

    const { data: video, error } = await supabase
      .from('creator_videos')
      .insert({
        creator_id: creator.id,
        title,
        description: description || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        duration: duration || null,
        stream_id: streamId || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to save video' }, { status: 500 });

    return NextResponse.json({ video });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Update video (title, description, status)
export async function PATCH(request) {
  try {
    const { email, id, ...updates } = await request.json();
    if (!email || !id) return NextResponse.json({ error: 'email and id required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    const allowed = ['title', 'description', 'thumbnail_url', 'status'];
    const safe = {};
    for (const k of allowed) { if (updates[k] !== undefined) safe[k] = updates[k]; }
    safe.updated_at = new Date().toISOString();

    await supabase.from('creator_videos').update(safe).eq('id', id).eq('creator_id', creator.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Step 2: Create dashboard videos page**

Create `src/app/dashboard/videos/page.jsx` — a page listing the creator's saved videos with title, thumbnail, date, view count, and a delete/hide button. Similar layout to the existing `dashboard/merch/page.jsx` pattern.

**Step 3: Add Videos to dashboard layout nav**

In `src/app/dashboard/layout.jsx`, add to `NAV_ITEMS` array after Upload:

```javascript
{ href: '/dashboard/videos', label: 'Videos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
```

**Step 4: Commit**

```bash
git add src/app/api/creators/videos/route.js src/app/dashboard/videos/page.jsx src/app/dashboard/layout.jsx
git commit -m "feat: creator videos API + dashboard videos page"
```

---

## Task 6: Creator Messaging API + Dashboard Page

**Files:**
- Create: `src/app/api/creators/messages/route.js`
- Create: `src/app/dashboard/messages/page.jsx`
- Modify: `src/app/dashboard/layout.jsx` — add Messages nav item

**Step 1: Create messages API route**

Create `src/app/api/creators/messages/route.js`:

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// Get conversations (grouped by other creator)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const withCreatorId = searchParams.get('withCreatorId');

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: me } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
  if (!me) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  if (withCreatorId) {
    // Get messages in a specific conversation
    const { data: messages } = await supabase
      .from('creator_messages')
      .select('id, sender_id, receiver_id, message, read, created_at')
      .or(`and(sender_id.eq.${me.id},receiver_id.eq.${withCreatorId}),and(sender_id.eq.${withCreatorId},receiver_id.eq.${me.id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    // Mark received messages as read
    await supabase
      .from('creator_messages')
      .update({ read: true })
      .eq('sender_id', withCreatorId)
      .eq('receiver_id', me.id)
      .eq('read', false);

    return NextResponse.json({ messages: messages || [], myId: me.id });
  }

  // Get all conversations (latest message per partner)
  const { data: sent } = await supabase
    .from('creator_messages')
    .select('id, sender_id, receiver_id, message, read, created_at')
    .eq('sender_id', me.id)
    .order('created_at', { ascending: false });

  const { data: received } = await supabase
    .from('creator_messages')
    .select('id, sender_id, receiver_id, message, read, created_at')
    .eq('receiver_id', me.id)
    .order('created_at', { ascending: false });

  const all = [...(sent || []), ...(received || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Group by conversation partner
  const conversations = {};
  for (const msg of all) {
    const partnerId = msg.sender_id === me.id ? msg.receiver_id : msg.sender_id;
    if (!conversations[partnerId]) {
      conversations[partnerId] = { partnerId, lastMessage: msg, unread: 0 };
    }
    if (msg.receiver_id === me.id && !msg.read) {
      conversations[partnerId].unread++;
    }
  }

  // Get partner names
  const partnerIds = Object.keys(conversations);
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from('creators')
      .select('id, display_name, slug, avatar_url')
      .in('id', partnerIds);

    for (const p of (partners || [])) {
      if (conversations[p.id]) {
        conversations[p.id].partner = p;
      }
    }
  }

  return NextResponse.json({ conversations: Object.values(conversations), myId: me.id });
}

// Send a message
export async function POST(request) {
  try {
    const { email, receiverId, message } = await request.json();
    if (!email || !receiverId || !message) {
      return NextResponse.json({ error: 'email, receiverId, and message required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: me } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
    if (!me) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    if (me.id === receiverId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const { data: msg, error } = await supabase
      .from('creator_messages')
      .insert({ sender_id: me.id, receiver_id: receiverId, message: message.trim() })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    return NextResponse.json({ message: msg });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Step 2: Create dashboard messages page**

Create `src/app/dashboard/messages/page.jsx` — shows conversation list on the left, active conversation on the right. Mobile: list view, tap to open conversation. Include:
- Conversation list with partner avatar, name, last message preview, unread badge
- Message thread with sender/receiver bubbles
- Text input + send button
- Poll for new messages every 10 seconds

**Step 3: Add Messages to dashboard layout nav**

In `src/app/dashboard/layout.jsx`, add to `NAV_ITEMS` array after Settings:

```javascript
{ href: '/dashboard/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
```

**Step 4: Commit**

```bash
git add src/app/api/creators/messages/route.js src/app/dashboard/messages/page.jsx src/app/dashboard/layout.jsx
git commit -m "feat: creator-to-creator DM messaging system"
```

---

## Task 7: Rebuild Public Creator Profile (`/artist/[slug]`)

**Files:**
- Modify: `src/app/artist/[slug]/page.jsx` — full rebuild
- Modify: `src/app/api/creators/[slug]/route.js` — add videos + is_live data

**Step 1: Update API to return videos and live status**

In `src/app/api/creators/[slug]/route.js`, add to the creator select:
```javascript
.select('id, slug, display_name, category, bio, avatar_url, banner_url, genre_tags, social_links, verified, track_count, follower_count, total_plays, is_live, current_stream_id, created_at')
```

Add videos query after merch:
```javascript
// Get their videos
const { data: videos } = await supabase
  .from('creator_videos')
  .select('id, title, description, video_url, thumbnail_url, duration, views, created_at')
  .eq('creator_id', creator.id)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(20);
```

Return videos in response:
```javascript
return NextResponse.json({
  creator,
  tracks: tracks || [],
  merch: merch || [],
  videos: videos || [],
});
```

**Step 2: Rebuild artist/[slug]/page.jsx**

Full rebuild with:
1. Banner image (full width)
2. Avatar + display name + category + genre tags
3. LIVE NOW badge (red pulsing dot) when `creator.is_live` — links to `/podstation/${creator.current_stream_id}`
4. Stats row: followers, tracks, plays
5. Two CTAs: **Follow** (free, email prompt) + **Subscribe to MyStation** (opens subscribe modal)
6. Bio section
7. Videos section (grid of thumbnails, click to play)
8. Tracks section (existing)
9. Merch section (existing)
10. Social links
11. Message button (only if viewer is also a creator — check `mystation-email` cookie)

The Follow button should:
- Check for `mystation-email` cookie
- If no cookie, show an email input modal (simple: email field + submit)
- Set `mystation-email` cookie on submit
- POST to `/api/creators/follow`
- Request push notification permission + save subscription

The Subscribe button should:
- Call `usePlayerStore.getState().openSubscribeModal()` (existing)

**Step 3: Commit**

```bash
git add src/app/artist/\[slug\]/page.jsx src/app/api/creators/\[slug\]/route.js
git commit -m "feat: rebuild creator profile — live badge, follow+subscribe CTAs, videos section"
```

---

## Task 8: Link PodStation to Creator Profiles

**Files:**
- Modify: `src/app/api/podstation/stream/route.js` — set creator.is_live when stream starts
- Modify: `src/app/api/podstation/webhook/route.js` — clear creator.is_live when stream ends + save video

**Step 1: Update stream create (POST) to set creator.is_live**

In `src/app/api/podstation/stream/route.js`, after the stream insert succeeds, add:

```javascript
// If streamer is a creator, mark them as live
const { data: streamerCreator } = await supabaseAdmin
  .from('creators')
  .select('id')
  .eq('email', userEmail)
  .maybeSingle();

if (streamerCreator) {
  await supabaseAdmin
    .from('creators')
    .update({ is_live: true, current_stream_id: stream.id })
    .eq('id', streamerCreator.id);

  // Send push to creator's followers (not all MyStation users)
  sendCreatorLiveNotification(streamerCreator.id, stream, userName || userEmail.split('@')[0]);
}
```

Add the creator-specific notification function:

```javascript
async function sendCreatorLiveNotification(creatorId, stream, streamerName) {
  try {
    const webpush = getWebPush();
    if (!webpush) return;

    const { data: followers } = await supabaseAdmin
      .from('creator_followers')
      .select('push_subscription')
      .eq('creator_id', creatorId)
      .not('push_subscription', 'is', null);

    if (!followers || followers.length === 0) return;

    const payload = JSON.stringify({
      title: `${streamerName} is LIVE!`,
      body: stream.title,
      url: `/podstation/${stream.id}`,
      image: '/images/mystation-logo.png',
    });

    const results = await Promise.allSettled(
      followers.map(f =>
        webpush.sendNotification(f.push_subscription, payload).catch(() => null)
      )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Creator LIVE push sent to ${sent}/${followers.length} followers`);
  } catch (err) {
    console.error('Creator live push error:', err);
  }
}
```

**Step 2: Update stream end (PATCH) to clear creator.is_live**

In the PATCH handler, after updating the stream to `is_live: false`, add:

```javascript
// Clear creator live status
if (data?.user_email) {
  await supabaseAdmin
    .from('creators')
    .update({ is_live: false, current_stream_id: null })
    .eq('email', data.user_email);
}
```

**Step 3: Update webhook to clear is_live on auto-end + prompt video save**

In `src/app/api/podstation/webhook/route.js`, in the `participant_left` block after setting stream to `is_live: false`, add:

```javascript
// Clear creator live status
if (data?.user_email) {
  await supabaseAdmin
    .from('creators')
    .update({ is_live: false, current_stream_id: null })
    .eq('email', data.user_email);
}
```

In the `egress_ended` block, after saving the replay URL, also create a `creator_videos` record:

```javascript
if (stream) {
  const replayUrl = `${process.env.R2_PUBLIC_URL}/podstation-replays/${stream.id}.mp4`;

  // Check if streamer is a creator — auto-save to their videos
  const { data: streamData } = await supabaseAdmin
    .from('streams')
    .select('user_email, title, save_replay')
    .eq('id', stream.id)
    .single();

  if (streamData?.save_replay) {
    const { data: creator } = await supabaseAdmin
      .from('creators')
      .select('id')
      .eq('email', streamData.user_email)
      .maybeSingle();

    if (creator) {
      await supabaseAdmin
        .from('creator_videos')
        .insert({
          creator_id: creator.id,
          title: streamData.title || 'Live Stream Recording',
          video_url: replayUrl,
          stream_id: stream.id,
        });
      console.log('Creator video saved from stream:', stream.id);
    }
  }

  await supabaseAdmin
    .from('streams')
    .update({ replay_url: replayUrl })
    .eq('id', stream.id);
}
```

**Step 4: Commit**

```bash
git add src/app/api/podstation/stream/route.js src/app/api/podstation/webhook/route.js
git commit -m "feat: link PodStation to creator profiles — is_live flag + auto-save videos"
```

---

## Task 9: Push Notifications for Followers on Track/Video Upload

**Files:**
- Modify: `src/app/api/creators/upload/route.js` — notify followers on new track
- Modify: `src/app/api/creators/videos/route.js` — notify followers on new video

**Step 1: Add follower notification to upload route**

In `src/app/api/creators/upload/route.js`, after the track insert succeeds, add:

```javascript
// Notify followers
notifyFollowers(creator.id, creator.slug, `New track: ${title}`);
```

Add the helper (import getWebPush at top):

```javascript
import { getWebPush } from '@/lib/push';

async function notifyFollowers(creatorId, creatorSlug, body) {
  try {
    const webpush = getWebPush();
    if (!webpush) return;

    const supabase = getSupabaseAdmin();
    const { data: followers } = await supabase
      .from('creator_followers')
      .select('push_subscription')
      .eq('creator_id', creatorId)
      .not('push_subscription', 'is', null);

    if (!followers || followers.length === 0) return;

    const payload = JSON.stringify({
      title: 'New on MyStation',
      body,
      url: `/artist/${creatorSlug}`,
      image: '/images/mystation-logo.png',
    });

    await Promise.allSettled(
      followers.map(f => webpush.sendNotification(f.push_subscription, payload).catch(() => null))
    );
  } catch (err) {
    console.error('Follower notification error:', err);
  }
}
```

**Step 2: Add same pattern to videos POST route**

Same pattern — after video insert, notify followers.

**Step 3: Commit**

```bash
git add src/app/api/creators/upload/route.js src/app/api/creators/videos/route.js
git commit -m "feat: push notifications to followers on new tracks and videos"
```

---

## Task 10: Update Creator Signup Categories + Redirect Stale URLs

**Files:**
- Modify: `src/app/api/creators/signup/route.js` — add fitness_wellness category
- Create: `src/app/station/create/page.jsx` — redirect to `/creators/signup`
- Create: `src/app/station/dashboard/page.jsx` — redirect to `/dashboard`

**Step 1: Update valid categories in signup route (line 34)**

```javascript
const validCategories = ['musician', 'podcaster', 'producer', 'dj', 'content_creator', 'fitness_wellness'];
```

**Step 2: Create redirect pages for old URLs**

Create `src/app/station/create/page.jsx`:
```jsx
import { redirect } from 'next/navigation';
export default function StationCreateRedirect() {
  redirect('/creators/signup');
}
```

Create `src/app/station/dashboard/page.jsx`:
```jsx
import { redirect } from 'next/navigation';
export default function StationDashboardRedirect() {
  redirect('/dashboard');
}
```

**Step 3: Commit**

```bash
git add src/app/api/creators/signup/route.js src/app/station/create/page.jsx src/app/station/dashboard/page.jsx
git commit -m "feat: add fitness_wellness category + redirect old station URLs"
```

---

## Task 11: Build & Deploy Verification

**Step 1: Run local build**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npx next build 2>&1 | tail -30
```

Expected: 0 errors, all pages compile.

**Step 2: Verify no stationStore imports remain**

```bash
grep -r "stationStore" src/ --include="*.jsx" --include="*.js" | grep -v node_modules
```

Expected: Only the redirect pages (no imports of stationStore).

**Step 3: Deploy**

```bash
vercel ls 2>&1 | grep -E "Building|Queued"
vercel --prod 2>&1
```

**Step 4: Verify all pages**

```bash
for p in / /music /search /merch /creators /creators/browse /artist/mike /dashboard /podstation; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 5: Verify redirects work**

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://mystationlive.com/station/create
# Expected: 307 redirecting to /creators/signup
```

---

## Summary of All Changes

| Task | What | Files Changed |
|------|------|---------------|
| 1 | Database tables + alterations | schema SQL, supabase-sql.sh |
| 2 | Kill System A | delete stationStore + station/*, fix Navbar |
| 3 | Fix follow bug + push subscriptions | follow/route.js, artist page |
| 4 | Image upload API + settings upgrade | upload-image/route.js, settings page |
| 5 | Videos API + dashboard page | videos/route.js, dashboard/videos |
| 6 | Messaging API + dashboard page | messages/route.js, dashboard/messages |
| 7 | Rebuild creator profile | artist/[slug]/page.jsx, [slug] API |
| 8 | Link PodStation to creators | stream/route.js, webhook/route.js |
| 9 | Push notifications on upload | upload/route.js, videos/route.js |
| 10 | New categories + redirects | signup/route.js, redirect pages |
| 11 | Build + Deploy + Verify | N/A |
