# Community Feed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Channel-based community feed where subscribers post, free users read, and Mike has gold owner presence. Fan Wall gets a visible tab in navigation.

**Architecture:** Extend `fan_wall` Supabase table with channel/post_type/media/pin columns. New `/community` page with channel tabs. Photo uploads via Supabase Storage. Polls via `community_votes` table. Fan Wall/Community visible in both BottomTabBar and desktop Navbar.

**Tech Stack:** Next.js 15, React 19, Supabase (Postgres + Storage), Tailwind CSS, Lucide icons

---

### Task 1: Database Schema — Add columns to fan_wall + create community_votes

**Files:**
- Run SQL via Supabase dashboard or supabase-sql.sh

**Step 1: Add columns to fan_wall table**

```sql
ALTER TABLE fan_wall ADD COLUMN IF NOT EXISTS channel text DEFAULT 'general';
ALTER TABLE fan_wall ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'text';
ALTER TABLE fan_wall ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE fan_wall ADD COLUMN IF NOT EXISTS poll_options jsonb;
ALTER TABLE fan_wall ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_fan_wall_channel ON fan_wall (channel);
CREATE INDEX IF NOT EXISTS idx_fan_wall_pinned ON fan_wall (is_pinned) WHERE is_pinned = true;
```

**Step 2: Create community_votes table**

```sql
CREATE TABLE IF NOT EXISTS community_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  voter_ip_hash text NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, voter_ip_hash)
);
CREATE INDEX IF NOT EXISTS idx_community_votes_post ON community_votes (post_id);
```

**Step 3: Create Supabase Storage bucket**

Create bucket `community-photos` in Supabase dashboard:
- Public: true (read)
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

**Step 4: Verify columns exist**

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'fan_wall' AND column_name IN ('channel', 'post_type', 'media_url', 'poll_options', 'is_pinned');
```

Expected: 5 rows returned.

---

### Task 2: Extend /api/fan-wall with channel filtering + new post types

**Files:**
- Modify: `src/app/api/fan-wall/route.js`

**Step 1: Update GET handler to support channel filtering**

In the GET function, after getting `supabase`, add channel query param support:

```javascript
export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ posts: [], error: 'Database not configured' });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    let query = supabase
      .from('fan_wall')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    // Filter by channel if specified (but include replies/reactions regardless)
    if (channel) {
      query = query.or(`channel.eq.${channel},tier.like.reply:%,tier.like.react:%`);
    }

    const { data, error } = await query;
```

**Step 2: Update POST handler to accept new fields**

In the POST function, extract new fields from body and include them in insert:

```javascript
const { username, content, avatar, parentId, ownerSecret, verifyOwner, channel, post_type, media_url, poll_options } = body;
```

And in the insert call:

```javascript
const { data, error } = await supabase
  .from('fan_wall')
  .insert({
    username: cleanUsername,
    content: cleanContent,
    avatar: cleanAvatar,
    tier,
    likes: 0,
    channel: channel || 'general',
    post_type: post_type || 'text',
    media_url: media_url || null,
    poll_options: poll_options || null,
  })
  .select()
  .single();
```

**Step 3: Add subscriber check for posting**

Before the insert, check for subscriber cookie:

```javascript
// Subscriber gate — only subscribers can post in community
const cookies = request.headers.get('cookie') || '';
const isSubscriber = cookies.includes('mystation-sub=true');
const isAdmin = OWNER_SECRET && ownerSecret && ownerSecret.length === OWNER_SECRET.length &&
  crypto.timingSafeEqual(Buffer.from(ownerSecret), Buffer.from(OWNER_SECRET));

if (!isAdmin && !isSubscriber && !parentId) {
  // Allow replies from anyone for backward compat with Fan Wall
  // But new community posts require subscription
  if (channel && channel !== 'general') {
    return NextResponse.json({ error: 'Subscribe to post in the community' }, { status: 403 });
  }
}

