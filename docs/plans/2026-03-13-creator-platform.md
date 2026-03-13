# MyStation Creator Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn MyStation into a multi-creator platform where any creator pays $14.99/mo, uploads music, sells merch (keeps 100% via Stripe Connect), while fans subscribe to MyStation for ad-free listening.

**Architecture:** Extend existing MyStation Next.js 15 app with new Supabase tables (creators, creator_tracks, creator_merch, ads, ad_impressions), new API routes under `/api/creators/` and `/api/ads/`, Stripe Connect for creator merch payouts, R2 storage for creator audio, and pre-roll audio+visual ads injected into AudioPlayer.jsx for non-subscribers.

**Tech Stack:** Next.js 15 (App Router), Supabase Postgres, Stripe + Stripe Connect, Cloudflare R2, Printify, Resend, Tailwind CSS 4

**Reference:** Design doc at `docs/plans/2026-03-13-creator-platform-design.md`

---

## Phase 1: Database Foundation

### Task 1: Create Supabase Tables

**Files:**
- Create: `src/lib/db/creator-platform-schema.sql`

**Step 1: Write the schema SQL**

```sql
-- Creator Platform Schema
-- Run via Supabase SQL Editor

-- 1. Creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('musician', 'podcaster', 'producer', 'dj', 'content_creator')),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  stripe_connect_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  subscription_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  track_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_slug ON creators(slug);
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_category ON creators(category);
CREATE INDEX idx_creators_subscription_status ON creators(subscription_status);

-- 2. Creator tracks table
CREATE TABLE IF NOT EXISTS creator_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  producer TEXT,
  duration INTEGER, -- seconds
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  plays INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creator_tracks_creator_id ON creator_tracks(creator_id);
CREATE INDEX idx_creator_tracks_status ON creator_tracks(status);
CREATE INDEX idx_creator_tracks_created_at ON creator_tracks(created_at DESC);

-- 3. Creator merch table
CREATE TABLE IF NOT EXISTS creator_merch (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  printify_product_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  variants JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'sold_out')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creator_merch_creator_id ON creator_merch(creator_id);

-- 4. Ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  click_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ads_active ON ads(active) WHERE active = TRUE;

-- 5. Ad impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE NOT NULL,
  user_ip_hash TEXT,
  session_id TEXT,
  played_at TIMESTAMPTZ DEFAULT now(),
  completed BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX idx_ad_impressions_played_at ON ad_impressions(played_at DESC);

-- 6. Creator followers table
CREATE TABLE IF NOT EXISTS creator_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  follower_email TEXT NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, follower_email)
);

CREATE INDEX idx_creator_followers_creator_id ON creator_followers(creator_id);

-- RLS Policies
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_merch ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_followers ENABLE ROW LEVEL SECURITY;

-- Public read for active creators
CREATE POLICY "Anyone can view active creators"
  ON creators FOR SELECT
  USING (subscription_status = 'active');

-- Creators can update own record
CREATE POLICY "Creators can update own record"
  ON creators FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Public read for active tracks
CREATE POLICY "Anyone can view active tracks"
  ON creator_tracks FOR SELECT
  USING (status = 'active');

-- Creators can CRUD own tracks
CREATE POLICY "Creators can insert own tracks"
  ON creator_tracks FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

CREATE POLICY "Creators can update own tracks"
  ON creator_tracks FOR UPDATE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

CREATE POLICY "Creators can delete own tracks"
  ON creator_tracks FOR DELETE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

-- Public read for active merch
CREATE POLICY "Anyone can view active merch"
  ON creator_merch FOR SELECT
  USING (status = 'active');

-- Creators can CRUD own merch
CREATE POLICY "Creators can insert own merch"
  ON creator_merch FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

CREATE POLICY "Creators can update own merch"
  ON creator_merch FOR UPDATE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

-- Ads: public read for active, admin write via service role
CREATE POLICY "Anyone can view active ads"
  ON ads FOR SELECT
  USING (active = TRUE AND (start_date IS NULL OR start_date <= CURRENT_DATE) AND (end_date IS NULL OR end_date >= CURRENT_DATE));

-- Ad impressions: insert only via service role (API routes)
CREATE POLICY "Service role manages ad impressions"
  ON ad_impressions FOR ALL
  USING (true);

-- Followers: anyone can follow
CREATE POLICY "Anyone can view followers"
  ON creator_followers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can follow"
  ON creator_followers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can unfollow"
  ON creator_followers FOR DELETE
  USING (true);
```

