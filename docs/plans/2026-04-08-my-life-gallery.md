# "My Life" Gallery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an IG Highlights-style "My Life" gallery to creator profiles — custom albums with photos, videos, and saved live replays. Creators control visibility per album (public / followers / subscribers).

**Architecture:** Two new Supabase tables (`creator_albums`, `creator_gallery_items`). Horizontal scrollable album circles on the artist profile page (below bio, above videos). Dashboard gallery management page. Upload via Supabase Storage `creator-content` bucket (existing). API routes follow existing pattern (`/api/creators/gallery/*`).

**Tech Stack:** Next.js 15, React 19, Supabase (Postgres + Storage), Tailwind CSS

---

### Task 1: Create Database Tables

**Files:**
- Modify: `src/lib/db/creator-platform-schema.sql` (append)

**Step 1: Write the SQL migration**

Run this in Supabase SQL Editor (via `supabase-sql.sh`):

```sql
-- 9. Creator albums (My Life gallery)
CREATE TABLE IF NOT EXISTS creator_albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cover_url TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'subscribers')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creator_albums_creator ON creator_albums(creator_id);
CREATE INDEX idx_creator_albums_sort ON creator_albums(creator_id, sort_order);

-- 10. Creator gallery items (photos/videos/live replays in albums)
CREATE TABLE IF NOT EXISTS creator_gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES creator_albums(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'live_replay')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gallery_items_album ON creator_gallery_items(album_id);
CREATE INDEX idx_gallery_items_creator ON creator_gallery_items(creator_id);

-- RLS
ALTER TABLE creator_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_gallery_items ENABLE ROW LEVEL SECURITY;

-- Public can read albums (visibility filtering done in API)
CREATE POLICY "Anyone can view albums"
  ON creator_albums FOR SELECT USING (true);

CREATE POLICY "Service role manages albums"
  ON creator_albums FOR ALL USING (true);

CREATE POLICY "Anyone can view gallery items"
  ON creator_gallery_items FOR SELECT USING (true);

CREATE POLICY "Service role manages gallery items"
  ON creator_gallery_items FOR ALL USING (true);
```

**Step 2: Run the migration**

```bash
/Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "CREATE TABLE IF NOT EXISTS creator_albums ..."
```

**Step 3: Append to schema file**

Append the SQL above to `src/lib/db/creator-platform-schema.sql` for documentation.

**Step 4: Commit**

```bash
git add src/lib/db/creator-platform-schema.sql
git commit -m "feat: add creator_albums and creator_gallery_items tables"
```

---

### Task 2: Gallery API Routes

**Files:**
- Create: `src/app/api/creators/gallery/route.js`
- Create: `src/app/api/creators/gallery/upload/route.js`

**Step 1: Create album CRUD route**

`src/app/api/creators/gallery/route.js`:

