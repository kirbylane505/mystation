# MyStation Live Chat — Design Doc
**Date:** 2026-03-10
**Status:** Approved by Mike

## Overview
Floating chat bubble (bottom-right corner) for real-time fan interaction. Subscribers-only. Admin (Mike) can see all online users, DM anyone, and broadcast to everyone.

## Access Control
| Role | See Bubble | See Online | DM | Receive Broadcasts | Send Broadcasts |
|------|-----------|-----------|-----|-------------------|----------------|
| Free/Guest | No | No | No | No | No |
| Subscriber | Yes | Yes | Yes | Yes | No |
| Admin | Yes | Yes | Yes | Yes | Yes |

## UI Components

### 1. Chat Bubble (`ChatBubble.jsx`)
- Fixed position bottom-right (20px offset)
- 56px circle, dark background, green pulse animation
- Shows online user count
- Click to expand Chat Panel
- Only renders if user is subscriber or admin
- Rendered in root `layout.jsx`

### 2. Chat Panel (380w x 500h)
- Slides up from bubble on click
- Three tabs: **Online** | **Messages** | **Broadcasts**
- Glass morphism style matching existing MyStation aesthetic

#### Online Tab
- List of currently online users
- Avatar, display name, green dot indicator
- Click user to open DM thread
- Admin sees what page each user is on

#### Messages Tab
- DM thread list sorted by most recent
- Unread badge count per thread
- Click to open DM thread view

#### Broadcasts Tab
- Admin announcements with gold styling
- Pinned broadcasts stay at top
- All subscribers see these

### 3. DM Thread View
- Simple chat thread (sender aligned right, receiver left)
- Text input + send button
- Real-time delivery via Supabase broadcast
- Read receipts (checkmark)
- Scroll to bottom on new message

## Data Model

### `direct_messages` table
```sql
CREATE TABLE direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX idx_dm_created ON direct_messages(created_at DESC);
```

### `broadcasts` table
```sql
CREATE TABLE broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  text TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies
- `direct_messages`: Users can read messages where they are sender OR receiver. Users can insert where they are sender.
- `broadcasts`: All authenticated users can read. Only admin can insert.
- Use `(select auth.uid())` pattern per Supabase best practices.

## Tech Stack
- **Supabase Realtime Presence** — online user tracking (no table needed, in-memory)
- **Supabase Realtime Broadcast** — instant message delivery to open clients
- **Supabase Postgres** — message persistence + history
- **Zustand** — `chatStore.js` for state management
- **React** — `ChatBubble.jsx` component tree

## State Management (`chatStore.js`)
```
- onlineUsers: Map<userId, {name, avatar, page, lastSeen}>
- dmThreads: Map<threadId, Message[]>
- broadcasts: Broadcast[]
- unreadCount: number
- activeThread: string | null
- panelOpen: boolean
- activeTab: 'online' | 'messages' | 'broadcasts'
- presenceChannel: RealtimeChannel | null
- dmChannel: RealtimeChannel | null
```

## Supabase Channels
1. `presence:mystation` — Global presence channel. All subscribers join. Tracks online status.
2. `dm:{sortedUserIdPair}` — Per-conversation DM channel for real-time delivery.
3. `broadcast:global` — Admin broadcast channel. All subscribers subscribe.

## Admin Features
- See all online users + current page
- DM any user
- Send broadcast (gold banner)
- Pin/unpin broadcasts
- Admin identified by ADMIN_KEY cookie or env check

## Mobile
- Bubble stays bottom-right (above bottom tab bar, 80px offset)
- Panel goes full-width on screens < 640px
- Swipe down to dismiss

## Performance
- Presence heartbeat every 30s (Supabase default)
- DM history loaded on-demand (last 50 messages per thread)
- Broadcasts cached in store, refreshed on channel join
- Cleanup: unsubscribe all channels on unmount