**Step 2: Run schema in Supabase SQL Editor**

Run: Open Supabase dashboard → SQL Editor → paste and execute
Expected: All 6 tables created with indexes and RLS policies

**Step 3: Verify tables exist**

Run: `bash /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('creators', 'creator_tracks', 'creator_merch', 'ads', 'ad_impressions', 'creator_followers') ORDER BY tablename;"`
Expected: All 6 table names returned

**Step 4: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add src/lib/db/creator-platform-schema.sql
git commit -m "feat: add creator platform database schema (6 tables + RLS)"
```

---

## Phase 2: Creator Signup Flow

### Task 2: Create Stripe "MyStation Creator" Product

**This is a manual Stripe Dashboard task — no code.**

**Step 1: Create product in Stripe Dashboard**

1. Go to Stripe Dashboard → Products → Add Product
2. Name: "MyStation Creator"
3. Description: "Creator platform access — upload music, sell merch, build your audience"
4. Price: $14.99/month (recurring)
5. Copy the Price ID (starts with `price_...`)

**Step 2: Add env var to Vercel**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && vercel env add STRIPE_PRICE_CREATOR`
Value: The price ID from Step 1

**Step 3: Add to .env.local**

Add line: `STRIPE_PRICE_CREATOR=price_xxxxx` to `.env.local`

---

### Task 3: Creator Signup API

**Files:**
- Create: `src/app/api/creators/signup/route.js`

**Step 1: Write the API route**

```javascript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function POST(request) {
  try {
    const { email, password, displayName, category } = await request.json();

    if (!email || !password || !displayName || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validCategories = ['musician', 'podcaster', 'producer', 'dj', 'content_creator'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const supabase = getSupabase();
    const stripe = getStripe();

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      // If user already exists, try to get their ID
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'Email already registered. Log in instead.' }, { status: 409 });
      }
      console.error('[creator-signup] Auth error:', authError);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Generate unique slug
    let slug = slugify(displayName);
    const { data: existing } = await supabase
      .from('creators')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 3. Create creator record
    const { error: creatorError } = await supabase
      .from('creators')
      .insert({
        user_id: userId,
        email,
        slug,
        display_name: displayName,
        category,
        subscription_status: 'inactive',
      });

    if (creatorError) {
      console.error('[creator-signup] Creator insert error:', creatorError);
      return NextResponse.json({ error: 'Failed to create creator profile' }, { status: 500 });
    }

    // 4. Create Stripe checkout for $14.99/mo creator subscription
    const priceId = process.env.STRIPE_PRICE_CREATOR?.trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Creator pricing not configured' }, { status: 500 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com').trim();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        source: 'creator-signup',
        creator_user_id: userId,
        creator_slug: slug,
      },
      success_url: `${appUrl}/creators/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/creators/signup?canceled=true`,
    });

    return NextResponse.json({
      url: session.url,
      slug,
    });
  } catch (err) {
    console.error('[creator-signup] Error:', err);
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
```