// Announcements channel — Mike only
if (channel === 'announcements' && !isAdmin) {
  return NextResponse.json({ error: 'Only Mike can post announcements' }, { status: 403 });
}
```

**Step 4: Verify by curling the API**

```bash
curl -s "https://mystationlive.com/api/fan-wall?channel=general" | head -c 200
```

Expected: JSON with posts array.

**Step 5: Commit**

```bash
git add src/app/api/fan-wall/route.js
git commit -m "feat: extend fan-wall API with channel filtering and post types"
```

---

### Task 3: Create /api/community/vote for polls

**Files:**
- Create: `src/app/api/community/vote/route.js`

**Step 1: Create the vote API**

```javascript
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { postId, optionIndex } = await request.json();
    if (!postId || optionIndex === undefined) {
      return NextResponse.json({ error: 'postId and optionIndex required' }, { status: 400 });
    }

    // Hash IP for voter identity
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const voter_ip_hash = createHash('sha256').update(ip + 'community-vote-salt').digest('hex').slice(0, 16);

    // Upsert vote (one vote per user per poll)
    const { error } = await supabase
      .from('community_votes')
      .upsert({
        post_id: postId,
        voter_ip_hash,
        option_index: optionIndex,
      }, { onConflict: 'post_id,voter_ip_hash' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return updated vote counts
    const { data: votes } = await supabase
      .from('community_votes')
      .select('option_index')
      .eq('post_id', postId);

    const counts = {};
    (votes || []).forEach(v => {
      counts[v.option_index] = (counts[v.option_index] || 0) + 1;
    });

    return NextResponse.json({ success: true, counts, myVote: optionIndex });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ counts: {} });

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    if (!postId) return NextResponse.json({ counts: {} });

    const { data: votes } = await supabase
      .from('community_votes')
      .select('option_index')
      .eq('post_id', postId);

    const counts = {};
    (votes || []).forEach(v => {
      counts[v.option_index] = (counts[v.option_index] || 0) + 1;
    });

    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/api/community/vote/route.js"
git commit -m "feat: add community poll vote API"
```

---

### Task 4: Create /api/community/pin for Mike's pin toggle

**Files:**
- Create: `src/app/api/community/pin/route.js`

**Step 1: Create the pin API**

```javascript
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { postId, pinned, adminKey } = await request.json();

    const ADMIN_KEY = process.env.ADMIN_KEY;
    if (!ADMIN_KEY || !adminKey || adminKey.length !== ADMIN_KEY.length ||
        !timingSafeEqual(Buffer.from(adminKey), Buffer.from(ADMIN_KEY))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { error } = await supabase
      .from('fan_wall')
      .update({ is_pinned: !!pinned })
      .eq('id', postId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pinned: !!pinned });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/api/community/pin/route.js"
git commit -m "feat: add community pin toggle API (admin-only)"
```

---

### Task 5: Create ChannelTabs component

**Files:**
- Create: `src/components/community/ChannelTabs.jsx`

**Step 1: Create the component**

```jsx
'use client';

import { MessageCircle, Music, Calendar, Megaphone, ShoppingBag } from 'lucide-react';

const CHANNELS = [
  { id: 'general', label: 'General', icon: MessageCircle },
  { id: 'music', label: 'Music Talk', icon: Music },
  { id: 'events', label: 'LOTL / Events', icon: Calendar },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'merch', label: 'Merch', icon: ShoppingBag },
];

export { CHANNELS };