```js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// GET — list albums (+ items) for a creator
// Query params: ?slug=natalie-thomas (public) or ?email=nat@email.com (dashboard)
// Optional: ?viewerEmail=viewer@email.com (for visibility filtering)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const email = searchParams.get('email');
  const viewerEmail = searchParams.get('viewerEmail');

  const supabase = getSupabaseAdmin();

  let creatorId;
  if (slug) {
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    creatorId = creator.id;
  } else if (email) {
    const { data: creator } = await supabase
      .from('creators')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    creatorId = creator.id;
  } else {
    return NextResponse.json({ error: 'slug or email required' }, { status: 400 });
  }

  // Get albums
  const { data: albums } = await supabase
    .from('creator_albums')
    .select('*')
    .eq('creator_id', creatorId)
    .order('sort_order', { ascending: true });

  // Get all items for these albums
  const albumIds = (albums || []).map(a => a.id);
  let items = [];
  if (albumIds.length > 0) {
    const { data } = await supabase
      .from('creator_gallery_items')
      .select('*')
      .in('album_id', albumIds)
      .order('sort_order', { ascending: true });
    items = data || [];
  }

  // Determine viewer access level for visibility filtering
  let viewerAccess = 'public'; // default: can only see public
  if (viewerEmail) {
    // Check if viewer is the creator themselves (sees everything)
    const { data: ownCreator } = await supabase
      .from('creators')
      .select('id')
      .eq('email', viewerEmail)
      .maybeSingle();
    if (ownCreator && ownCreator.id === creatorId) {
      viewerAccess = 'owner';
    } else {
      // Check if viewer is a follower
      const { data: follow } = await supabase
        .from('creator_followers')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('follower_email', viewerEmail)
        .maybeSingle();
      if (follow) viewerAccess = 'followers';

      // Check if viewer is a subscriber
      const { data: sub } = await supabase
        .from('subscribers')
        .select('status')
        .eq('email', viewerEmail)
        .eq('status', 'active')
        .maybeSingle();
      if (sub) viewerAccess = 'subscribers';
    }
  }

  // Filter albums by visibility
  const visibleAlbums = (albums || []).filter(album => {
    if (viewerAccess === 'owner') return true;
    if (album.visibility === 'public') return true;
    if (album.visibility === 'followers' && (viewerAccess === 'followers' || viewerAccess === 'subscribers')) return true;
    if (album.visibility === 'subscribers' && viewerAccess === 'subscribers') return true;
    return false;
  });

  // Attach items to albums
  const albumsWithItems = visibleAlbums.map(album => ({
    ...album,
    items: items.filter(item => item.album_id === album.id),
  }));

  return NextResponse.json({ albums: albumsWithItems });
}

// POST — create a new album
export async function POST(request) {
  const { email, name, visibility } = await request.json();
  if (!email || !name) {
    return NextResponse.json({ error: 'email and name required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  // Get max sort_order
  const { data: existing } = await supabase
    .from('creator_albums')
    .select('sort_order')
    .eq('creator_id', creator.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data: album, error } = await supabase
    .from('creator_albums')
    .insert({
      creator_id: creator.id,
      name,
      visibility: visibility || 'public',
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ album });
}

// PATCH — update album (name, visibility, cover, sort_order)
export async function PATCH(request) {
  const { email, albumId, ...updates } = await request.json();
  if (!email || !albumId) {
    return NextResponse.json({ error: 'email and albumId required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  const allowed = {};
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.visibility !== undefined) allowed.visibility = updates.visibility;
  if (updates.cover_url !== undefined) allowed.cover_url = updates.cover_url;
  if (updates.sort_order !== undefined) allowed.sort_order = updates.sort_order;
  allowed.updated_at = new Date().toISOString();

  const { data: album, error } = await supabase
    .from('creator_albums')
    .update(allowed)
    .eq('id', albumId)
    .eq('creator_id', creator.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ album });
}

// DELETE — delete album (cascades items)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const albumId = searchParams.get('albumId');

  if (!email || !albumId) {
    return NextResponse.json({ error: 'email and albumId required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  await supabase
    .from('creator_albums')
    .delete()
    .eq('id', albumId)
    .eq('creator_id', creator.id);

  return NextResponse.json({ success: true });
}
```

**Step 2: Create gallery upload route**

`src/app/api/creators/gallery/upload/route.js`:

```js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

// POST — upload a photo/video to an album
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email');
    const albumId = formData.get('albumId');
    const caption = formData.get('caption') || '';
    const type = formData.get('type') || 'photo'; // 'photo' | 'video' | 'live_replay'

    if (!file || !email || !albumId) {
      return NextResponse.json({ error: 'file, email, and albumId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug')
      .eq('email', email)
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    // Verify album belongs to creator
    const { data: album } = await supabase
      .from('creator_albums')
      .select('id')
      .eq('id', albumId)
      .eq('creator_id', creator.id)
      .maybeSingle();

    if (!album) return NextResponse.json({ error: 'Album not found' }, { status: 404 });

    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `${creator.slug}/gallery/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('creator-content')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[gallery-upload] Storage error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('creator-content')
      .getPublicUrl(filename);

    // Get max sort_order in album
    const { data: existing } = await supabase
      .from('creator_gallery_items')
      .select('sort_order')
      .eq('album_id', albumId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

    const { data: item, error: dbError } = await supabase
      .from('creator_gallery_items')
      .insert({
        album_id: albumId,
        creator_id: creator.id,
        type,
        media_url: publicUrl,
        caption: caption || null,
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[gallery-upload] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    // Auto-set album cover to first item if no cover
    const { data: albumData } = await supabase
      .from('creator_albums')
      .select('cover_url')
      .eq('id', albumId)
      .single();

    if (!albumData?.cover_url) {
      await supabase
        .from('creator_albums')
        .update({ cover_url: publicUrl })
        .eq('id', albumId);
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error('[gallery-upload] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove a gallery item
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const itemId = searchParams.get('itemId');

  if (!email || !itemId) {
    return NextResponse.json({ error: 'email and itemId required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: creator } = await supabase
    .from('creators')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

  await supabase
    .from('creator_gallery_items')
    .delete()
    .eq('id', itemId)
    .eq('creator_id', creator.id);

  return NextResponse.json({ success: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/creators/gallery/
git commit -m "feat: add gallery API routes (albums CRUD + upload)"
```

---

### Task 3: Update Artist Profile API to Include Albums

**Files:**
- Modify: `src/app/api/creators/[slug]/route.js`

**Step 1: Add albums query to the existing GET handler**

After the videos query (line 47), add:

```js
  // Get their gallery albums with items
  const { data: albums } = await supabase
    .from('creator_albums')
    .select('*')
    .eq('creator_id', creator.id)
    .order('sort_order', { ascending: true });

  const albumIds = (albums || []).map(a => a.id);
  let galleryItems = [];
  if (albumIds.length > 0) {
    const { data } = await supabase
      .from('creator_gallery_items')
      .select('*')
      .in('album_id', albumIds)
      .order('sort_order', { ascending: true });
    galleryItems = data || [];
  }

  const albumsWithItems = (albums || []).map(album => ({
    ...album,
    items: galleryItems.filter(item => item.album_id === album.id),
  }));
```

Update the response to include albums:

```js
  return NextResponse.json({
    creator,
    tracks: tracks || [],
    merch: merch || [],
    videos: videos || [],
    albums: albumsWithItems,
  });
```

**Step 2: Commit**

```bash
git add src/app/api/creators/[slug]/route.js
git commit -m "feat: include gallery albums in artist profile API"
```

---

### Task 4: My Life Gallery Component on Artist Profile

**Files:**
- Create: `src/components/MyLifeGallery.jsx`
- Modify: `src/app/artist/[slug]/page.jsx`

**Step 1: Create the MyLifeGallery component**

`src/components/MyLifeGallery.jsx`:

IG Highlights-style horizontal scrollable row of album circles. Tap to open fullscreen viewer.

- Album circles: 72x72px rounded-full, cover image or gradient fallback, name below
- Lock icon overlay for restricted albums viewer can't access
- "+" circle for creators viewing own profile (links to /dashboard/gallery)
- Tap opens fullscreen overlay with swipeable media items
- Videos play inline, photos display fullscreen
- Caption shown below media
- Left/right arrows + swipe to navigate

**Step 2: Insert into artist profile**

In `src/app/artist/[slug]/page.jsx`, add `<MyLifeGallery>` between the bio section (section 6, line ~393) and the live stream section (section 7, line ~396). Pass `albums`, `isOwnProfile`, and viewer access info.

**Step 3: Commit**

```bash
git add src/components/MyLifeGallery.jsx src/app/artist/[slug]/page.jsx
git commit -m "feat: add My Life gallery highlights to artist profile"
```

---

### Task 5: Dashboard Gallery Management Page

**Files:**
- Create: `src/app/dashboard/gallery/page.jsx`
- Modify: `src/app/dashboard/layout.jsx`

**Step 1: Create dashboard gallery page**

`src/app/dashboard/gallery/page.jsx`:

Features:
- List all albums with item count + visibility badge
- "Create Album" button -> inline form (name + visibility dropdown)
- Click album -> expand to show items grid
- Upload button per album -> file picker (multi-select: photos + videos)
- Delete item button (X overlay on hover)
- Edit album (rename, change visibility, set cover)
- Delete album button
- Drag-to-reorder albums (or up/down arrows for simplicity)

**Step 2: Add Gallery to dashboard nav**

In `src/app/dashboard/layout.jsx`, add to `SHARED_NAV` array (before Merch):

```js
{ href: '/dashboard/gallery', label: 'My Life', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
```

**Step 3: Commit**

```bash
git add src/app/dashboard/gallery/ src/app/dashboard/layout.jsx
git commit -m "feat: add My Life gallery dashboard page"
```

---

### Task 6: Build, Test, Deploy

**Step 1: Local build**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npx next build
```

Fix any errors.

**Step 2: Test manually**

- Create an album via dashboard
- Upload photos to album
- View on artist profile — verify highlights row appears
- Test visibility (public vs followers vs subscribers)
- Test fullscreen viewer (swipe, close, video playback)

**Step 3: Deploy**

```bash
vercel --prod
```

**Step 4: Verify live**

```bash
for p in / /music /artist/natalie-thomas /artist/mike-page; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 5: Final commit**

```bash
git commit -m "feat: My Life gallery — complete"
```
