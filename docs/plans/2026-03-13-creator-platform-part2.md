# MyStation Creator Platform — Implementation Plan (Part 2: Tasks 11-21)

> Continuation of `2026-03-13-creator-platform.md`

---

### Task 11: Music Upload Page + API

**Files:**
- Create: `src/app/dashboard/upload/page.jsx`
- Create: `src/app/api/creators/upload/route.js`

**Step 1: Write the upload API**

```javascript
// src/app/api/creators/upload/route.js
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const artist = formData.get('artist');
    const album = formData.get('album') || null;
    const producer = formData.get('producer') || null;
    const creatorEmail = formData.get('email');

    if (!file || !title || !artist || !creatorEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get creator
    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug, subscription_status')
      .eq('email', creatorEmail)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Active creator account required' }, { status: 403 });
    }

    // Upload to R2 — bucket root (IRON LAW: R2 audio at root, not subdirs)
    const ext = file.name?.split('.').pop() || 'm4a';
    const filename = `creator-${creator.slug}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'mystation-audio',
      Key: filename,
      Body: buffer,
      ContentType: file.type || 'audio/mp4',
    }));

    // Get audio duration (approximate from file size if needed)
    const durationEstimate = Math.round(buffer.length / 16000); // rough estimate

    // Insert track record
    const { data: track, error } = await supabase
      .from('creator_tracks')
      .insert({
        creator_id: creator.id,
        title,
        artist,
        album,
        producer,
        audio_url: filename,
        duration: durationEstimate,
      })
      .select()
      .single();

    if (error) {
      console.error('[creator-upload] DB error:', error);
      return NextResponse.json({ error: 'Failed to save track' }, { status: 500 });
    }

    // Update creator track count
    await supabase.rpc('increment_creator_track_count', { creator_uuid: creator.id });

    return NextResponse.json({ track });
  } catch (err) {
    console.error('[creator-upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
```

**Step 2: Add the RPC function for track count**

Run in Supabase SQL Editor:
```sql
CREATE OR REPLACE FUNCTION increment_creator_track_count(creator_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE creators
  SET track_count = (SELECT count(*) FROM creator_tracks WHERE creator_id = creator_uuid AND status = 'active'),
      updated_at = now()
  WHERE id = creator_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 3: Write the upload page**

```jsx
// src/app/dashboard/upload/page.jsx
'use client';

import { useState, useRef } from 'react';

export default function UploadMusic() {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', artist: '', album: '', producer: '' });
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const getEmail = () => {
    return document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const email = getEmail();
    if (!email || !file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('artist', form.artist);
    formData.append('album', form.album);
    formData.append('producer', form.producer);
    formData.append('email', decodeURIComponent(email));

    try {
      const res = await fetch('/api/creators/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
      } else {
        setResult(data.track);
        setForm({ title: '', artist: '', album: '', producer: '' });
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    } catch (err) {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Upload Music</h1>

      <form onSubmit={handleUpload} className="max-w-lg space-y-4">
        {/* File input */}
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Audio File (M4A, MP3, WAV)</label>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-[#a1a1aa] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:text-black file:font-medium file:cursor-pointer"
          />
          {file && <p className="text-xs text-[#71717a] mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Track Title</label>
          <input type="text" required value={form.title} onChange={update('title')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Artist Name</label>
          <input type="text" required value={form.artist} onChange={update('artist')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Album (optional)</label>
            <input type="text" value={form.album} onChange={update('album')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Producer (optional)</label>
            <input type="text" value={form.producer} onChange={update('producer')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {result && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
            <p className="text-green-400 text-sm font-medium">Uploaded: {result.title}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !form.title || !form.artist}
          className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all"
        >
          {uploading ? 'Uploading...' : 'Upload Track'}
        </button>
      </form>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/api/creators/upload/route.js src/app/dashboard/upload/page.jsx
git commit -m "feat: add creator music upload — R2 storage + dashboard page"
```

---

### Task 12: Dashboard Settings Page + API

**Files:**
- Create: `src/app/dashboard/settings/page.jsx`
- Create: `src/app/api/creators/settings/route.js`

**Step 1: Write settings API**

```javascript
// src/app/api/creators/settings/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('creators')
    .select('display_name, bio, avatar_url, banner_url, genre_tags, social_links, category, slug')
    .eq('email', email)
    .maybeSingle();

  return NextResponse.json({ settings: data });
}

export async function PATCH(request) {
  try {
    const { email, ...updates } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Whitelist allowed fields
    const allowed = ['display_name', 'bio', 'avatar_url', 'banner_url', 'genre_tags', 'social_links'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    safeUpdates.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('creators')
      .update(safeUpdates)
      .eq('email', email);

    if (error) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

**Step 2: Write settings page**

```jsx
// src/app/dashboard/settings/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function DashboardSettings() {
  const [form, setForm] = useState({
    display_name: '', bio: '', avatar_url: '', banner_url: '',
    genre_tags: [], social_links: { instagram: '', twitter: '', spotify: '', website: '' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  useEffect(() => {
    const email = getEmail();
    if (!email) return;
    fetch(`/api/creators/settings?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => { if (d.settings) setForm({ ...form, ...d.settings }); })
      .catch(console.error);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/creators/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getEmail(), ...form }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateSocial = (key) => (e) => setForm({
    ...form, social_links: { ...form.social_links, [key]: e.target.value }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Display Name</label>
          <input type="text" value={form.display_name} onChange={update('display_name')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Bio</label>
          <textarea rows={4} value={form.bio || ''} onChange={update('bio')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Avatar URL</label>
          <input type="url" value={form.avatar_url || ''} onChange={update('avatar_url')}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Genre Tags (comma-separated)</label>
          <input type="text"
            value={Array.isArray(form.genre_tags) ? form.genre_tags.join(', ') : ''}
            onChange={(e) => setForm({ ...form, genre_tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
            placeholder="Hip-Hop, R&B, Soul"
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-[#a1a1aa]">Social Links</label>
          {['instagram', 'twitter', 'spotify', 'website'].map((key) => (
            <input key={key} type="url"
              value={form.social_links?.[key] || ''}
              onChange={updateSocial(key)}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1) + ' URL'}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          ))}
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/api/creators/settings/route.js src/app/dashboard/settings/page.jsx
git commit -m "feat: add creator profile settings page + API"
```

---

### Task 13: Creator Analytics Page + API

**Files:**
- Create: `src/app/dashboard/analytics/page.jsx`
- Create: `src/app/api/creators/analytics/route.js`

**Step 1: Write analytics API**

```javascript
// src/app/api/creators/analytics/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const summary = searchParams.get('summary') === 'true';

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: creator } = await supabase
    .from('creators')
    .select('id, total_plays, track_count, follower_count')
    .eq('email', email)
    .maybeSingle();

  if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Merch count
  const { count: merchCount } = await supabase
    .from('creator_merch')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creator.id)
    .eq('status', 'active');

  if (summary) {
    return NextResponse.json({
      totalPlays: creator.total_plays,
      trackCount: creator.track_count,
      followerCount: creator.follower_count,
      merchCount: merchCount || 0,
    });
  }

  // Full analytics: top tracks
  const { data: topTracks } = await supabase
    .from('creator_tracks')
    .select('id, title, artist, plays, created_at')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .order('plays', { ascending: false })
    .limit(10);

  return NextResponse.json({
    totalPlays: creator.total_plays,
    trackCount: creator.track_count,
    followerCount: creator.follower_count,
    merchCount: merchCount || 0,
    topTracks: topTracks || [],
  });
}
```

**Step 2: Write analytics page**

```jsx
// src/app/dashboard/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function DashboardAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (email) {
      fetch(`/api/creators/analytics?email=${encodeURIComponent(decodeURIComponent(email))}`)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }
  }, []);

  if (!data) {
    return <div className="text-[#71717a]">Loading analytics...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Plays" value={data.totalPlays} />
        <StatCard label="Tracks" value={data.trackCount} />
        <StatCard label="Followers" value={data.followerCount} />
        <StatCard label="Merch Items" value={data.merchCount} />
      </div>

      {data.topTracks?.length > 0 && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Top Tracks</h2>
          <div className="space-y-3">
            {data.topTracks.map((track, i) => (
              <div key={track.id} className="flex items-center justify-between py-2 border-b border-[#27272a] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[#71717a] text-sm w-6">{i + 1}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{track.title}</p>
                    <p className="text-[#71717a] text-xs">{track.artist}</p>
                  </div>
                </div>
                <span className="text-[#D4AF37] text-sm font-medium">{track.plays?.toLocaleString() || 0} plays</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
      <p className="text-sm text-[#71717a]">{label}</p>
      <p className="text-2xl font-bold text-white">{(value || 0).toLocaleString()}</p>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/api/creators/analytics/route.js src/app/dashboard/analytics/page.jsx
git commit -m "feat: add creator analytics page + API — plays, tracks, followers"
```

---

### Task 14: Public Creator Profile Page

**Files:**
- Create: `src/app/artist/[slug]/page.jsx`

**Step 1: Write the public profile page**

```jsx
// src/app/artist/[slug]/page.jsx
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = getSupabase();
  const { data: creator } = await supabase
    .from('creators')
    .select('display_name, bio, category')
    .eq('slug', slug)
    .eq('subscription_status', 'active')
    .maybeSingle();

  if (!creator) return { title: 'Creator Not Found — MyStation' };

  return {
    title: `${creator.display_name} — MyStation`,
    description: creator.bio || `${creator.display_name} on MyStation`,
  };
}

export default async function ArtistProfile({ params }) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Fetch creator
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('slug', slug)
    .eq('subscription_status', 'active')
    .maybeSingle();

  if (!creator) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Not Found</h1>
          <Link href="/" className="text-[#D4AF37] hover:underline">Back to MyStation</Link>
        </div>
      </div>
    );
  }

  // Fetch tracks
  const { data: tracks } = await supabase
    .from('creator_tracks')
    .select('id, title, artist, album, duration, plays, created_at')
    .eq('creator_id', creator.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Fetch merch
  const { data: merch } = await supabase
    .from('creator_merch')
    .select('id, title, price, image_url')
    .eq('creator_id', creator.id)
    .eq('status', 'active');

  const social = creator.social_links || {};

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Hero */}
      <div className="relative h-48 md:h-64" style={{ backgroundColor: creator.banner_url ? undefined : '#18181b' }}>
        {creator.banner_url && (
          <img src={creator.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative">
        {/* Avatar + Info */}
        <div className="flex items-end gap-4 mb-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#27272a] border-4 border-[#09090b] overflow-hidden flex-shrink-0">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-[#71717a]">
                {creator.display_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{creator.display_name}</h1>
            <p className="text-[#71717a] text-sm capitalize">{creator.category?.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && <p className="text-[#a1a1aa] mb-4 max-w-2xl">{creator.bio}</p>}

        {/* Genre tags */}
        {creator.genre_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {creator.genre_tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-[#18181b] border border-[#27272a] rounded-full text-xs text-[#a1a1aa]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social links */}
        {Object.values(social).some(Boolean) && (
          <div className="flex gap-3 mb-8">
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-[#71717a] hover:text-[#D4AF37] text-sm">Instagram</a>}
            {social.twitter && <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-[#71717a] hover:text-[#D4AF37] text-sm">Twitter</a>}
            {social.spotify && <a href={social.spotify} target="_blank" rel="noopener noreferrer" className="text-[#71717a] hover:text-[#D4AF37] text-sm">Spotify</a>}
            {social.website && <a href={social.website} target="_blank" rel="noopener noreferrer" className="text-[#71717a] hover:text-[#D4AF37] text-sm">Website</a>}
          </div>
        )}

        {/* Tracks */}
        {tracks?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Music</h2>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-3 bg-[#18181b] border border-[#27272a] rounded-lg hover:border-[#3f3f46] transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">{track.title}</p>
                    <p className="text-[#71717a] text-xs">{track.artist}{track.album ? ` — ${track.album}` : ''}</p>
                  </div>
                  <span className="text-[#71717a] text-xs">{track.plays?.toLocaleString() || 0} plays</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Merch */}
        {merch?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Merch</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {merch.map((item) => (
                <div key={item.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium">{item.title}</p>
                    <p className="text-[#D4AF37] text-sm font-bold">${item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <div className="flex gap-6 py-4 border-t border-[#27272a] text-sm text-[#71717a]">
          <span>{creator.track_count || 0} tracks</span>
          <span>{creator.follower_count || 0} followers</span>
          <span>{creator.total_plays?.toLocaleString() || 0} plays</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "src/app/artist/[slug]/page.jsx"
git commit -m "feat: add public creator profile page at /artist/[slug]"
```

---

### Task 15: Creator Merch Page + API

**Files:**
- Create: `src/app/dashboard/merch/page.jsx`
- Create: `src/app/api/creators/merch/route.js`

**Step 1: Write merch API (CRUD)**

```javascript
// src/app/api/creators/merch/route.js
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: creator } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
  if (!creator) return NextResponse.json({ items: [] });

  const { data } = await supabase
    .from('creator_merch')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ items: data || [] });
}

export async function POST(request) {
  try {
    const { email, title, description, price, image_url, variants } = await request.json();
    if (!email || !title || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: creator } = await supabase
      .from('creators')
      .select('id, subscription_status')
      .eq('email', email)
      .eq('subscription_status', 'active')
      .maybeSingle();

    if (!creator) return NextResponse.json({ error: 'Active creator required' }, { status: 403 });

    const { data, error } = await supabase
      .from('creator_merch')
      .insert({
        creator_id: creator.id,
        title,
        description: description || null,
        price,
        image_url: image_url || null,
        variants: variants || [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const email = searchParams.get('email');

  if (!id || !email) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: creator } = await supabase.from('creators').select('id').eq('email', email).maybeSingle();
  if (!creator) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await supabase
    .from('creator_merch')
    .update({ status: 'hidden' })
    .eq('id', id)
    .eq('creator_id', creator.id);

  return NextResponse.json({ success: true });
}
```

**Step 2: Write merch dashboard page**

```jsx
// src/app/dashboard/merch/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function DashboardMerch() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  const loadItems = () => {
    const email = getEmail();
    if (!email) return;
    fetch(`/api/creators/merch?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(console.error);
  };

  useEffect(() => { loadItems(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/creators/merch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getEmail(), ...form, price: parseFloat(form.price) }),
      });
      if (res.ok) {
        setForm({ title: '', description: '', price: '', image_url: '' });
        setShowForm(false);
        loadItems();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item?')) return;
    const email = getEmail();
    await fetch(`/api/creators/merch?id=${id}&email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    loadItems();
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Merch</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] text-sm">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 mb-6 space-y-3">
          <input type="text" required placeholder="Product name" value={form.title} onChange={update('title')}
            className="w-full px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          <textarea placeholder="Description" value={form.description} onChange={update('description')} rows={2}
            className="w-full px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" required step="0.01" min="1" placeholder="Price" value={form.price} onChange={update('price')}
              className="px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
            <input type="url" placeholder="Image URL" value={form.image_url} onChange={update('image_url')}
              className="px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-[#71717a]">
          <p className="text-lg mb-2">No merch yet</p>
          <p className="text-sm">Add your first product to start selling</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
              {item.image_url && <img src={item.image_url} alt={item.title} className="w-full aspect-square object-cover" />}
              <div className="p-3">
                <p className="text-white font-medium">{item.title}</p>
                <p className="text-[#D4AF37] font-bold">${item.price}</p>
                <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs mt-2 hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/api/creators/merch/route.js src/app/dashboard/merch/page.jsx
git commit -m "feat: add creator merch CRUD — dashboard + API"
```

---

## Phase 4: Pre-Roll Ad System

### Task 16: Ad Serve + Impression APIs

**Files:**
- Create: `src/app/api/ads/serve/route.js`
- Create: `src/app/api/ads/impression/route.js`

**Step 1: Write ad serve API**

```javascript
// src/app/api/ads/serve/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // Get random active ad within date range
    const today = new Date().toISOString().split('T')[0];

    const { data: ads } = await supabase
      .from('ads')
      .select('id, title, audio_url, banner_url, click_url')
      .eq('active', true)
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .limit(10);

    if (!ads || ads.length === 0) {
      return NextResponse.json({ ad: null });
    }

    // Random selection
    const ad = ads[Math.floor(Math.random() * ads.length)];

    return NextResponse.json({ ad });
  } catch (err) {
    console.error('[ad-serve] Error:', err);
    return NextResponse.json({ ad: null });
  }
}
```

**Step 2: Write impression tracking API**

```javascript
// src/app/api/ads/impression/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(request) {
  try {
    const { adId, completed, clicked, sessionId } = await request.json();
    if (!adId) return NextResponse.json({ error: 'adId required' }, { status: 400 });

    const supabase = getSupabase();

    // Hash IP for privacy
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 16);

    // Log impression
    await supabase.from('ad_impressions').insert({
      ad_id: adId,
      user_ip_hash: ipHash,
      session_id: sessionId || null,
      completed: completed || false,
      clicked: clicked || false,
    });

    // Increment counters on ads table
    if (clicked) {
      await supabase.rpc('increment_ad_clicks', { ad_uuid: adId });
    } else {
      await supabase.rpc('increment_ad_impressions', { ad_uuid: adId });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[ad-impression] Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**Step 3: Create RPC functions in Supabase**

```sql
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE ads SET impressions = impressions + 1 WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE ads SET clicks = clicks + 1 WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 4: Commit**

```bash
git add src/app/api/ads/serve/route.js src/app/api/ads/impression/route.js
git commit -m "feat: add ad serve + impression tracking APIs"
```

---

### Task 17: AdPreRoll + AdBanner Components

**Files:**
- Create: `src/components/AdPreRoll.jsx`
- Create: `src/components/AdBanner.jsx`

**Step 1: Write AdBanner component**

```jsx
// src/components/AdBanner.jsx
'use client';

export default function AdBanner({ ad, onClose, onAdClick }) {
  if (!ad) return null;

  const handleClick = () => {
    if (ad.click_url) {
      onAdClick?.(ad.id);
      window.open(ad.click_url, '_blank', 'noopener');
    }
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="relative max-w-lg w-full bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white text-xs flex items-center justify-center z-10 hover:bg-black"
        >
          X
        </button>

        {/* Banner image */}
        <div onClick={handleClick} className="cursor-pointer">
          <img
            src={ad.banner_url}
            alt={ad.title || 'Advertisement'}
            className="w-full h-auto max-h-[120px] object-cover"
          />
        </div>

        {/* Ad label */}
        <div className="px-3 py-1 flex items-center justify-between">
          <span className="text-[10px] text-[#52525b] uppercase tracking-wider">Sponsored</span>
          {ad.click_url && (
            <button onClick={handleClick} className="text-[10px] text-[#D4AF37] hover:underline">
              Learn More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Write AdPreRoll hook**

```jsx
// src/components/AdPreRoll.jsx
'use client';

import { useState, useCallback } from 'react';
import AdBanner from './AdBanner';

export function useAdPreRoll() {
  const [currentAd, setCurrentAd] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [adPlaying, setAdPlaying] = useState(false);

  const isSubscriber = useCallback(() => {
    if (typeof document === 'undefined') return true;
    const cookies = document.cookie;
    return cookies.includes('mystation-sub=true') || cookies.includes('mystation-friend=true');
  }, []);

  const fetchAd = useCallback(async () => {
    try {
      const res = await fetch('/api/ads/serve');
      const data = await res.json();
      return data.ad;
    } catch {
      return null;
    }
  }, []);

  const trackImpression = useCallback(async (adId, completed = false, clicked = false) => {
    try {
      await fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, completed, clicked }),
      });
    } catch { /* silent */ }
  }, []);

  // Call this BEFORE playing a track. Returns: { shouldPlayAd, adAudioUrl, onAdComplete }
  const checkForAd = useCallback(async () => {
    // Subscribers skip ads
    if (isSubscriber()) {
      return { shouldPlayAd: false };
    }

    const ad = await fetchAd();
    if (!ad) {
      return { shouldPlayAd: false };
    }

    setCurrentAd(ad);
    setShowBanner(true);
    setAdPlaying(true);

    // Track impression
    trackImpression(ad.id);

    return {
      shouldPlayAd: true,
      adAudioUrl: ad.audio_url,
      onAdComplete: () => {
        trackImpression(ad.id, true);
        setAdPlaying(false);
        // Keep banner visible for 3 more seconds
        setTimeout(() => setShowBanner(false), 3000);
      },
    };
  }, [isSubscriber, fetchAd, trackImpression]);

  const handleAdClick = useCallback((adId) => {
    trackImpression(adId, false, true);
  }, [trackImpression]);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
    setCurrentAd(null);
  }, []);

  const BannerComponent = showBanner ? (
    <AdBanner ad={currentAd} onClose={closeBanner} onAdClick={handleAdClick} />
  ) : null;

  return {
    checkForAd,
    adPlaying,
    BannerComponent,
  };
}
```

**Step 3: Commit**

```bash
git add src/components/AdPreRoll.jsx src/components/AdBanner.jsx
git commit -m "feat: add AdPreRoll hook + AdBanner component for pre-roll ads"
```

---

### Task 18: Integrate Pre-Roll Ads into AudioPlayer

**Files:**
- Modify: `src/components/AudioPlayer.jsx`

**Step 1: Read AudioPlayer.jsx to find the play trigger**

Read the file — look for where `safePlay(globalAudio)` is called after setting a new track src.

**Step 2: Add ad check before track playback**

In the play handler (where a NEW track starts playing — not resume), add:

```javascript
// Import at top of AudioPlayer.jsx
import { useAdPreRoll } from './AdPreRoll';

// Inside the component, add the hook:
const { checkForAd, adPlaying, BannerComponent } = useAdPreRoll();

// In the play handler, BEFORE setting the track src:
const adResult = await checkForAd();
if (adResult.shouldPlayAd) {
  // Play ad audio first
  const audio = getGlobalAudio();
  audio.src = adResult.adAudioUrl;
  await safePlay(audio);

  // Wait for ad to finish
  await new Promise((resolve) => {
    audio.onended = () => {
      adResult.onAdComplete();
      resolve();
    };
    // Safety timeout: skip ad after 35 seconds max
    setTimeout(() => {
      if (!audio.ended) {
        audio.pause();
        adResult.onAdComplete();
        resolve();
      }
    }, 35000);
  });
}

// Then play the actual track (existing code continues here)
```

**Step 3: Add BannerComponent to the AudioPlayer render**

```jsx
// In the return/render, add the banner:
{BannerComponent}
```

**Step 4: Test manually**

1. Clear `mystation-sub` cookie
2. Insert a test ad row in Supabase `ads` table
3. Click play on any track
4. Verify: ad audio plays first, banner shows, then track plays
5. Set `mystation-sub=true` cookie
6. Click play — verify NO ad plays

**Step 5: Commit**

```bash
git add src/components/AudioPlayer.jsx
git commit -m "feat: integrate pre-roll audio ads into AudioPlayer for free users"
```

---

### Task 19: Admin Ad Management Page

**Files:**
- Create: `src/app/admin/ads/page.jsx`
- Create: `src/app/api/ads/admin/route.js`

**Step 1: Write admin ads API**

```javascript
// src/app/api/ads/admin/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== process.env.AUDIO_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ ads: data || [] });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { key, ...adData } = body;
    if (key !== process.env.AUDIO_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    if (adData.id) {
      // Update existing
      const { id, ...updates } = adData;
      const { error } = await supabase.from('ads').update(updates).eq('id', id);
      if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      return NextResponse.json({ success: true });
    } else {
      // Create new
      const { data, error } = await supabase.from('ads').insert(adData).select().single();
      if (error) return NextResponse.json({ error: 'Create failed' }, { status: 500 });
      return NextResponse.json({ ad: data });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const id = searchParams.get('id');

  if (key !== process.env.AUDIO_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  await supabase.from('ads').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
```

**Step 2: Write admin ads page**

```jsx
// src/app/admin/ads/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminAds() {
  const [ads, setAds] = useState([]);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', audio_url: '', banner_url: '', click_url: '',
    active: true, start_date: '', end_date: '',
  });

  const fetchAds = useCallback(async () => {
    const res = await fetch(`/api/ads/admin?key=${adminKey}`);
    const data = await res.json();
    if (data.ads) setAds(data.ads);
  }, [adminKey]);

  useEffect(() => {
    if (authenticated) fetchAds();
  }, [authenticated, fetchAds]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminKey.trim()) setAuthenticated(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await fetch('/api/ads/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: adminKey, ...form }),
    });
    setForm({ title: '', audio_url: '', banner_url: '', click_url: '', active: true, start_date: '', end_date: '' });
    setShowForm(false);
    fetchAds();
  };

  const toggleActive = async (ad) => {
    await fetch('/api/ads/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: adminKey, id: ad.id, active: !ad.active }),
    });
    fetchAds();
  };

  const deleteAd = async (id) => {
    if (!confirm('Delete this ad?')) return;
    await fetch(`/api/ads/admin?key=${adminKey}&id=${id}`, { method: 'DELETE' });
    fetchAds();
  };

  const update = (field) => (e) => setForm({ ...form, [field]: field === 'active' ? e.target.checked : e.target.value });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <form onSubmit={handleLogin} className="space-y-4">
          <h1 className="text-2xl font-bold text-white text-center">Ad Manager</h1>
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key" className="w-64 px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white" />
          <button type="submit" className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg">Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Ad Manager</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-[#D4AF37] text-black font-bold rounded-lg text-sm">
            {showForm ? 'Cancel' : '+ New Ad'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 mb-6 space-y-3">
            <input type="text" required placeholder="Ad Title" value={form.title} onChange={update('title')}
              className="w-full px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white" />
            <input type="url" required placeholder="Audio URL (MP3/M4A)" value={form.audio_url} onChange={update('audio_url')}
              className="w-full px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white" />
            <input type="url" required placeholder="Banner Image URL" value={form.banner_url} onChange={update('banner_url')}
              className="w-full px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white" />
            <input type="url" placeholder="Click-through URL (optional)" value={form.click_url} onChange={update('click_url')}
              className="w-full px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" placeholder="Start date" value={form.start_date} onChange={update('start_date')}
                className="px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white" />
              <input type="date" placeholder="End date" value={form.end_date} onChange={update('end_date')}
                className="px-4 py-2 bg-[#09090b] border border-[#27272a] rounded-lg text-white" />
            </div>
            <button type="submit" className="px-6 py-2 bg-[#D4AF37] text-black font-bold rounded-lg">Create Ad</button>
          </form>
        )}

        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{ad.title}</p>
                <p className="text-[#71717a] text-xs">
                  {ad.impressions} impressions · {ad.clicks} clicks ·
                  {ad.impressions > 0 ? ` ${((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR` : ' 0% CTR'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(ad)}
                  className={`px-3 py-1 rounded text-xs font-medium ${ad.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {ad.active ? 'Active' : 'Paused'}
                </button>
                <button onClick={() => deleteAd(ad.id)} className="text-red-400 text-xs hover:underline">Delete</button>
              </div>
            </div>
          ))}
          {ads.length === 0 && <p className="text-[#71717a] text-center py-8">No ads yet</p>}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/api/ads/admin/route.js src/app/admin/ads/page.jsx
git commit -m "feat: add admin ad management page + CRUD API"
```

---

### Task 20: Admin Creators Page

**Files:**
- Create: `src/app/admin/creators/page.jsx`

**Step 1: Write admin creators page**

```jsx
// src/app/admin/creators/page.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminCreators() {
  const [creators, setCreators] = useState([]);
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const fetchCreators = useCallback(async () => {
    const res = await fetch(`/api/admin/creators?key=${adminKey}`);
    const data = await res.json();
    if (data.creators) setCreators(data.creators);
  }, [adminKey]);

  useEffect(() => {
    if (authenticated) fetchCreators();
  }, [authenticated, fetchCreators]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminKey.trim()) setAuthenticated(true);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <form onSubmit={handleLogin} className="space-y-4">
          <h1 className="text-2xl font-bold text-white text-center">Creator Admin</h1>
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key" className="w-64 px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white" />
          <button type="submit" className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg">Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Creators ({creators.length})</h1>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Name</th>
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Category</th>
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Email</th>
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Status</th>
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Tracks</th>
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Plays</th>
                <th className="text-left text-xs text-[#71717a] py-3 px-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.id} className="border-b border-[#27272a]/50 hover:bg-[#18181b]">
                  <td className="py-3 px-3">
                    <a href={`/artist/${c.slug}`} className="text-white hover:text-[#D4AF37] font-medium text-sm">{c.display_name}</a>
                    <p className="text-[#52525b] text-xs">/{c.slug}</p>
                  </td>
                  <td className="py-3 px-3 text-[#a1a1aa] text-sm capitalize">{c.category?.replace('_', ' ')}</td>
                  <td className="py-3 px-3 text-[#a1a1aa] text-sm">{c.email}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      c.subscription_status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>{c.subscription_status}</span>
                  </td>
                  <td className="py-3 px-3 text-[#a1a1aa] text-sm">{c.track_count}</td>
                  <td className="py-3 px-3 text-[#a1a1aa] text-sm">{c.total_plays?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-[#52525b] text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Write admin creators API**

```javascript
// src/app/api/admin/creators/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== process.env.AUDIO_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data } = await supabase
    .from('creators')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ creators: data || [] });
}
```

**Step 3: Commit**

```bash
git add src/app/admin/creators/page.jsx src/app/api/admin/creators/route.js
git commit -m "feat: add admin creators management page + API"
```

---

### Task 21: Middleware Updates for Dashboard Routes

**Files:**
- Modify: `src/middleware.js`

**Step 1: Read current middleware**

Read `src/middleware.js` and find where route protection is defined.

**Step 2: Add dashboard route protection**

Add this block to the middleware (before the audio file check):

```javascript
// Creator dashboard protection
if (pathname.startsWith('/dashboard')) {
  const creatorEmail = request.cookies.get('mystation-email');
  if (!creatorEmail?.value) {
    return NextResponse.redirect(new URL('/creators/signup', request.url));
  }
  // Actual creator status check happens client-side in dashboard layout
}
```

**Step 3: Commit**

```bash
git add src/middleware.js
git commit -m "feat: add middleware protection for /dashboard routes"
```

---

## Post-Implementation Checklist

After all 21 tasks are complete:

1. **Create Stripe product** — "MyStation Creator" at $14.99/mo, add price ID to env
2. **Run database schema** — Execute `creator-platform-schema.sql` in Supabase SQL Editor
3. **Run RPC functions** — Execute `increment_creator_track_count`, `increment_ad_impressions`, `increment_ad_clicks`
4. **Add first house ad** — Upload LOTL promo audio + banner via `/admin/ads`
5. **Test full flow:** Creator signup → Stripe checkout → Onboarding → Dashboard → Upload → Profile
6. **Test ad flow:** Clear sub cookie → Play track → Verify ad plays → Set sub cookie → Verify no ad
7. **Deploy:** `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && vercel --prod`
8. **Verify pages return 200:** `/creators`, `/creators/signup`, `/dashboard`, `/admin/ads`, `/admin/creators`