export default function ChannelTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 border-b border-white/10">
      {CHANNELS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
            active === id
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/community/ChannelTabs.jsx
git commit -m "feat: add ChannelTabs component for community feed"
```

---

### Task 6: Create CommunityPost component

**Files:**
- Create: `src/components/community/CommunityPost.jsx`

**Step 1: Create the component**

```jsx
'use client';

import { useState } from 'react';
import { Heart, Reply, ChevronDown, ChevronUp, Crown, Star, Pin, BarChart3 } from 'lucide-react';

const REACTIONS = ['🔥', '💯', '❤️', '👏', '🙌', '💪'];

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getBadge(tier) {
  if (tier === 'vip') return { label: 'MIKE PAGE', color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: Crown };
  if (tier === 'diamond') return { label: 'DIAMOND', color: 'text-cyan-400', bg: 'bg-cyan-400/20', icon: Star };
  if (tier === 'subscriber') return { label: 'SUB', color: 'text-purple-400', bg: 'bg-purple-400/20', icon: Star };
  return null;
}

function PollDisplay({ post, onVote }) {
  const options = post.poll_options?.options || [];
  const counts = post.poll_options?.counts || {};
  const myVote = post.poll_options?.myVote;
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt, i) => {
        const count = counts[i] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const voted = myVote === i;

        return (
          <button
            key={i}
            onClick={() => onVote(post.id, i)}
            disabled={myVote !== undefined}
            className={`w-full relative rounded-xl px-4 py-3 text-left text-sm transition overflow-hidden ${
              voted ? 'border border-purple-500/50 bg-purple-500/10' : 'border border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            {myVote !== undefined && (
              <div
                className="absolute inset-y-0 left-0 bg-purple-500/15 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            )}
            <span className="relative flex items-center justify-between">
              <span className="text-white/90">{opt}</span>
              {myVote !== undefined && <span className="text-white/50 text-xs">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-white/30 text-xs flex items-center gap-1">
        <BarChart3 size={12} /> {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export default function CommunityPost({ post, onLike, onReply, onReact, onPin, onVote, isOwner, likedPosts = [] }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const badge = getBadge(post.tier);
  const replies = post.replies || [];
  const reactions = post.reactions || [];
  const isVip = post.tier === 'vip';
  const isLiked = likedPosts.includes(post.id);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(post.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
    setRepliesExpanded(true);
  };

  return (
    <div className={`rounded-xl border transition ${
      isVip
        ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20'
        : 'bg-white/5 border-white/5 hover:border-white/10'
    }`}>
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="px-4 pt-2 flex items-center gap-1 text-yellow-400 text-xs font-semibold">
          <Pin size={12} /> Pinned
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
            isVip
              ? 'bg-gradient-to-br from-yellow-500/40 to-amber-500/30 ring-2 ring-yellow-500/30'
              : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30'
          }`}>
            {isVip ? '👑' : (post.avatar || '🎤')}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`font-semibold text-sm ${isVip ? 'text-yellow-400' : 'text-white'}`}>
                {post.username}
              </span>
              {badge && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.bg} ${badge.color}`}>
                  <badge.icon size={10} />
                  {badge.label}
                </span>
              )}
              <span className="text-white/30 text-xs">{formatDate(post.created_at)}</span>
            </div>

            {/* Content */}
            <p className="text-white/85 text-sm leading-relaxed">{post.content}</p>

            {/* Photo */}
            {post.post_type === 'photo' && post.media_url && (
              <div className="mt-3 rounded-xl overflow-hidden max-h-80">
                <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}

            {/* Poll */}
            {post.post_type === 'poll' && post.poll_options && (
              <PollDisplay post={post} onVote={onVote} />
            )}

            {/* Owner reactions */}
            {reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {reactions.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm" title={`${r.by} reacted`}>
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2.5">
              <button
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${
                  isLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                {post.likes || 0}
              </button>

              <button
                onClick={() => setReplyOpen(!replyOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 text-white/50 hover:bg-white/10 transition"
              >
                <Reply size={13} />
                Reply{replies.length > 0 ? ` (${replies.length})` : ''}
              </button>

              {/* Owner: reaction buttons + pin */}
              {isOwner && (
                <div className="flex gap-1 ml-auto items-center">
                  <button
                    onClick={() => onPin(post.id, !post.is_pinned)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition hover:scale-110 ${
                      post.is_pinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <Pin size={12} />
                  </button>
                  {REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => onReact(post.id, emoji)}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-yellow-500/20 flex items-center justify-center text-sm transition hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="border-t border-white/5">
          <button
            onClick={() => setRepliesExpanded(!repliesExpanded)}
            className="w-full px-4 py-2 flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition"
          >
            {repliesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {repliesExpanded && (
            <div className="px-4 pb-3 space-y-3">
              {replies.map(reply => (
                <div key={reply.id} className="flex gap-2 pl-6 border-l-2 border-purple-500/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm shrink-0">
                    {reply.avatar || '💬'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-white text-xs">{reply.username}</span>
                      <span className="text-white/30 text-[10px]">{formatDate(reply.created_at)}</span>
                    </div>
                    <p className="text-white/70 text-xs leading-relaxed">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply input */}
      {replyOpen && (
        <div className="px-4 pb-3 border-t border-white/5 pt-3">
          <div className="flex gap-2 pl-6">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              placeholder="Write a reply..."
              maxLength={300}
              autoFocus
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-xs outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 text-white text-xs font-semibold rounded-full transition"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/community/CommunityPost.jsx
git commit -m "feat: add CommunityPost component with photo, poll, pin support"
```

---

### Task 7: Create CreatePost component (composer)

**Files:**
- Create: `src/components/community/CreatePost.jsx`

**Step 1: Create the component**

```jsx
'use client';

import { useState, useRef } from 'react';
import { Send, Image, BarChart3, X, RefreshCw, Lock } from 'lucide-react';

export default function CreatePost({ channel, username, isOwner, isSubscriber, onPost }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  // Non-subscribers see locked composer
  if (!isSubscriber && !isOwner) {
    return (
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <Lock size={20} className="text-purple-400 shrink-0" />
          <div>
            <p className="text-white/70 text-sm font-medium">Subscribe to join the conversation</p>
            <p className="text-white/40 text-xs">$4.99/mo — post, reply, and connect with the community</p>
          </div>
        </div>
      </div>
    );
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setPostType('photo');
  };

  const handleSubmit = async () => {
    if (!content.trim() && postType !== 'poll') return;
    if (postType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) return;

    setPosting(true);
    try {
      let media_url = null;

      // Upload image if photo post
      if (postType === 'photo' && imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        // Upload to our own API that handles Supabase Storage
        const uploadRes = await fetch('/api/community/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          media_url = uploadData.url;
        } else {
          alert('Image upload failed');
          setPosting(false);
          return;
        }
      }

      const body = {
        username,
        content: content.trim(),
        avatar: isOwner ? '👑' : '🎤',
        channel,
        post_type: postType,
        media_url,
        poll_options: postType === 'poll' ? { options: pollOptions.filter(o => o.trim()) } : null,
      };

      if (isOwner) {
        body.ownerSecret = localStorage.getItem('mystation-fan-wall-token');
      }

      await onPost(body);
      setContent('');
      setPostType('text');
      setImageFile(null);
      setImagePreview(null);
      setPollOptions(['', '']);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
          isOwner ? 'bg-gradient-to-br from-yellow-500/40 to-amber-500/30' : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30'
        }`}>
          {isOwner ? '👑' : '🎤'}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={channel === 'announcements' ? 'Make an announcement...' : 'Share your thoughts...'}
            maxLength={500}
            rows={2}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 resize-none"
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden max-h-48">
              <img src={imagePreview} alt="" className="w-full object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setPostType('text'); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}

          {/* Poll options */}
          {postType === 'poll' && (
            <div className="mt-2 space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[i] = e.target.value;
                      setPollOptions(updated);
                    }}
                    placeholder={`Option ${i + 1}`}
                    maxLength={80}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500/50"
                  />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="text-purple-400 text-xs hover:text-purple-300"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          {/* Actions bar */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => fileRef.current?.click()}
                className={`p-2 rounded-lg transition ${postType === 'photo' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                <Image size={16} />
              </button>
              <button
                onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')}
                className={`p-2 rounded-lg transition ${postType === 'poll' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
              >
                <BarChart3 size={16} />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && postType !== 'poll') || posting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition flex items-center gap-2"
            >
              {posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/community/CreatePost.jsx
git commit -m "feat: add CreatePost composer with photo upload and poll support"
```

---

### Task 8: Create /api/community/upload for photo uploads

**Files:**
- Create: `src/app/api/community/upload/route.js`

**Step 1: Create the upload API**

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    // Subscriber check
    const cookies = request.headers.get('cookie') || '';
    const isSubscriber = cookies.includes('mystation-sub=true');
    if (!isSubscriber) {
      return NextResponse.json({ error: 'Subscribe to upload images' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images allowed' }, { status: 400 });
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from('community-photos')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('community-photos')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/api/community/upload/route.js"
git commit -m "feat: add community photo upload API (Supabase Storage)"
```

---

### Task 9: Create CommunityFeed component (main feed)

**Files:**
- Create: `src/components/community/CommunityFeed.jsx`

**Step 1: Create the component**

```jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';
import ChannelTabs from './ChannelTabs';
import CommunityPost from './CommunityPost';
import CreatePost from './CreatePost';

export default function CommunityFeed() {
  const [channel, setChannel] = useState('general');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Load user state from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('mystation-fan-username');
    const savedOwner = localStorage.getItem('mystation-fan-wall-owner');
    const savedLikes = localStorage.getItem('mystation-community-likes');
    if (savedUsername) setUsername(savedUsername);
    if (savedOwner === 'true') setIsOwner(true);
    if (savedLikes) { try { setLikedPosts(JSON.parse(savedLikes)); } catch {} }

    // Check subscriber status from cookie
    setIsSubscriber(document.cookie.includes('mystation-sub=true'));
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/fan-wall?channel=${channel}`);
      const data = await res.json();
      if (data.posts) {
        // Pinned posts first, then by date
        const sorted = data.posts.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setPosts(sorted);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handlePost = async (body) => {
    if (!username) {
      setShowNamePrompt(true);
      return;
    }
    const res = await fetch('/api/fan-wall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      await fetchPosts();
    }
  };

  const handleLike = async (postId) => {
    if (likedPosts.includes(postId)) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    const updated = [...likedPosts, postId];
    setLikedPosts(updated);
    localStorage.setItem('mystation-community-likes', JSON.stringify(updated));
    try {
      await fetch('/api/fan-wall', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      });
    } catch {}
  };

  const handleReply = async (postId, text) => {
    if (!username) { setShowNamePrompt(true); return; }
    const body = { username, content: text, avatar: '💬', parentId: postId, channel };
    if (isOwner) body.ownerSecret = localStorage.getItem('mystation-fan-wall-token');
    const res = await fetch('/api/fan-wall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) await fetchPosts();
  };

  const handleReact = async (postId, emoji) => {
    if (!isOwner) return;
    await fetch('/api/fan-wall', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, reaction: emoji, ownerSecret: localStorage.getItem('mystation-fan-wall-token') }),
    });
    await fetchPosts();
  };

  const handlePin = async (postId, pinned) => {
    if (!isOwner) return;
    await fetch('/api/community/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, pinned, adminKey: 'mpf2026' }),
    });
    await fetchPosts();
  };

  const handleVote = async (postId, optionIndex) => {
    const res = await fetch('/api/community/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, optionIndex }),
    });
    const data = await res.json();
    if (data.success) {
      // Update poll_options with vote counts locally
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          poll_options: { ...p.poll_options, counts: data.counts, myVote: data.myVote },
        };
      }));
    }
  };

  const handleSetName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem('mystation-fan-username', nameInput.trim());
    setUsername(nameInput.trim());
    setShowNamePrompt(false);
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Community</h3>
              <p className="text-white/50 text-sm">Connect with the MyStation fam</p>
            </div>
          </div>
          <button onClick={fetchPosts} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white/70">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Channel Tabs */}
      <ChannelTabs active={channel} onChange={setChannel} />

      {/* Name prompt */}
      {showNamePrompt && (
        <div className="p-4 border-b border-white/10 bg-purple-500/5">
          <p className="text-white/60 text-sm mb-3">Choose your display name:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetName()}
              placeholder="Your name"
              autoFocus
              maxLength={30}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50"
            />
            <button onClick={handleSetName} disabled={!nameInput.trim()} className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 text-white font-semibold rounded-xl transition">
              Save
            </button>
          </div>
        </div>
      )}

      {/* Composer */}
      {!showNamePrompt && (channel !== 'announcements' || isOwner) && (
        <CreatePost
          channel={channel}
          username={username}
          isOwner={isOwner}
          isSubscriber={isSubscriber}
          onPost={handlePost}
        />
      )}

      {/* Posts */}
      <div className="p-4 space-y-4 max-h-[800px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-10">
            <RefreshCw size={32} className="text-white/20 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No posts in this channel yet. Be the first!</p>
          </div>
        ) : (
          posts.map(post => (
            <CommunityPost
              key={post.id}
              post={post}
              onLike={handleLike}
              onReply={handleReply}
              onReact={handleReact}
              onPin={handlePin}
              onVote={handleVote}
              isOwner={isOwner}
              likedPosts={likedPosts}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/community/CommunityFeed.jsx
git commit -m "feat: add CommunityFeed with channel switching, pinned posts, polls"
```

---

### Task 10: Create /community page

**Files:**
- Create: `src/app/community/page.jsx`

**Step 1: Create the page**

```jsx
import CommunityFeed from '@/components/community/CommunityFeed';

export const metadata = {
  title: 'Community | MyStation',
  description: 'Connect with the MyStation community — music talk, events, announcements, and more.',
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen">
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-mystation-navy to-mystation-black" />
        <div className="relative max-w-2xl mx-auto px-4">
          <CommunityFeed />
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/community/page.jsx
git commit -m "feat: add /community page route"
```

---

### Task 11: Add Community to BottomTabBar and Navbar

**Files:**
- Modify: `src/components/BottomTabBar.jsx`
- Modify: `src/components/Navbar.jsx`

**Step 1: Update BottomTabBar — replace Account with Community, move Account to More**

In `src/components/BottomTabBar.jsx`, change the tabs array:

```jsx
import { Home, Music, Search, ShoppingBag, MessageCircle } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/music', icon: Music, label: 'Music' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/community', icon: MessageCircle, label: 'Community' },
  { href: '/merch', icon: ShoppingBag, label: 'Shop' },
];
```

**Step 2: Update Navbar — add Community to core nav**

In `src/components/Navbar.jsx`, add Community to the `navItems` array (replace one of the existing items or add it):

```javascript
const navItems = [
  { href: '/', icon: Home, label: 'Home', mobileOrder: 1 },
  { href: '/music', icon: Music, label: 'Music', mobileOrder: 2 },
  { href: '/community', icon: MessageCircle, label: 'Community', mobileOrder: 3 },
  { href: '/merch', icon: ShoppingBag, label: 'Merch', mobileOrder: 4 },
  { href: '/lounge', icon: Gamepad2, label: 'Lounge', highlight: true, mobileOrder: 5 },
  { href: '/events', icon: Ticket, label: 'Events', mobileOrder: 6 },
];
```

Move Videos to `moreItems`.

**Step 3: Verify locally**

```bash
curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com/community
```

Expected: 200 (after deploy)

**Step 4: Commit**

```bash
git add src/components/BottomTabBar.jsx src/components/Navbar.jsx
git commit -m "feat: add Community tab to BottomTabBar and desktop Navbar"
```

---

### Task 12: Bump service worker + deploy + verify

**Files:**
- Modify: `public/sw.js`

**Step 1: Bump SW version**

Change `mystation-v7` to `mystation-v8`.

**Step 2: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: Phase 2 Community Feed — channels, posts, photos, polls, pins"
```

**Step 3: Deploy**

```bash
vercel ls 2>&1 | grep -E "Building|Queued"
vercel --prod 2>&1
```

**Step 4: Verify all pages**

```bash
for p in / /music /search /merch /community /events; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

Expected: ALL 200.