**Step 2: Verify route compiles**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -20`
Expected: Build succeeds (or at least no syntax errors in this route)

**Step 3: Commit**

```bash
git add src/app/api/creators/signup/route.js
git commit -m "feat: add creator signup API — auth + Stripe checkout"
```

---

### Task 4: Handle Creator Subscription in Stripe Webhook

**Files:**
- Modify: `src/app/api/stripe/webhook/route.js`

**Step 1: Read current webhook handler**

Read: `src/app/api/stripe/webhook/route.js` — find the `checkout.session.completed` handler

**Step 2: Add creator subscription handler**

After the existing `checkout.session.completed` case, add creator-specific handling:

```javascript
// Inside the checkout.session.completed handler, add at the TOP before existing logic:
if (session.metadata?.source === 'creator-signup') {
  await handleCreatorCheckout(session, stripe);
  return NextResponse.json({ received: true });
}
```

Add this new function in the same file:

```javascript
async function handleCreatorCheckout(session, stripe) {
  const supabase = getSupabaseAdmin();
  const userId = session.metadata?.creator_user_id;
  const slug = session.metadata?.creator_slug;
  const email = session.customer_email || session.customer_details?.email;

  if (!userId) {
    console.error('[webhook] Creator checkout missing user_id');
    return;
  }

  // Update creator record with subscription info
  const { error } = await supabase
    .from('creators')
    .update({
      subscription_status: 'active',
      subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[webhook] Failed to activate creator:', error);
    return;
  }

  console.log(`[webhook] Creator activated: ${slug} (${email})`);

  // Send admin alert
  try {
    const { sendAdminAlert } = await import('@/lib/email.js');
    if (sendAdminAlert) {
      await sendAdminAlert({
        subject: `NEW CREATOR SIGNUP — ${session.metadata?.creator_slug}`,
        html: `<h2>New Creator!</h2><p>Name: ${slug}</p><p>Email: ${email}</p><p>Category: ${session.metadata?.category || 'unknown'}</p>`,
      });
    }
  } catch (e) {
    console.error('[webhook] Admin alert failed:', e);
  }
}
```

**Step 3: Add handler for creator subscription cancellation**

In the `customer.subscription.deleted` handler, add:

```javascript
// Check if this is a creator subscription
const creatorSub = await supabase
  .from('creators')
  .select('id, slug')
  .eq('subscription_id', subscription.id)
  .maybeSingle();

if (creatorSub?.data) {
  await supabase
    .from('creators')
    .update({ subscription_status: 'canceled', updated_at: new Date().toISOString() })
    .eq('id', creatorSub.data.id);
  console.log(`[webhook] Creator subscription canceled: ${creatorSub.data.slug}`);
}
```

**Step 4: Commit**

```bash
git add src/app/api/stripe/webhook/route.js
git commit -m "feat: handle creator signup + cancellation in Stripe webhook"
```

---

### Task 5: Stripe Connect Onboarding API

**Files:**
- Create: `src/app/api/creators/connect/route.js`

**Step 1: Write the Stripe Connect API**

```javascript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const stripe = getStripe();

    // Get creator record
    const { data: creator, error } = await supabase
      .from('creators')
      .select('id, slug, display_name, stripe_connect_id')
      .eq('email', email)
      .maybeSingle();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    let connectId = creator.stripe_connect_id;

    // Create Connect account if not exists
    if (!connectId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        metadata: {
          creator_id: creator.id,
          creator_slug: creator.slug,
          source: 'mystation-creator',
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      connectId = account.id;

      await supabase
        .from('creators')
        .update({ stripe_connect_id: connectId, updated_at: new Date().toISOString() })
        .eq('id', creator.id);
    }

    // Create onboarding link
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com').trim();

    const accountLink = await stripe.accountLinks.create({
      account: connectId,
      refresh_url: `${appUrl}/creators/onboarding?refresh=true`,
      return_url: `${appUrl}/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('[creator-connect] Error:', err);
    return NextResponse.json({ error: err.message || 'Connect setup failed' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/creators/connect/route.js
git commit -m "feat: add Stripe Connect onboarding API for creator merch payouts"
```

---

### Task 6: Creator Signup Page

**Files:**
- Create: `src/app/creators/signup/page.jsx`

**Step 1: Write the signup form page**

```jsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'musician', label: 'Musician', icon: '🎵' },
  { value: 'podcaster', label: 'Podcaster', icon: '🎙️' },
  { value: 'producer', label: 'Producer', icon: '🎛️' },
  { value: 'dj', label: 'DJ', icon: '🎧' },
  { value: 'content_creator', label: 'Content Creator', icon: '📱' },
];

export default function CreatorSignup() {
  const [form, setForm] = useState({ email: '', password: '', displayName: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/creators/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join MyStation</h1>
          <p className="text-[#71717a]">$14.99/mo — Upload music, sell merch, build your audience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Artist / Brand Name</label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={update('displayName')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="Your name or brand"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">What do you do?</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                    form.category === cat.value
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46]'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !form.category}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Setting up...' : 'Start Creating — $14.99/mo'}
          </button>

          <p className="text-center text-[#71717a] text-sm">
            Already a creator?{' '}
            <Link href="/dashboard" className="text-[#D4AF37] hover:underline">
              Go to Dashboard
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/creators/signup/page.jsx
git commit -m "feat: add creator signup form page"
```

---

### Task 7: Creator Onboarding Page (Stripe Connect)

**Files:**
- Create: `src/app/creators/onboarding/page.jsx`

**Step 1: Write the onboarding page**

```jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('connect'); // connect | complete

  useEffect(() => {
    // Get email from cookie or prompt
    const stored = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];
    if (stored) setEmail(decodeURIComponent(stored));
  }, []);

  const handleConnect = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const res = await fetch('/api/creators/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start onboarding');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, Creator!</h1>
          <p className="text-[#71717a]">Your subscription is active. One more step to start earning.</p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Bank Account</h2>
          <p className="text-[#a1a1aa] text-sm mb-4">
            Link your bank via Stripe so you can receive merch payouts directly. You keep 100% of your merch revenue.
          </p>

          {!email && (
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white mb-4 focus:border-[#D4AF37] focus:outline-none"
            />
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !email}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all mb-3"
          >
            {loading ? 'Connecting...' : 'Connect Bank Account'}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-2 text-[#71717a] text-sm hover:text-white transition-colors"
          >
            Skip for now — I'll set this up later
          </button>
        </div>

        <p className="text-[#52525b] text-xs">
          Powered by Stripe Connect. Your banking info is never shared with MyStation.
        </p>
      </div>
    </div>
  );
}

export default function CreatorOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <OnboardingContent />
    </Suspense>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/creators/onboarding/page.jsx
git commit -m "feat: add creator onboarding page with Stripe Connect"
```

---

### Task 8: Creators Landing Page

**Files:**
- Create: `src/app/creators/page.jsx`

**Step 1: Write the landing page**

```jsx
import Link from 'next/link';

export const metadata = {
  title: 'Become a Creator — MyStation',
  description: 'Upload music, sell merch, build your audience. $14.99/mo. Keep 100% of merch revenue.',
};

const FEATURES = [
  { title: 'Upload Music', desc: 'Your tracks on MyStation\'s catalog. Fans discover you.', icon: '🎵' },
  { title: 'Sell Merch', desc: 'Upload designs, we handle printing & shipping. You keep 100%.', icon: '👕' },
  { title: 'Analytics', desc: 'See plays, fans, top tracks, revenue — all in one dashboard.', icon: '📊' },
  { title: 'Your Profile', desc: 'Public artist page with music, merch, bio, and social links.', icon: '🎤' },
  { title: 'Zero Ops', desc: 'We handle fulfillment, hosting, streaming. You just create.', icon: '✨' },
  { title: 'Get Paid', desc: 'Merch revenue hits your bank via Stripe Connect. No delays.', icon: '💰' },
];

const CATEGORIES = ['Musicians', 'Podcasters', 'Producers', 'DJs', 'Content Creators'];

export default function CreatorsLanding() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Hero */}
      <section className="px-4 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Your Music. Your Merch.{' '}
          <span className="text-[#D4AF37]">Your Platform.</span>
        </h1>
        <p className="text-xl text-[#a1a1aa] mb-2">
          {CATEGORIES.join(' · ')}
        </p>
        <p className="text-lg text-[#71717a] mb-8">
          $14.99/mo — Upload music, sell merch, build your audience. Keep 100% of merch revenue.
        </p>
        <Link
          href="/creators/signup"
          className="inline-block px-8 py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-lg hover:bg-[#b8962e] transition-all"
        >
          Start Creating
        </Link>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
              <p className="text-[#a1a1aa] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
        <div className="space-y-6">
          {[
            { step: '1', title: 'Sign Up', desc: 'Create your account and pay $14.99/mo' },
            { step: '2', title: 'Connect Your Bank', desc: 'Link via Stripe so merch payouts hit your account' },
            { step: '3', title: 'Upload & Sell', desc: 'Add tracks, create merch, customize your profile' },
            { step: '4', title: 'Get Discovered', desc: 'Fans find you on MyStation. You keep 100% of merch sales.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <h3 className="text-white font-bold">{s.title}</h3>
                <p className="text-[#a1a1aa] text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/creators/signup"
          className="inline-block mt-10 px-8 py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-lg hover:bg-[#b8962e] transition-all"
        >
          Join MyStation — $14.99/mo
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-[#52525b] text-sm border-t border-[#27272a]">
        <p>MyStation — Where Creators Thrive</p>
      </footer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/creators/page.jsx
git commit -m "feat: add creators landing page with value prop + signup CTA"
```

---

## Phase 3: Creator Dashboard

### Task 9: Dashboard Layout + Auth Guard

**Files:**
- Create: `src/app/dashboard/layout.jsx`
- Create: `src/lib/creatorAuth.js`

**Step 1: Write creator auth helper**

```javascript
// src/lib/creatorAuth.js
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function getCreatorByEmail(email) {
  if (!email) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('creators')
    .select('*')
    .eq('email', email)
    .eq('subscription_status', 'active')
    .maybeSingle();
  return data;
}
```

**Step 2: Write dashboard layout with auth guard**

```jsx
// src/app/dashboard/layout.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/upload', label: 'Upload Music', icon: '🎵' },
  { href: '/dashboard/merch', label: 'Merch', icon: '👕' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (!email) {
      window.location.href = '/creators/signup';
      return;
    }

    fetch(`/api/creators/me?email=${encodeURIComponent(decodeURIComponent(email))}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.creator) {
          setCreator(data.creator);
        } else {
          window.location.href = '/creators/signup';
        }
      })
      .catch(() => {
        window.location.href = '/creators/signup';
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar */}
      <nav className="w-64 bg-[#0a0a0c] border-r border-[#27272a] p-4 hidden md:block">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white">{creator?.display_name}</h2>
          <p className="text-xs text-[#71717a]">/{creator?.slug}</p>
        </div>

        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <Link
            href={`/artist/${creator?.slug}`}
            className="block text-xs text-[#71717a] hover:text-[#D4AF37] transition-colors"
          >
            View Public Profile →
          </Link>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-[#27272a] flex md:hidden z-50">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-3 text-center text-xs ${
              pathname === item.href ? 'text-[#D4AF37]' : 'text-[#71717a]'
            }`}
          >
            <span className="block text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

**Step 3: Create `/api/creators/me` endpoint**

```javascript
// src/app/api/creators/me/route.js
import { NextResponse } from 'next/server';
import { getCreatorByEmail } from '@/lib/creatorAuth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const creator = await getCreatorByEmail(email);

  if (!creator) {
    return NextResponse.json({ creator: null });
  }

  // Don't expose sensitive fields
  const { stripe_customer_id, stripe_connect_id, subscription_id, ...safe } = creator;
  return NextResponse.json({ creator: safe });
}
```

**Step 4: Commit**

```bash
git add src/lib/creatorAuth.js src/app/dashboard/layout.jsx src/app/api/creators/me/route.js
git commit -m "feat: add creator dashboard layout with auth guard + /api/creators/me"
```

---

### Task 10: Dashboard Overview Page

**Files:**
- Create: `src/app/dashboard/page.jsx`

**Step 1: Write dashboard overview**

```jsx
'use client';

import { useState, useEffect } from 'react';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (email) {
      fetch(`/api/creators/analytics?email=${encodeURIComponent(decodeURIComponent(email))}&summary=true`)
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error);
    }
  }, []);

  const cards = [
    { label: 'Total Plays', value: stats?.totalPlays ?? 0, color: 'text-blue-400' },
    { label: 'Tracks', value: stats?.trackCount ?? 0, color: 'text-purple-400' },
    { label: 'Followers', value: stats?.followerCount ?? 0, color: 'text-green-400' },
    { label: 'Merch Items', value: stats?.merchCount ?? 0, color: 'text-[#D4AF37]' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <p className="text-sm text-[#71717a]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>
              {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/dashboard/upload" className="flex items-center gap-3 p-4 rounded-lg bg-[#09090b] border border-[#27272a] hover:border-[#D4AF37] transition-colors">
            <span className="text-2xl">🎵</span>
            <div>
              <p className="text-white font-medium">Upload Track</p>
              <p className="text-xs text-[#71717a]">Add music to your catalog</p>
            </div>
          </a>
          <a href="/dashboard/merch" className="flex items-center gap-3 p-4 rounded-lg bg-[#09090b] border border-[#27272a] hover:border-[#D4AF37] transition-colors">
            <span className="text-2xl">👕</span>
            <div>
              <p className="text-white font-medium">Create Merch</p>
              <p className="text-xs text-[#71717a]">Design and sell products</p>
            </div>
          </a>
          <a href="/dashboard/settings" className="flex items-center gap-3 p-4 rounded-lg bg-[#09090b] border border-[#27272a] hover:border-[#D4AF37] transition-colors">
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="text-white font-medium">Edit Profile</p>
              <p className="text-xs text-[#71717a]">Update bio, avatar, links</p>
            </div>
          </a>
          <a href="/dashboard/analytics" className="flex items-center gap-3 p-4 rounded-lg bg-[#09090b] border border-[#27272a] hover:border-[#D4AF37] transition-colors">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-white font-medium">View Analytics</p>
              <p className="text-xs text-[#71717a]">Plays, fans, revenue</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/page.jsx
git commit -m "feat: add creator dashboard overview page"
```

---

Plan continues in Part 2. Saving Part 1 now.
