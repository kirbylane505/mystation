# MyStation Phone OTP + Premium Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace email signup with phone OTP, collapse fan tiers to Free + $4.99 Premium (with 6-month commitment for IDMG ticket perks), keep Creator $14.99 mandatory, and ship all paywall infrastructure as dormant code behind `MYSTATION_MONETIZATION_MODE` env var for a month-7 flip.

**Architecture:** Next.js App Router API routes (`src/app/api/...`) with Supabase Phone Auth (Twilio backend) replacing the email/password signup in `src/app/api/auth/signup/route.js`. Stripe subscription schedules enforce the 6-month Premium commitment. A cross-app `/api/members/check-premium` endpoint lets MyTicketsLive apply per-event Premium benefits at checkout. All monetization gates (ads, skips, hi-fi, track-length) read `MYSTATION_MONETIZATION_MODE` and no-op in `grow` mode.

**Tech Stack:** Next.js 14 App Router, Supabase Auth + Postgres, Twilio (via Supabase Phone Auth), Stripe subscription schedules + webhooks, `.js`/`.jsx` (not TypeScript), existing tier helper at `src/lib/tiers.js`.

**Design doc:** `docs/plans/2026-04-17-phone-otp-premium-redesign-design.md` (commit `c395182`).

---

## Pre-flight Checks (do these BEFORE Task 1)

**P1. Confirm Supabase project has Phone Auth enabled**
- Supabase dashboard → Authentication → Providers → Phone → toggle ON
- Provider: Twilio. Need: Twilio Account SID, Auth Token, Messaging Service SID
- Message template: `Your MyStation code: {{ .Code }}. Expires in 10 minutes.`
- Allowlist countries: `US, CA` only

**P2. Confirm Stripe Price IDs exist in `.env.local`**
- `STRIPE_PRICE_SUPPORTER` (currently $4.99) — rename target
- `STRIPE_PRICE_PREMIUM` (currently $9.99) — TO ARCHIVE
- `STRIPE_PRICE_DIAMOND` (currently $14.99 fan) — TO ARCHIVE
- `STRIPE_PRICE_CREATOR` (currently $14.99 creator) — UNTOUCHED

**P3. Grep for testing framework**
```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
grep -E '"(jest|vitest|playwright|mocha)"' package.json
```
Record the framework; all "Run test" steps below assume `npm test <path>`. Adapt the command if needed.

**P4. Verify latest git state is clean on `main`**
```bash
git -C /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation status
```
If dirty: save state, commit or stash, then start.

---

## PHASE 1 — Ship This Week (Auth + Price Migration)

### Task 1: Database migration — add phone column to profiles

**Files:**
- Create: `src/lib/db/migrations/2026-04-17-phone-auth.sql`

**Step 1: Write migration SQL**

```sql
-- Add phone column to profiles for phone-OTP auth
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Track whether email auth was retired after phone migration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_auth_retired BOOLEAN NOT NULL DEFAULT FALSE;

-- Phone-only accounts never had emails; support NULL emails going forward
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Audit who came in via phone vs migrated
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_method TEXT CHECK (auth_method IN ('email', 'phone', 'migrated')) DEFAULT 'email';
```

**Step 2: Run against Supabase (production)**

```bash
bash /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh \
  /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation/src/lib/db/migrations/2026-04-17-phone-auth.sql
```

Expected: `Success. No rows returned.`

**Step 3: Verify columns exist**

```bash
bash /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh <<'EOF'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN ('phone', 'email_auth_retired', 'auth_method', 'email')
ORDER BY column_name;
EOF
```

Expected output includes all 4 columns, `phone` nullable, `email_auth_retired` NOT NULL default false.

**Step 4: Commit**

```bash
git add src/lib/db/migrations/2026-04-17-phone-auth.sql
git commit -m "db: add phone + email_auth_retired + auth_method columns to profiles"
```

---

### Task 2: Phone OTP send endpoint

**Files:**
- Create: `src/app/api/auth/send-otp/route.js`
- Test: `src/app/api/auth/send-otp/route.test.js`

**Step 1: Write failing test**

```javascript
// src/app/api/auth/send-otp/route.test.js
import { POST } from './route';

describe('POST /api/auth/send-otp', () => {
  it('rejects non-US/CA phone numbers', async () => {
    const req = new Request('http://localhost/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '+442071234567' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/US.*CA/);
  });

  it('rejects malformed phone numbers', async () => {
    const req = new Request('http://localhost/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '555' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid US E.164 and returns 200', async () => {
    const req = new Request('http://localhost/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '+14045551234' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/app/api/auth/send-otp/route.test.js
```

Expected: FAIL — `Cannot find module './route'`.

**Step 3: Write minimal implementation**

```javascript
// src/app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const US_CA_REGEX = /^\+1\d{10}$/;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple in-memory rate limit: 1 OTP per phone per 60s
const lastSentByPhone = new Map();

export async function POST(request) {
  const { phone } = await request.json();

  if (!phone || !US_CA_REGEX.test(phone)) {
    return NextResponse.json(
      { error: 'Phone number must be US or CA (+1XXXXXXXXXX).' },
      { status: 400 }
    );
  }

  const now = Date.now();
  const last = lastSentByPhone.get(phone) || 0;
  if (now - last < 60_000) {
    return NextResponse.json(
      { error: 'Too many requests. Wait 60 seconds.' },
      { status: 429 }
    );
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error('[send-otp]', error);
    return NextResponse.json({ error: 'Failed to send code.' }, { status: 500 });
  }

  lastSentByPhone.set(phone, now);
  return NextResponse.json({ success: true });
}
```

**Step 4: Run test**

```bash
npm test src/app/api/auth/send-otp/route.test.js
```

Expected: PASS on the 400s, the 200 test may need mocking of `supabase.auth.signInWithOtp` — add a manual mock if framework allows. If mocking is heavy, skip the 200 assertion in automated tests and verify with a live curl in Step 5.

**Step 5: Live curl test**

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14045551234"}'
```

Expected: `{"success":true}` + SMS received on your phone within 10s. If no SMS, check Supabase dashboard → Auth → Logs for Twilio errors.

**Step 6: Commit**

```bash
git add src/app/api/auth/send-otp/
git commit -m "feat(auth): phone OTP send endpoint via Supabase Phone Auth"
```

---

### Task 3: Phone OTP verify endpoint

**Files:**
- Create: `src/app/api/auth/verify-otp/route.js`
- Test: `src/app/api/auth/verify-otp/route.test.js`

**Step 1: Write failing test**

```javascript
// src/app/api/auth/verify-otp/route.test.js
import { POST } from './route';

describe('POST /api/auth/verify-otp', () => {
  it('rejects missing code', async () => {
    const req = new Request('http://localhost/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '+14045551234' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects malformed code', async () => {
    const req = new Request('http://localhost/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '+14045551234', code: 'abc' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run — verify fails**

```bash
npm test src/app/api/auth/verify-otp/route.test.js
```
Expected: FAIL — module not found.

**Step 3: Implement**

```javascript
// src/app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { phone, code } = await request.json();

  if (!phone || !code || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'Invalid code format.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: 'sms',
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: 'Invalid or expired code.' },
      { status: 401 }
    );
  }

  // Upsert profile row with phone + auth_method
  await supabase.from('profiles').upsert(
    {
      id: data.user.id,
      phone,
      auth_method: 'phone',
      email_auth_retired: false,
    },
    { onConflict: 'id' }
  );

  // Set the same cookies existing login uses (mirror src/app/api/auth/login/route.js pattern)
  const res = NextResponse.json({
    success: true,
    user: { id: data.user.id, phone },
  });

  res.cookies.set('mystation-auth', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  // Mirror existing tier lookup + set mystation-sub cookie
  const { data: sub } = await supabase
    .from('subscribers')
    .select('tier')
    .eq('user_id', data.user.id)
    .single();

  res.cookies.set('mystation-sub', sub?.tier || 'free', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return res;
}
```

**Step 4: Run tests**

```bash
npm test src/app/api/auth/verify-otp/route.test.js
```
Expected: PASS on both 400 tests.

**Step 5: Live manual verify**

Use the OTP you received in Task 2 Step 5:
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+14045551234","code":"123456"}'
```
Expected: `{"success":true, "user":{...}}` + Set-Cookie headers.

**Step 6: Commit**

```bash
git add src/app/api/auth/verify-otp/
git commit -m "feat(auth): phone OTP verify endpoint, session + tier cookies"
```

---

### Task 4: "Listen Free" homepage modal

**Files:**
- Create: `src/components/ListenFreeModal.jsx`
- Modify: `src/app/page.jsx` (homepage) — add prominent CTA button

**Step 1: Check homepage structure**

```bash
grep -l "export default" src/app/page.jsx src/app/page.js 2>/dev/null
```
Identify the actual homepage file and note the section where the hero CTA lives.

**Step 2: Implement modal component**

```jsx
// src/components/ListenFreeModal.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ListenFreeModal({ open, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function sendOtp() {
    setLoading(true);
    setError('');
    const normalized = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Try again.');
    setPhone(normalized);
    setStep('code');
  }

  async function verifyOtp() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || 'Invalid code.');
    router.push('/?welcome=1');
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl w-full max-w-sm p-6 text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">✕</button>
        {step === 'phone' ? (
          <>
            <h2 className="text-2xl font-bold mb-2">Listen Free</h2>
            <p className="text-white/60 mb-4 text-sm">We&apos;ll text you a code. No email, no password.</p>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 rounded-lg mb-3 text-lg"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={sendOtp}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              className="w-full py-3 bg-yellow-400 text-black rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send Code'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">Enter Code</h2>
            <p className="text-white/60 mb-4 text-sm">Code sent to {phone}</p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-neutral-800 rounded-lg mb-3 text-2xl text-center tracking-widest"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <button
              onClick={verifyOtp}
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-yellow-400 text-black rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Listen Free'}
            </button>
            <button onClick={() => setStep('phone')} className="w-full mt-2 text-sm text-white/60">
              Use a different number
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Wire into homepage**

Read `src/app/page.jsx`, find the hero CTA area, replace/add:

```jsx
// at top
import { useState } from 'react';
import ListenFreeModal from '@/components/ListenFreeModal';

// in component:
const [listenOpen, setListenOpen] = useState(false);

// in hero JSX:
<button
  onClick={() => setListenOpen(true)}
  className="px-8 py-4 bg-yellow-400 text-black rounded-full text-xl font-black hover:scale-105 transition"
>
  🎧 Listen Free
</button>
<ListenFreeModal open={listenOpen} onClose={() => setListenOpen(false)} />
```

**Step 4: Autoplay on welcome redirect**

Modify `src/app/page.jsx` to detect `?welcome=1` in searchParams and auto-start a featured track via the existing audio player context (search for `useAudio` or `AudioContext` in `src/lib/` or `src/context/` to identify the hook).

```jsx
// add near top of homepage component
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
// assuming audio context hook:
import { useAudio } from '@/context/AudioContext';

// inside component:
const search = useSearchParams();
const { playTrack } = useAudio();
useEffect(() => {
  if (search.get('welcome') === '1') {
    // Play a curated welcome track — replace slug with an actual LOTL/IDMG catalog track
    fetch('/api/tracks/welcome')
      .then((r) => r.json())
      .then((t) => t?.id && playTrack(t));
  }
}, [search, playTrack]);
```

If `/api/tracks/welcome` does not exist, create a thin route that returns one hardcoded featured track ID from the catalog.

**Step 5: Manual test**

1. Open `http://localhost:3000/`
2. Click "Listen Free"
3. Enter phone, receive code, type it
4. Should redirect to `/?welcome=1` and music auto-plays

**Step 6: Commit**

```bash
git add src/components/ListenFreeModal.jsx src/app/page.jsx
git commit -m "feat(ui): Listen Free modal + welcome autoplay on homepage"
```

---

### Task 5: Legacy email login returns migration prompt

**Files:**
- Modify: `src/app/api/auth/login/route.js`

**Step 1: Read existing login route to understand tier/session flow**

```bash
cat src/app/api/auth/login/route.js
```

**Step 2: Add migration detection**

In the route, after a successful email/password auth but before setting cookies, check `profiles.email_auth_retired`:

```javascript
// Inside POST, after supabase.auth.signInWithPassword succeeds:
const { data: profile } = await supabase
  .from('profiles')
  .select('phone, email_auth_retired')
  .eq('id', authData.user.id)
  .single();

if (profile?.email_auth_retired) {
  return NextResponse.json(
    { error: 'This account now uses phone login.' },
    { status: 410 }
  );
}

if (!profile?.phone) {
  // User has never migrated — require phone link before session issued
  return NextResponse.json(
    { needs_phone_migration: true, user_id: authData.user.id },
    { status: 200 }
  );
}
```

**Step 3: Manual test**

1. Log in with a legacy test account → response = `{ needs_phone_migration: true }`
2. Log in with a fully migrated account → response = 410 Gone
3. Log in with current dev account that has phone already linked → normal session

**Step 4: Commit**

```bash
git add src/app/api/auth/login/route.js
git commit -m "feat(auth): email login returns phone-migration prompt for legacy users"
```

---

### Task 6: Migrate-link endpoint (link phone to existing account)

**Files:**
- Create: `src/app/api/auth/migrate-link/route.js`

**Step 1: Implement**

```javascript
// src/app/api/auth/migrate-link/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const US_CA_REGEX = /^\+1\d{10}$/;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Step A: request OTP for migration
export async function POST(request) {
  const { user_id, phone, code } = await request.json();

  if (!user_id) return NextResponse.json({ error: 'Missing user_id.' }, { status: 400 });
  if (!phone || !US_CA_REGEX.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone.' }, { status: 400 });
  }

  // If no code, send OTP
  if (!code) {
    // Ensure phone is not already linked to a different account
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (existing && existing.id !== user_id) {
      return NextResponse.json({ error: 'Phone already linked to another account.' }, { status: 409 });
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    });
    if (error) return NextResponse.json({ error: 'Failed to send code.' }, { status: 500 });
    return NextResponse.json({ otp_sent: true });
  }

  // If code, verify and link
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid code format.' }, { status: 400 });
  }

  // Supabase does not directly link phone to existing user_id; use admin updateUserById
  const { error: updateErr } = await supabase.auth.admin.updateUserById(user_id, { phone });
  if (updateErr) return NextResponse.json({ error: 'Failed to link phone.' }, { status: 500 });

  // Mark email auth retired
  await supabase
    .from('profiles')
    .update({ phone, auth_method: 'migrated', email_auth_retired: true })
    .eq('id', user_id);

  return NextResponse.json({ success: true });
}
```

**Step 2: Update `ListenFreeModal.jsx` to also support migration mode**

Add a prop `mode="migration"` and `userId` to post to `/api/auth/migrate-link` instead of `send-otp`/`verify-otp`.

**Step 3: Wire the client**

On email login, if response is `{ needs_phone_migration: true, user_id }`, open the modal in migration mode.

**Step 4: Commit**

```bash
git add src/app/api/auth/migrate-link/ src/components/ListenFreeModal.jsx
git commit -m "feat(auth): migrate-link endpoint + modal support for phone migration"
```

---

### Task 7: Stripe price rename + archive (dashboard + code)

**Files:**
- Modify: `.env.local`
- Modify: All code references to `STRIPE_PRICE_SUPPORTER` → `STRIPE_PRICE_PREMIUM_NEW`
- Archive: old `STRIPE_PRICE_PREMIUM` + `STRIPE_PRICE_DIAMOND` in Stripe dashboard (manual)

**Step 1: In Stripe dashboard (manual, by Mike)**

- Archive `price_1T58jrR0BloCNd9rdbo4nqrM` (old $9.99 Premium)
- Archive `price_1T58jrR0BloCNd9rIJ87w2wS` (old $14.99 Diamond fan tier)
- Keep `price_1T58jqR0BloCNd9rYhqdFDc0` ($4.99) — this becomes the new Premium
- Keep `price_1TAcb9R0BloCNd9rZVoMowlO` ($14.99 Creator)

**Step 2: Rename env var**

In `.env.local`:
```
# OLD:
# STRIPE_PRICE_SUPPORTER=price_1T58jqR0BloCNd9rYhqdFDc0
# STRIPE_PRICE_PREMIUM=price_1T58jrR0BloCNd9rdbo4nqrM
# STRIPE_PRICE_DIAMOND=price_1T58jrR0BloCNd9rIJ87w2wS

# NEW:
STRIPE_PRICE_PREMIUM=price_1T58jqR0BloCNd9rYhqdFDc0
STRIPE_PRICE_CREATOR=price_1TAcb9R0BloCNd9rZVoMowlO
```

Also mirror this in Vercel → Project → Settings → Environment Variables (production + preview).

**Step 3: Grep + replace in codebase**

```bash
grep -rn "STRIPE_PRICE_SUPPORTER\|STRIPE_PRICE_DIAMOND" src/
```

For each match: rename `STRIPE_PRICE_SUPPORTER` → `STRIPE_PRICE_PREMIUM`, delete references to `STRIPE_PRICE_DIAMOND`. Check `src/app/api/subscription/checkout/route.js` and `src/lib/tiers.js` specifically.

**Step 4: Update tier enum in `src/lib/tiers.js`**

Remove `diamond` tier entirely. Map `premium` to `level: 1`. Simplify to:
```javascript
export const TIERS = {
  free: { level: 0, name: 'Supporter' },
  premium: { level: 1, name: 'Premium', price: 4.99, priceId: process.env.STRIPE_PRICE_PREMIUM },
  creator: { level: 2, name: 'Creator', price: 14.99, priceId: process.env.STRIPE_PRICE_CREATOR },
};
```

Update `hasAccess(userTier, requiredTier)` callers as needed.

**Step 5: Commit**

```bash
git add .env.local src/
git commit -m "refactor(stripe): collapse fan tiers to Free + Premium ($4.99)"
```

---

### Task 8: Auto-downgrade legacy paid subs script

**Files:**
- Create: `tools/migrate-legacy-fan-subs.js`

**Step 1: Implement**

```javascript
// tools/migrate-legacy-fan-subs.js
// Run ONCE: node tools/migrate-legacy-fan-subs.js
import 'dotenv/config';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NEW_PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_PREMIUM;
const OLD_PRICES_TO_SWAP = [
  'price_1T58jrR0BloCNd9rdbo4nqrM', // old $9.99 Premium
  'price_1T58jrR0BloCNd9rIJ87w2wS', // old $14.99 Diamond fan
];

async function main() {
  console.log('Scanning for legacy fan subscriptions…');
  const { data: subs } = await supabase
    .from('subscribers')
    .select('user_id, email, stripe_subscription_id, tier, status')
    .in('tier', ['premium', 'diamond'])
    .eq('status', 'active');

  console.log(`Found ${subs.length} candidates.`);
  let migrated = 0;
  let skipped = 0;

  for (const sub of subs) {
    if (!sub.stripe_subscription_id) {
      console.log(`SKIP ${sub.email}: no stripe_subscription_id`);
      skipped++;
      continue;
    }
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const item = stripeSub.items.data[0];
      if (!OLD_PRICES_TO_SWAP.includes(item.price.id)) {
        console.log(`SKIP ${sub.email}: not on old price (on ${item.price.id})`);
        skipped++;
        continue;
      }

      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: item.id, price: NEW_PREMIUM_PRICE_ID }],
        proration_behavior: 'none', // do not prorate — bill new price at next cycle
      });

      await supabase
        .from('subscribers')
        .update({ tier: 'premium' })
        .eq('user_id', sub.user_id);

      console.log(`OK   ${sub.email}: swapped to $4.99 Premium`);
      migrated++;
    } catch (err) {
      console.error(`FAIL ${sub.email}:`, err.message);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
}

main().catch(console.error);
```

**Step 2: Dry run first**

Temporarily add `DRY_RUN=true` at top and guard the Stripe + Supabase writes. Run:

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
DRY_RUN=true node tools/migrate-legacy-fan-subs.js
```

Expected: list of candidates, no actual writes.

**Step 3: Get Mike's explicit sign-off before live run**

PAUSE. Show Mike the dry-run output. Get a "GO" before live.

**Step 4: Live run**

```bash
node tools/migrate-legacy-fan-subs.js
```

Expected: `OK` logs for each legacy sub + count at end.

**Step 5: Verify in Stripe dashboard**

Stripe dashboard → Subscriptions → filter by `price = $4.99` → confirm the migrated count matches.

**Step 6: Commit**

```bash
git add tools/migrate-legacy-fan-subs.js
git commit -m "tools: one-time legacy fan-sub migration to \$4.99 Premium"
```

---

## PHASE 2 — Ship Next Week (Premium Paywall + MyTicketsLive)

### Task 9: Premium checkout page with 6-month commitment

**Files:**
- Create: `src/app/premium/page.jsx`
- Modify: `src/app/api/subscription/checkout/route.js`

**Step 1: Build Premium landing page**

```jsx
// src/app/premium/page.jsx
'use client';
import { useState } from 'react';

export default function PremiumPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'premium', commitment_agreed: true }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-white">
      <h1 className="text-4xl font-black mb-4">MyStation Premium</h1>
      <p className="text-xl text-white/80 mb-8">$4.99/month. Everything you love + free & discounted tickets to IDMG events.</p>
      <ul className="space-y-3 mb-8">
        <li>🎟️ Free or discounted tickets to LOTL, IDMG showcases, MPF events</li>
        <li>🏆 Supporter badge on your profile</li>
        <li>💬 VIP color + priority in Live Chat</li>
        <li>🚀 Early access — new features 2 weeks before anyone else</li>
      </ul>
      <div className="bg-neutral-900 rounded-xl p-5 mb-6">
        <label className="flex gap-3 items-start cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5"
          />
          <span className="text-sm">
            I agree to a <b>6-month commitment</b> ($29.94 total, billed as $4.99/month). After 6 months it continues month-to-month and I can cancel anytime.
          </span>
        </label>
      </div>
      <button
        onClick={startCheckout}
        disabled={!agreed || loading}
        className="w-full py-4 bg-yellow-400 text-black rounded-full text-xl font-black disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Start Premium — $4.99/mo'}
      </button>
    </main>
  );
}
```

**Step 2: Modify checkout API to create subscription schedule**

In `src/app/api/subscription/checkout/route.js`, when `plan === 'premium'`, create a Stripe Checkout Session that results in a `subscription_schedule` with a 6-phase lock:

```javascript
// inside POST handler, branch on plan === 'premium':
if (plan === 'premium') {
  if (!body.commitment_agreed) {
    return NextResponse.json({ error: 'Commitment agreement required.' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_PREMIUM, quantity: 1 }],
    subscription_data: {
      metadata: { commitment_months: '6', commitment_start: new Date().toISOString() },
    },
    success_url: `${origin}/premium/success?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/premium`,
    customer_email: userEmail, // or omit for phone-only users
    client_reference_id: userId,
  });

  return NextResponse.json({ url: session.url });
}
```

The 6-month lock is enforced by our cancellation guard (Task 10), not by Stripe's schedule API — simpler, more flexible, easier to refund if needed.

**Step 3: Add cancellation guard**

Modify `src/app/api/subscription/portal/route.js` (or add middleware on subscription update): when a cancel action is requested, check `metadata.commitment_start`; if fewer than 6 billing cycles have passed, reject:

```javascript
// in subscription portal or cancel handler:
const sub = await stripe.subscriptions.retrieve(subscriptionId);
const start = new Date(sub.metadata.commitment_start);
const now = new Date();
const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
if (monthsPassed < 6) {
  return NextResponse.json({
    error: `Premium has a 6-month commitment. You can cancel starting ${new Date(start.getTime() + 6 * 30 * 86400000).toLocaleDateString()}.`,
  }, { status: 403 });
}
```

**Step 4: Manual test**

1. Visit `/premium`, check box, click subscribe → Stripe Checkout opens
2. Use test card `4242 4242 4242 4242`, any future date, any CVC
3. Complete checkout → redirected to success page
4. Visit Stripe customer portal → try to cancel → should be rejected with commitment message
5. Fast-forward test: manually edit `metadata.commitment_start` in Stripe to 7 months ago → portal cancel succeeds

**Step 5: Commit**

```bash
git add src/app/premium/ src/app/api/subscription/checkout/route.js src/app/api/subscription/portal/route.js
git commit -m "feat(premium): \$4.99 checkout with 6-month commitment + cancel guard"
```

---

### Task 10: Premium perks — badge, Live Chat VIP color, Supporters Wall

**Files:**
- Modify: `src/app/artist/[slug]/page.jsx` (badge display)
- Modify: Live Chat component (search: `grep -rn "LiveChat\|live-chat" src/components`)
- Create: `src/app/supporters/page.jsx`

**Step 1: Badge on profile**

Add a `<span class="premium-badge">PREMIUM</span>` next to display name if the user's subscriber tier is `premium`.

Fetch via `/api/subscription/status` and conditionally render.

**Step 2: VIP color in Live Chat**

In the Live Chat message rendering component, check tier; if `premium`, render message text or username in `text-yellow-400` (or whatever the Premium color will be). Add `data-tier` attribute to make it testable.

**Step 3: Supporters Wall page**

```jsx
// src/app/supporters/page.jsx
import { createClient } from '@supabase/supabase-js';

export default async function SupportersPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: supporters } = await supabase
    .from('subscribers')
    .select('email, tier, created_at')
    .eq('tier', 'premium')
    .order('created_at', { ascending: true })
    .limit(500);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-white">
      <h1 className="text-4xl font-black mb-2">Supporters Wall</h1>
      <p className="text-white/60 mb-8">Thank you to every Premium member keeping the station alive.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {supporters?.map((s, i) => (
          <div key={i} className="bg-neutral-900 rounded-lg p-3 text-sm">
            <div className="font-bold">{s.email.split('@')[0]}</div>
            <div className="text-white/40 text-xs">Premium since {new Date(s.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
```

**Step 4: Manual test**

Subscribe a test account to Premium (Task 9), verify:
- `/artist/[your-slug]` shows PREMIUM badge
- Live Chat messages render in Premium color
- `/supporters` shows your email prefix

**Step 5: Commit**

```bash
git add src/
git commit -m "feat(premium): badge, VIP Live Chat color, Supporters Wall page"
```

---

### Task 11: MyStation `/api/members/check-premium` endpoint

**Files:**
- Create: `src/app/api/members/check-premium/route.js`
- Modify: `.env.local` — add `MYSTATION_SHARED_SECRET`

**Step 1: Implement**

```javascript
// src/app/api/members/check-premium/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const authHeader = request.headers.get('x-shared-secret');
  if (authHeader !== process.env.MYSTATION_SHARED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const phone = new URL(request.url).searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'Missing phone.' }, { status: 400 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (!profile) return NextResponse.json({ is_premium: false });

  const { data: sub } = await supabase
    .from('subscribers')
    .select('tier, status, current_period_end')
    .eq('user_id', profile.id)
    .single();

  const isPremium = sub?.tier === 'premium' && sub?.status === 'active';

  return NextResponse.json({
    is_premium: isPremium,
    current_period_end: sub?.current_period_end || null,
  });
}
```

**Step 2: Generate shared secret**

```bash
openssl rand -hex 32
```

Add to both `.env.local` (MyStation) and MyTicketsLive `.env.local` as `MYSTATION_SHARED_SECRET`.

**Step 3: Manual test**

```bash
curl -H "x-shared-secret: $MYSTATION_SHARED_SECRET" \
  "http://localhost:3000/api/members/check-premium?phone=%2B14045551234"
```
Expected: `{"is_premium":false}` or `{"is_premium":true,"current_period_end":"..."}`.

**Step 4: Commit**

```bash
git add src/app/api/members/ .env.local
git commit -m "feat(api): cross-app Premium check endpoint for MyTicketsLive"
```

---

### Task 12: MyTicketsLive — apply Premium benefit at checkout

**Files (MyTicketsLive repo, separate from MyStation):**
- Migration: add `premium_benefit JSONB` column to `events` table
- Modify: event admin create/edit form — dropdown for benefit type + value
- Modify: checkout pricing flow — lookup Premium, apply benefit

**Step 1: DB migration (MyTicketsLive)**

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS premium_benefit JSONB DEFAULT NULL;
-- example value: {"type": "percent_off", "value": 20}
-- types: "free" | "percent_off" | "fixed_off" | "none"
```

**Step 2: Admin event form**

Add a select + number input:
- Benefit type: None / Free / % off / $ off
- Value (shown if % or $): number

On save: `UPDATE events SET premium_benefit = $1 WHERE id = $2`.

**Step 3: Checkout flow**

In MyTicketsLive checkout, after user enters phone:

```javascript
const premiumRes = await fetch(`${MYSTATION_URL}/api/members/check-premium?phone=${encodeURIComponent(phone)}`, {
  headers: { 'x-shared-secret': process.env.MYSTATION_SHARED_SECRET },
});
const { is_premium } = await premiumRes.json();

const event = /* fetched event */;
if (is_premium && event.premium_benefit) {
  const b = event.premium_benefit;
  if (b.type === 'free') finalPrice = 0;
  else if (b.type === 'percent_off') finalPrice = basePrice * (1 - b.value / 100);
  else if (b.type === 'fixed_off') finalPrice = Math.max(0, basePrice - b.value);
}
```

**Step 4: Non-Premium upsell banner**

If `is_premium === false` and event has a Premium benefit configured, show at checkout:

```
💎 Save on this ticket with Premium ($4.99/mo) → [Sign up at mystationlive.com/premium]
```

**Step 5: Manual test**

- Create a test event in MyTicketsLive admin with `premium_benefit = {type: 'percent_off', value: 20}`
- Checkout as a Premium user → price reduced 20%
- Checkout as non-Premium → full price + upsell banner

**Step 6: Commit (in MyTicketsLive repo)**

```bash
cd /path/to/myticketslive
git add .
git commit -m "feat: Premium benefit per-event + checkout integration with MyStation"
```

---

## PHASE 3 — Build Now, Flip Month 7 (Dormant Feature Gates)

### Task 13: `MYSTATION_MONETIZATION_MODE` env var + helper

**Files:**
- Modify: `src/lib/tiers.js`
- Create: `src/lib/monetization.js`

**Step 1: Implement helper**

```javascript
// src/lib/monetization.js
export function isMonetizationEnforced() {
  return process.env.MYSTATION_MONETIZATION_MODE === 'enforce';
}

export function gateFor(feature, userTier) {
  if (!isMonetizationEnforced()) return { allowed: true, reason: 'grow_mode' };

  const rules = {
    ad_free: (t) => t === 'premium' || t === 'creator',
    hi_fi_audio: (t) => t === 'premium' || t === 'creator',
    unlimited_skips: (t) => t === 'premium' || t === 'creator',
  };

  const rule = rules[feature];
  if (!rule) return { allowed: true, reason: 'unknown_feature' };

  return rule(userTier)
    ? { allowed: true, reason: 'tier_allows' }
    : { allowed: false, reason: 'upgrade_required' };
}
```

**Step 2: Set env var default**

In `.env.local` and Vercel env vars:
```
MYSTATION_MONETIZATION_MODE=grow
```

**Step 3: Commit**

```bash
git add src/lib/monetization.js .env.local
git commit -m "feat: MYSTATION_MONETIZATION_MODE env gate + helper"
```

---

### Task 14: Wire ad-serve + skip counter to the gate

**Files:**
- Modify: `src/app/api/ads/serve/route.js`
- Create: `src/app/api/playback/skip/route.js`

**Step 1: Gate the ad-serve route**

At the top of the ads/serve handler:
```javascript
import { gateFor } from '@/lib/monetization';
const { allowed } = gateFor('ad_free', userTier); // allowed = no ad shown
if (allowed) return new NextResponse(null, { status: 204 });
// else: serve ad as before
```

**Step 2: Build skip counter endpoint**

```javascript
// src/app/api/playback/skip/route.js
import { NextResponse } from 'next/server';
import { gateFor, isMonetizationEnforced } from '@/lib/monetization';

export async function POST(request) {
  const { userTier } = await request.json(); // get from session in real impl
  if (!isMonetizationEnforced()) return NextResponse.json({ allowed: true });

  const { allowed } = gateFor('unlimited_skips', userTier);
  if (allowed) return NextResponse.json({ allowed: true });

  // TODO month-7: implement per-user skip counter in Redis or Postgres daily_plays
  // For now: record skip in daily_plays table, enforce 6/hour on free tier
  return NextResponse.json({ allowed: false, reason: 'skip_limit_reached' });
}
```

**Step 3: Commit**

```bash
git add src/app/api/ads/ src/app/api/playback/
git commit -m "feat: dormant ad-serve + skip-limit gates (no-op in grow mode)"
```

---

### Task 15: Hi-fi audio column + selector

**Files:**
- Migration: `src/lib/db/migrations/2026-04-17-hi-fi-column.sql`
- Modify: audio URL selector (search: `grep -rn "audio_url" src/`)

**Step 1: Add column**

```sql
-- src/lib/db/migrations/2026-04-17-hi-fi-column.sql
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_url_hifi TEXT;
```

Apply via `supabase-sql.sh`.

**Step 2: Selector helper**

```javascript
// src/lib/audio-url.js
import { gateFor } from '@/lib/monetization';

export function selectAudioUrl(track, userTier) {
  const { allowed } = gateFor('hi_fi_audio', userTier);
  if (allowed && track.audio_url_hifi) return track.audio_url_hifi;
  return track.audio_url;
}
```

**Step 3: Replace call sites**

Grep for raw `track.audio_url` usage; replace with `selectAudioUrl(track, userTier)`.

**Step 4: Catalog encoding (deferred to month 6)**

Add a TODO note in `docs/plans/2026-04-17-phone-otp-premium-redesign-design.md`: before flipping `enforce`, re-encode catalog tracks to 320kbps and populate `audio_url_hifi`. This is a one-time batch job, not part of the code deploy.

**Step 5: Commit**

```bash
git add src/lib/audio-url.js src/lib/db/migrations/ src/
git commit -m "feat: hi-fi audio column + gated selector (dormant in grow mode)"
```

---

## Deployment Checklist

After Phase 1 tasks (1–8) complete:

1. Run `npm run build` locally — expect 0 errors.
2. `curl https://localhost:3000/` + `/music` + `/premium` — all 200.
3. Kill any in-flight builds: `vercel ls | grep Building` (should be empty).
4. Deploy: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && vercel --prod`.
5. Post-deploy verification:
   ```bash
   for p in / /premium /supporters /dashboard; do
     echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
   done
   ```
   Expect 200 on all.
6. Live smoke test:
   - Listen Free modal → phone → OTP → autoplay works
   - Legacy email login → migration prompt → phone link → session works
   - Premium checkout → 6-month commitment → Stripe success → badge visible
7. Update `~/.claude/memory/SESSION_STATE.md` with deploy hash.

Repeat for Phase 2 + Phase 3 deploys.

---

## Month-7 Flip Playbook (Run in October 2026)

When it's time to enforce monetization:

1. Re-encode catalog to 320kbps, populate `tracks.audio_url_hifi`.
2. Flip env var: `MYSTATION_MONETIZATION_MODE=enforce` in Vercel.
3. Deploy (no code change, just env).
4. Verify: free user sees ads + skip limits + standard quality; Premium user sees none.
5. Send one email to all users 1 week BEFORE flip: "Something new is coming to MyStation — here's what changes."

---

**End of plan.** Ready to execute via superpowers:executing-plans or superpowers:subagent-driven-development.
