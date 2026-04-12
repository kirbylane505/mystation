# Vision Plan On Demand — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy visionplanondemand.com — a chat-first AI service that turns any dream into a professional 90-day plan deck in 90 minutes or less.

**Architecture:** Next.js 15 App Router deployed on Vercel. Chat UI talks to Claude API (6 Deckster agents). Voice input via Whisper API. Deck rendering via Puppeteer → PDF. Stripe for payments (Free/$49/$149). R2 for PDF storage. Resend for email delivery. PWA installable.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Claude API (Anthropic SDK), OpenAI Whisper API, Puppeteer, Stripe, Cloudflare R2 (AWS S3 SDK), Resend, Zustand

---

## Task 1: Scaffold Next.js 15 App

**Files:**
- Create: `/MikePageEmpire/apps/vpod/` (entire project)

**Step 1: Create Next.js project**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps
npx create-next-app@latest vpod --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

**Step 2: Install core dependencies**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/vpod
npm install @anthropic-ai/sdk openai stripe @aws-sdk/client-s3 resend zustand puppeteer-core @chromium/puppeteer uuid
npm install -D @types/uuid
```

**Step 3: Set up environment variables**

Create `.env.local`:
```env
# Claude API
ANTHROPIC_API_KEY=

# OpenAI (Whisper)
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Price IDs
STRIPE_PRICE_STANDARD=
STRIPE_PRICE_PREMIUM=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=vpod-decks

# Resend
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://visionplanondemand.com
```

**Step 4: Configure Tailwind with design tokens**

Update `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-dark: #06080d;
  --color-card: #0e1117;
  --color-card2: #161b24;
  --color-teal: #00e5c7;
  --color-teal2: #00c4aa;
  --color-gold: #f0c040;
  --color-gray: #7a8494;
  --color-light: #c0c8d8;
  --font-display: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
}

html, body {
  background: var(--color-dark);
  color: white;
  font-family: var(--font-body);
}
```

**Step 5: Add Google Fonts to layout**

Update `src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vision Plan On Demand',
  description: 'Every dream deserves a plan. Get a professional 90-day action plan in 90 minutes.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#06080d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold VPOD Next.js 15 app with dependencies and design tokens"
```

---

## Task 2: PWA Setup

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `src/hooks/usePWA.ts`
- Create: `src/components/PWAInstallBanner.tsx`

**Step 1: Create manifest**

`public/manifest.json`:
```json
{
  "name": "Vision Plan On Demand",
  "short_name": "VPOD",
  "description": "Every dream deserves a plan",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#06080d",
  "theme_color": "#06080d",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Step 2: Create service worker**

`public/sw.js`:
```js
const CACHE_NAME = 'vpod-v1';
const PRECACHE = ['/', '/offline'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/offline')))
  );
});
```

**Step 3: Create usePWA hook**

`src/hooks/usePWA.ts`:
```ts
'use client';
import { useState, useEffect } from 'react';

export default function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };

  return { canInstall: !!installPrompt, isInstalled, isPWA, install };
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: PWA setup — manifest, service worker, install hook"
```

---

## Task 3: Zustand Store — Session & Chat State

**Files:**
- Create: `src/store/chatStore.ts`
- Create: `src/lib/types.ts`

**Step 1: Define types**

`src/lib/types.ts`:
```ts
export type VisionCategory =
  | 'business' | 'creative' | 'college' | 'nonprofit'
  | 'health' | 'realestate' | 'event' | 'finance'
  | 'tech' | 'anything';

export type Tier = 'free' | 'standard' | 'premium';

export type AgentName = 'PRIME' | 'SCRIBE' | 'ARCHITECT' | 'LEDGER' | 'CANVAS' | 'PRESS';

export type AgentStatus = 'idle' | 'working' | 'done' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent-status';
  content: string;
  agent?: AgentName;
  agentStatus?: AgentStatus;
  timestamp: number;
}

export interface DeckResult {
  id: string;
  htmlUrl?: string;
  pdfUrl?: string;
  slideCount: number;
  tier: Tier;
  createdAt: number;
}

export interface Session {
  id: string;
  category?: VisionCategory;
  tier: Tier;
  messages: ChatMessage[];
  agentStatuses: Record<AgentName, AgentStatus>;
  deck?: DeckResult;
  visionText?: string;
  followUpAnswers: string[];
  phase: 'greeting' | 'classifying' | 'follow-ups' | 'generating' | 'delivered' | 'revising';
  email?: string;
  paid: boolean;
}
```

**Step 2: Create Zustand store**

`src/store/chatStore.ts`:
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Session, ChatMessage, AgentName, AgentStatus, Tier, VisionCategory } from '@/lib/types';

const DEFAULT_AGENTS: Record<AgentName, AgentStatus> = {
  PRIME: 'idle', SCRIBE: 'idle', ARCHITECT: 'idle',
  LEDGER: 'idle', CANVAS: 'idle', PRESS: 'idle',
};

interface ChatStore {
  session: Session;
  newSession: () => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setPhase: (phase: Session['phase']) => void;
  setCategory: (cat: VisionCategory) => void;
  setTier: (tier: Tier) => void;
  setAgentStatus: (agent: AgentName, status: AgentStatus) => void;
  setDeck: (deck: Session['deck']) => void;
  setEmail: (email: string) => void;
  setPaid: (paid: boolean) => void;
  setVisionText: (text: string) => void;
  addFollowUp: (answer: string) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      session: {
        id: uuid(), category: undefined, tier: 'free',
        messages: [], agentStatuses: { ...DEFAULT_AGENTS },
        followUpAnswers: [], phase: 'greeting', paid: false,
      },
      newSession: () => set({
        session: {
          id: uuid(), category: undefined, tier: 'free',
          messages: [], agentStatuses: { ...DEFAULT_AGENTS },
          followUpAnswers: [], phase: 'greeting', paid: false,
        },
      }),
      addMessage: (msg) => set((s) => ({
        session: {
          ...s.session,
          messages: [...s.session.messages, { ...msg, id: uuid(), timestamp: Date.now() }],
        },
      })),
      setPhase: (phase) => set((s) => ({ session: { ...s.session, phase } })),
      setCategory: (category) => set((s) => ({ session: { ...s.session, category } })),
      setTier: (tier) => set((s) => ({ session: { ...s.session, tier } })),
      setAgentStatus: (agent, status) => set((s) => ({
        session: {
          ...s.session,
          agentStatuses: { ...s.session.agentStatuses, [agent]: status },
        },
      })),
      setDeck: (deck) => set((s) => ({ session: { ...s.session, deck } })),
      setEmail: (email) => set((s) => ({ session: { ...s.session, email } })),
      setPaid: (paid) => set((s) => ({ session: { ...s.session, paid } })),
      setVisionText: (text) => set((s) => ({ session: { ...s.session, visionText: text } })),
      addFollowUp: (answer) => set((s) => ({
        session: {
          ...s.session,
          followUpAnswers: [...s.session.followUpAnswers, answer],
        },
      })),
    }),
    { name: 'vpod-session' }
  )
);
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: Zustand chat store with session, agents, and deck state"
```

---

## Task 4: Landing Page — Marketing Website

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/Hero.tsx`
- Create: `src/components/HowItWorks.tsx`
- Create: `src/components/Categories.tsx`
- Create: `src/components/Pricing.tsx`
- Create: `src/components/FAQ.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/components/Navbar.tsx`

**Step 1: Create Navbar**

`src/components/Navbar.tsx`:
```tsx
'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold text-white">
          Vision Plan <span className="text-teal">On Demand</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-light">
          <a href="#how-it-works">How It Works</a>
          <a href="#categories">Categories</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <Link
          href="/chat"
          className="bg-teal text-dark font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-teal2 transition"
        >
          Start Your Plan
        </Link>
      </div>
    </nav>
  );
}
```

**Step 2: Create Hero**

`src/components/Hero.tsx`:
```tsx
'use client';
import Link from 'next/link';

const CATEGORIES = [
  'Business Startup', 'College Plan', 'Health & Wellness',
  'Creative Project', 'Tech Startup', 'Financial Freedom',
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-16 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-teal/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />

      <div className="relative z-10 text-center max-w-4xl">
        <div className="inline-block bg-teal/10 border border-teal/20 rounded-full px-4 py-1.5 text-teal text-sm font-semibold mb-8 tracking-wide">
          90-Day Plan in 90 Minutes
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          Every Dream<br />Deserves a <span className="text-teal">Plan</span>
        </h1>
        <p className="text-light text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          Tell us your vision — business, college, health, creative project, anything.
          Our AI team builds you a professional 90-day action plan deck.
        </p>

        <Link
          href="/chat"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-teal to-teal2 text-dark font-black text-lg px-8 py-4 rounded-2xl hover:opacity-90 transition shadow-lg shadow-teal/20 mb-10"
        >
          Talk to Deckster — It&apos;s Free
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>

        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/chat?category=${encodeURIComponent(cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'))}`}
              className="bg-card border border-white/5 text-light text-sm px-4 py-2 rounded-xl hover:border-teal/30 hover:text-teal transition"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 3: Create HowItWorks**

`src/components/HowItWorks.tsx`:
```tsx
export default function HowItWorks() {
  const steps = [
    { num: '01', title: 'Talk', desc: 'Tell Deckster your dream — type or use voice. Pick a category or just start talking.', icon: '🎙️' },
    { num: '02', title: 'Build', desc: '6 AI agents work in parallel — writing content, structuring your plan, crunching numbers.', icon: '⚡' },
    { num: '03', title: 'Deliver', desc: 'Download your professional deck as PDF. Share a pitch link. Update anytime.', icon: '📋' },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-black text-white text-center mb-4">
          How It <span className="text-teal">Works</span>
        </h2>
        <p className="text-gray text-center mb-16 text-lg">Three steps. One conversation. Your plan is ready.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="bg-card border border-white/5 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">{s.icon}</div>
              <div className="text-teal text-sm font-bold tracking-widest mb-2">STEP {s.num}</div>
              <h3 className="text-white text-2xl font-bold mb-3">{s.title}</h3>
              <p className="text-light leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 4: Create Categories**

`src/components/Categories.tsx`:
```tsx
const CATS = [
  { emoji: '🏢', name: 'Business Startup', desc: 'Restaurant, clinic, barber shop, trucking, franchise' },
  { emoji: '🎓', name: 'College Plan', desc: '4-year path, scholarships, career goals' },
  { emoji: '💪', name: 'Health & Wellness', desc: 'Get back in shape — heal yourself in 90 days' },
  { emoji: '🎨', name: 'Creative Project', desc: 'Album, film, fashion line, book launch' },
  { emoji: '💻', name: 'Tech Startup', desc: 'App, SaaS, platform, MVP roadmap' },
  { emoji: '❤️', name: 'Nonprofit', desc: 'Foundation launch, fundraising, grants' },
  { emoji: '🏠', name: 'Real Estate', desc: 'Flip plan, rental portfolio, Airbnb' },
  { emoji: '🎪', name: 'Event Planning', desc: 'Festival, wedding, conference, pop-up' },
  { emoji: '💰', name: 'Financial Freedom', desc: 'Debt payoff, savings plan, investing' },
  { emoji: '🌟', name: 'Anything', desc: '"I have a dream and I need a plan"' },
];

export default function Categories() {
  return (
    <section id="categories" className="py-24 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-black text-white text-center mb-4">
          For <span className="text-teal">Everyone</span>
        </h2>
        <p className="text-gray text-center mb-16 text-lg">Not just business plans — ANY dream, ANY person, ANY vision</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATS.map((c) => (
            <div key={c.name} className="bg-card border border-white/5 rounded-2xl p-5 text-center hover:border-teal/20 transition">
              <div className="text-3xl mb-3">{c.emoji}</div>
              <h3 className="text-white font-bold text-sm mb-1">{c.name}</h3>
              <p className="text-gray text-xs">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 5: Create Pricing**

`src/components/Pricing.tsx`:
```tsx
import Link from 'next/link';

const TIERS = [
  {
    name: 'Free', price: '$0', period: 'Your first plan', color: 'teal',
    features: ['5-slide basic outline', 'Vision summary', '3 action phases', 'Next steps checklist', 'PDF download'],
    cta: 'Start Free', href: '/chat?tier=free',
  },
  {
    name: 'Standard', price: '$49', period: 'per plan', color: 'teal', featured: true,
    features: ['10-slide full deck', '90-day plan with milestones', 'Team structure', 'Timeline & phases', 'Basic cost estimates', 'Shareable pitch link'],
    cta: 'Get Standard', href: '/chat?tier=standard',
  },
  {
    name: 'Premium', price: '$149', period: 'per plan', color: 'gold',
    features: ['13+ slide deck', 'Full financial projections', 'Revenue & ROI analysis', 'Market sizing', 'Exit strategy', 'Licensing plan', 'Pitch link + email delivery', 'Chat-based revisions'],
    cta: 'Go Premium', href: '/chat?tier=premium',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-black text-white text-center mb-4">
          <span className="text-teal">Pricing</span>
        </h2>
        <p className="text-gray text-center mb-16 text-lg">Free to start — upgrade when you&apos;re ready to go all in</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div key={t.name} className={`bg-card rounded-2xl p-8 border ${t.featured ? 'border-teal/40 ring-1 ring-teal/20' : 'border-white/5'} flex flex-col`}>
              <div className={`text-${t.color} text-sm font-bold tracking-widest mb-4`}>{t.name.toUpperCase()}</div>
              <div className="text-white text-5xl font-black mb-1">{t.price}</div>
              <div className="text-gray text-sm mb-6">{t.period}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-light text-sm">
                    <span className={`text-${t.color} mt-0.5`}>→</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`w-full py-3 rounded-xl font-bold text-center transition ${
                  t.featured
                    ? 'bg-gradient-to-r from-teal to-teal2 text-dark hover:opacity-90'
                    : t.color === 'gold'
                    ? 'bg-gradient-to-r from-gold to-yellow-500 text-dark hover:opacity-90'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 6: Create FAQ**

`src/components/FAQ.tsx`:
```tsx
'use client';
import { useState } from 'react';

const FAQS = [
  { q: 'What is Vision Plan On Demand?', a: 'An AI-powered service that turns your dream — any dream — into a professional 90-day action plan deck. Business, college, health, creative projects, anything.' },
  { q: 'How long does it take?', a: 'Your deck is ready in 90 minutes or less. 6 AI agents work in parallel to write content, structure your plan, and crunch numbers simultaneously.' },
  { q: 'Do I need to write a business plan first?', a: 'No. Just talk or type. Tell Deckster your vision in plain language — even a voice memo works. We handle all the structure, financials, and formatting.' },
  { q: 'What do I get with the free tier?', a: 'A 5-slide basic outline with your vision summary, 3 action phases, and next steps. No financials. Great for testing the experience.' },
  { q: 'Can I update my plan later?', a: 'Yes. After delivery, just chat with Deckster to request changes. "Change the budget to $300K" or "Add a marketing section" — we regenerate affected slides.' },
  { q: 'Is this just for businesses?', a: 'Not at all. College plans, health & fitness goals, creative projects, event planning, financial freedom, nonprofit launches — if you have a dream, we make the plan.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-24 px-6 bg-card/50">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-4xl font-black text-white text-center mb-16">
          <span className="text-teal">FAQ</span>
        </h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="bg-card border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between text-white font-semibold"
              >
                {f.q}
                <span className={`text-teal transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && <div className="px-6 pb-4 text-light text-sm leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 7: Create Footer**

`src/components/Footer.tsx`:
```tsx
export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display text-lg font-bold text-white">
          Vision Plan <span className="text-teal">On Demand</span>
        </div>
        <p className="text-gray text-sm">Every plan supports the Mike Page Foundation 501(c)(3)</p>
        <p className="text-gray text-xs">&copy; {new Date().getFullYear()} IDMG. All rights reserved.</p>
      </div>
    </footer>
  );
}
```

**Step 8: Assemble landing page**

`src/app/page.tsx`:
```tsx
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Categories from '@/components/Categories';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Categories />
      <Pricing />
      <FAQ />
      <Footer />
    </>
  );
}
```

**Step 9: Verify build**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/vpod && npx next build
```

**Step 10: Commit**

```bash
git add -A && git commit -m "feat: landing page — hero, how it works, categories, pricing, FAQ, footer"
```

---

## Task 5: Chat UI — The Core Experience

**Files:**
- Create: `src/app/chat/page.tsx`
- Create: `src/components/chat/ChatWindow.tsx`
- Create: `src/components/chat/ChatInput.tsx`
- Create: `src/components/chat/MessageBubble.tsx`
- Create: `src/components/chat/AgentStatusBar.tsx`
- Create: `src/components/chat/CategoryPicker.tsx`
- Create: `src/components/chat/VoiceButton.tsx`

**Step 1: Create ChatWindow (main container)**

`src/components/chat/ChatWindow.tsx`:
```tsx
'use client';
import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import AgentStatusBar from './AgentStatusBar';
import CategoryPicker from './CategoryPicker';

export default function ChatWindow() {
  const { session } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages.length]);

  const showCategories = session.phase === 'greeting' && session.messages.length === 0;
  const showAgents = session.phase === 'generating';

  return (
    <div className="flex flex-col h-[100dvh] bg-dark">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-dark/80 backdrop-blur-xl">
        <div className="w-10 h-10 bg-gradient-to-br from-teal to-teal2 rounded-xl flex items-center justify-center">
          <span className="text-dark font-black text-sm">D6</span>
        </div>
        <div>
          <div className="text-white font-bold text-sm">Deckster Prime</div>
          <div className="text-teal text-xs">The Deckster 6 — Ready</div>
        </div>
      </div>

      {/* Agent status bar */}
      {showAgents && <AgentStatusBar />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {session.messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">What&apos;s your vision?</h2>
            <p className="text-gray text-sm max-w-md mx-auto mb-8">
              Tell me your dream — a business, a college plan, a fitness goal, anything.
              I&apos;ll build you a professional 90-day plan.
            </p>
          </div>
        )}
        {showCategories && <CategoryPicker />}
        {session.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
```

**Step 2: Create MessageBubble**

`src/components/chat/MessageBubble.tsx`:
```tsx
import type { ChatMessage } from '@/lib/types';

const AGENT_COLORS: Record<string, string> = {
  PRIME: 'text-teal', SCRIBE: 'text-blue-400', ARCHITECT: 'text-purple-400',
  LEDGER: 'text-green-400', CANVAS: 'text-pink-400', PRESS: 'text-gold',
};

export default function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'agent-status') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray py-1 px-2">
        <div className={`w-2 h-2 rounded-full ${message.agentStatus === 'working' ? 'bg-teal animate-pulse' : message.agentStatus === 'done' ? 'bg-green-400' : 'bg-gray'}`} />
        <span className={AGENT_COLORS[message.agent || ''] || 'text-gray'}>{message.agent}</span>
        <span>{message.content}</span>
      </div>
    );
  }

  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-teal text-dark rounded-br-md'
          : 'bg-card border border-white/5 text-light rounded-bl-md'
      }`}>
        {message.content}
      </div>
    </div>
  );
}
```

**Step 3: Create ChatInput with voice button**

`src/components/chat/ChatInput.tsx`:
```tsx
'use client';
import { useState, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import VoiceButton from './VoiceButton';

export default function ChatInput() {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { addMessage, session } = useChatStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    addMessage({ role: 'user', content: trimmed });
    setText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          message: trimmed,
          category: session.category,
          tier: session.tier,
          phase: session.phase,
          visionText: session.visionText,
          followUpAnswers: session.followUpAnswers,
        }),
      });
      const data = await res.json();
      if (data.reply) addMessage({ role: 'assistant', content: data.reply });
      // Handle phase transitions, agent statuses, etc. from response
      if (data.phase) useChatStore.getState().setPhase(data.phase);
      if (data.category) useChatStore.getState().setCategory(data.category);
      if (data.visionText) useChatStore.getState().setVisionText(data.visionText);
    } catch {
      addMessage({ role: 'assistant', content: 'Something went wrong. Please try again.' });
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleVoiceResult = (transcript: string) => {
    setText(transcript);
  };

  return (
    <div className="border-t border-white/5 bg-dark/80 backdrop-blur-xl p-4">
      <div className="max-w-3xl mx-auto flex items-end gap-3">
        <VoiceButton onResult={handleVoiceResult} />
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Tell me your vision..."
          rows={1}
          className="flex-1 bg-card border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray resize-none focus:outline-none focus:border-teal/40"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="bg-teal text-dark font-bold px-5 py-3 rounded-xl hover:bg-teal2 transition disabled:opacity-40"
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Create VoiceButton (Whisper integration)**

`src/components/chat/VoiceButton.tsx`:
```tsx
'use client';
import { useState, useRef } from 'react';

export default function VoiceButton({ onResult }: { onResult: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggle = async () => {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.text) onResult(data.text);
        } catch {}
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${
        recording ? 'bg-red-500 animate-pulse' : 'bg-card border border-white/10 hover:border-teal/30'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={recording ? 'white' : '#7a8494'} strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}
```

**Step 5: Create AgentStatusBar**

`src/components/chat/AgentStatusBar.tsx`:
```tsx
'use client';
import { useChatStore } from '@/store/chatStore';
import type { AgentName } from '@/lib/types';

const AGENTS: { name: AgentName; label: string; color: string }[] = [
  { name: 'PRIME', label: 'Prime', color: 'bg-teal' },
  { name: 'SCRIBE', label: 'Scribe', color: 'bg-blue-400' },
  { name: 'ARCHITECT', label: 'Architect', color: 'bg-purple-400' },
  { name: 'LEDGER', label: 'Ledger', color: 'bg-green-400' },
  { name: 'CANVAS', label: 'Canvas', color: 'bg-pink-400' },
  { name: 'PRESS', label: 'Press', color: 'bg-gold' },
];

export default function AgentStatusBar() {
  const { session } = useChatStore();
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 overflow-x-auto">
      {AGENTS.map((a) => {
        const status = session.agentStatuses[a.name];
        return (
          <div key={a.name} className="flex items-center gap-1.5 bg-card rounded-lg px-3 py-1.5 shrink-0">
            <div className={`w-2 h-2 rounded-full ${
              status === 'working' ? `${a.color} animate-pulse`
              : status === 'done' ? 'bg-green-400'
              : 'bg-gray/40'
            }`} />
            <span className="text-xs text-light font-medium">{a.label}</span>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 6: Create CategoryPicker**

`src/components/chat/CategoryPicker.tsx`:
```tsx
'use client';
import { useChatStore } from '@/store/chatStore';
import type { VisionCategory } from '@/lib/types';

const CATS: { id: VisionCategory; emoji: string; label: string }[] = [
  { id: 'business', emoji: '🏢', label: 'Business Startup' },
  { id: 'college', emoji: '🎓', label: 'College Plan' },
  { id: 'health', emoji: '💪', label: 'Health & Wellness' },
  { id: 'creative', emoji: '🎨', label: 'Creative Project' },
  { id: 'tech', emoji: '💻', label: 'Tech Startup' },
  { id: 'nonprofit', emoji: '❤️', label: 'Nonprofit' },
  { id: 'realestate', emoji: '🏠', label: 'Real Estate' },
  { id: 'event', emoji: '🎪', label: 'Event Planning' },
  { id: 'finance', emoji: '💰', label: 'Financial Freedom' },
  { id: 'anything', emoji: '🌟', label: 'Anything' },
];

export default function CategoryPicker() {
  const { setCategory, addMessage, setPhase } = useChatStore();

  const pick = (cat: typeof CATS[number]) => {
    setCategory(cat.id);
    addMessage({ role: 'user', content: `I want to build a ${cat.label.toLowerCase()} plan` });
    setPhase('classifying');
    // Trigger chat API for classification
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `I want to build a ${cat.label.toLowerCase()} plan`, category: cat.id, phase: 'classifying' }),
    }).then(r => r.json()).then(data => {
      if (data.reply) useChatStore.getState().addMessage({ role: 'assistant', content: data.reply });
      if (data.phase) useChatStore.getState().setPhase(data.phase);
    }).catch(() => {});
  };

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {CATS.map((c) => (
        <button
          key={c.id}
          onClick={() => pick(c)}
          className="flex items-center gap-3 bg-card border border-white/5 rounded-xl px-4 py-3 text-left hover:border-teal/30 transition"
        >
          <span className="text-2xl">{c.emoji}</span>
          <span className="text-light text-sm font-medium">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
```

**Step 7: Create chat page**

`src/app/chat/page.tsx`:
```tsx
import ChatWindow from '@/components/chat/ChatWindow';

export const metadata = { title: 'Chat — Vision Plan On Demand' };

export default function ChatPage() {
  return <ChatWindow />;
}
```

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: chat UI — window, messages, voice input, agent status, category picker"
```

---

## Task 6: Whisper Transcription API

**Files:**
- Create: `src/app/api/transcribe/route.ts`

**Step 1: Create transcription endpoint**

`src/app/api/transcribe/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as Blob;
    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 });

    const whisperForm = new FormData();
    whisperForm.append('file', audio, 'recording.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'en');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: Whisper transcription API endpoint"
```

---

## Task 7: Deckster Prime — Chat Orchestrator API

**Files:**
- Create: `src/app/api/chat/route.ts`
- Create: `src/lib/agents/prime.ts`
- Create: `src/lib/agents/prompts.ts`

**Step 1: Create agent system prompts**

`src/lib/agents/prompts.ts`:
```ts
export const PRIME_SYSTEM = `You are DECKSTER PRIME, the orchestrator of Vision Plan On Demand.
You help people turn their dreams into professional 90-day action plans.

Your personality: Warm, confident, encouraging. You believe every dream deserves a plan.

FLOW:
1. CLASSIFY: Determine the vision category from the user's message.
2. FOLLOW-UP: Ask 2-3 smart questions to understand scope, budget, timeline, and goals.
3. CONFIRM: Summarize what you'll build, confirm tier, then hand off to the team.

CATEGORIES: business, creative, college, nonprofit, health, realestate, event, finance, tech, anything

RULES:
- Keep responses under 3 sentences unless explaining options.
- Always be encouraging — "That's a great vision" not "That's interesting."
- After 2-3 follow-ups, confirm and move to generation.
- If the user picks Free tier, mention what Standard/Premium adds (but don't push hard).

Respond in JSON format:
{
  "reply": "your message to the user",
  "phase": "greeting|classifying|follow-ups|generating",
  "category": "detected category or null",
  "visionText": "compiled vision summary or null",
  "readyToGenerate": false
}`;

export const SCRIBE_SYSTEM = `You are SCRIBE, the Content Writer for Vision Plan On Demand.
Given a vision description, category, and tier, write compelling slide content.

OUTPUT JSON with slide objects:
{
  "slides": [
    { "title": "Slide Title", "subtitle": "Optional", "bullets": ["point 1", "point 2"], "callToAction": "optional" }
  ]
}

TIER RULES:
- Free: 5 slides (vision summary, phase 1, phase 2, phase 3, next steps)
- Standard: 10 slides (add: team/resources, timeline, milestones, costs, detailed phases)
- Premium: 13+ slides (add: financials, ROI, market analysis, licensing, exit strategy)

Style: Professional but accessible. Bold headlines. Action-oriented bullets. No jargon.`;

export const ARCHITECT_SYSTEM = `You are ARCHITECT, the Plan Structurer for Vision Plan On Demand.
Build a detailed 90-day action plan with phases, milestones, and dependencies.

OUTPUT JSON:
{
  "phases": [
    {
      "name": "Phase 1: Foundation",
      "weeks": "1-4",
      "milestones": ["milestone 1", "milestone 2"],
      "tasks": ["task 1", "task 2"],
      "dependencies": ["what must happen first"]
    }
  ],
  "criticalPath": ["key dependency chain"],
  "risks": ["risk 1 + mitigation"]
}`;

export const LEDGER_SYSTEM = `You are LEDGER, the Financial Analyst for Vision Plan On Demand.
Generate realistic financial projections for the user's vision.

OUTPUT JSON:
{
  "startupCosts": { "items": [{ "name": "item", "low": 0, "high": 0 }], "totalLow": 0, "totalHigh": 0 },
  "monthlyExpenses": { "items": [{ "name": "item", "amount": 0 }], "total": 0 },
  "revenueProjections": { "month3": 0, "month6": 0, "month12": 0 },
  "breakEven": "X months",
  "roi": "X% by month 12",
  "marketSize": { "tam": "", "sam": "", "som": "" }
}

RULES:
- Use realistic numbers based on the industry and location.
- Provide ranges (low/high) for startup costs.
- Only include for Standard tier (basic) and Premium tier (full).
- Free tier: skip financials entirely.`;
```

**Step 2: Create Prime orchestrator**

`src/lib/agents/prime.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk';
import { PRIME_SYSTEM } from './prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface PrimeInput {
  message: string;
  category?: string;
  phase: string;
  visionText?: string;
  followUpAnswers?: string[];
  tier?: string;
}

interface PrimeOutput {
  reply: string;
  phase: string;
  category?: string;
  visionText?: string;
  readyToGenerate: boolean;
}

export async function runPrime(input: PrimeInput): Promise<PrimeOutput> {
  const context = [
    input.category && `Category: ${input.category}`,
    input.visionText && `Vision so far: ${input.visionText}`,
    input.followUpAnswers?.length && `Previous answers: ${input.followUpAnswers.join('; ')}`,
    input.tier && `Selected tier: ${input.tier}`,
    `Current phase: ${input.phase}`,
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    system: PRIME_SYSTEM,
    messages: [
      { role: 'user', content: `${context}\n\nUser message: ${input.message}` },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  // Fallback
  return { reply: text, phase: input.phase, readyToGenerate: false };
}
```

**Step 3: Create chat API route**

`src/app/api/chat/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { runPrime } from '@/lib/agents/prime';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, category, phase, visionText, followUpAnswers, tier } = body;

    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const result = await runPrime({
      message,
      category,
      phase: phase || 'greeting',
      visionText,
      followUpAnswers,
      tier,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, reply: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: Deckster Prime chat orchestrator — Claude API + system prompts"
```

---

## Task 8: Agent Pipeline — SCRIBE + ARCHITECT + LEDGER (Parallel)

**Files:**
- Create: `src/lib/agents/scribe.ts`
- Create: `src/lib/agents/architect.ts`
- Create: `src/lib/agents/ledger.ts`
- Create: `src/lib/agents/pipeline.ts`

**Step 1: Create individual agents (all follow same pattern)**

`src/lib/agents/scribe.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk';
import { SCRIBE_SYSTEM } from './prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runScribe(vision: string, category: string, tier: string) {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    system: SCRIBE_SYSTEM,
    messages: [{ role: 'user', content: `Vision: ${vision}\nCategory: ${category}\nTier: ${tier}` }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
  const match = text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { slides: [] };
}
```

`src/lib/agents/architect.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk';
import { ARCHITECT_SYSTEM } from './prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runArchitect(vision: string, category: string, tier: string) {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    system: ARCHITECT_SYSTEM,
    messages: [{ role: 'user', content: `Vision: ${vision}\nCategory: ${category}\nTier: ${tier}` }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
  const match = text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { phases: [] };
}
```

`src/lib/agents/ledger.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk';
import { LEDGER_SYSTEM } from './prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function runLedger(vision: string, category: string, tier: string) {
  if (tier === 'free') return null; // No financials on free tier
  const res = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    system: LEDGER_SYSTEM,
    messages: [{ role: 'user', content: `Vision: ${vision}\nCategory: ${category}\nTier: ${tier}` }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '{}';
  const match = text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
}
```

**Step 2: Create pipeline orchestrator**

`src/lib/agents/pipeline.ts`:
```ts
import { runScribe } from './scribe';
import { runArchitect } from './architect';
import { runLedger } from './ledger';

export interface PipelineResult {
  slides: any;
  plan: any;
  financials: any;
}

export async function runPipeline(vision: string, category: string, tier: string): Promise<PipelineResult> {
  // Run SCRIBE, ARCHITECT, LEDGER in parallel
  const [slides, plan, financials] = await Promise.all([
    runScribe(vision, category, tier),
    runArchitect(vision, category, tier),
    runLedger(vision, category, tier),
  ]);

  return { slides, plan, financials };
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: SCRIBE + ARCHITECT + LEDGER agents with parallel pipeline"
```

---

## Task 9: CANVAS — HTML Deck Generator

**Files:**
- Create: `src/lib/agents/canvas.ts`
- Create: `src/lib/deck-templates/base.ts`

**Step 1: Create deck HTML template engine**

`src/lib/deck-templates/base.ts`:
```ts
import type { PipelineResult } from '../agents/pipeline';

// Uses the same design language as the pitch deck — dark luxury, teal/gold accents
export function buildDeckHTML(
  title: string,
  category: string,
  tier: string,
  pipeline: PipelineResult,
): string {
  const { slides, plan, financials } = pipeline;
  const slideHTML = slides.slides?.map((s: any, i: number) => buildSlide(s, i + 1, tier)).join('\n') || '';
  const planHTML = plan.phases?.length ? buildPlanSlides(plan, slides.slides?.length || 0, tier) : '';
  const financialHTML = financials && tier !== 'free' ? buildFinancialSlides(financials, (slides.slides?.length || 0) + (plan.phases?.length || 0), tier) : '';
  const totalSlides = countSlides(slideHTML + planHTML + financialHTML);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1536, initial-scale=1">
<title>${title} — Vision Plan</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --dark: #06080d; --card: #0e1117; --teal: #00e5c7; --gold: #f0c040; --white: #fff; --gray: #7a8494; --light: #c0c8d8; }
  html, body { background: var(--dark); color: var(--white); font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .slide { width: 1536px; height: 864px; position: relative; overflow: hidden; page-break-after: always; background: var(--dark); padding: 60px 80px; }
  .slide:last-child { page-break-after: avoid; }
  .slide-title { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 900; margin-bottom: 8px; }
  .slide-subtitle { font-size: 18px; color: var(--gray); margin-bottom: 32px; }
  .accent { color: var(--teal); }
  .card { background: var(--card); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 28px; }
  .bullet { padding: 6px 0; font-size: 16px; color: var(--light); line-height: 1.6; }
  .bullet::before { content: "→ "; color: var(--teal); font-weight: 700; }
  .footer { position: absolute; bottom: 24px; left: 80px; right: 80px; display: flex; justify-content: space-between; font-size: 12px; color: var(--gray); }
  @media print { .slide { page-break-inside: avoid; } }
</style>
</head>
<body>
${buildCoverSlide(title, category)}
${slideHTML}
${planHTML}
${financialHTML}
${buildClosingSlide(title)}
</body>
</html>`;
}

function buildCoverSlide(title: string, category: string): string {
  return `<div class="slide" style="display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 30% 50%, #0a1a2e 0%, #06080d 70%);">
  <div>
    <div style="font-size:14px;color:var(--teal);letter-spacing:4px;text-transform:uppercase;margin-bottom:24px;">Vision Plan On Demand</div>
    <div style="font-family:'Playfair Display',serif;font-size:64px;font-weight:900;color:var(--white);line-height:1.1;margin-bottom:16px;">${title}</div>
    <div style="width:60px;height:3px;background:var(--teal);margin:24px auto;"></div>
    <div style="font-size:18px;color:var(--gray);">90-Day Action Plan · ${category}</div>
  </div>
</div>`;
}

function buildSlide(slide: any, num: number, tier: string): string {
  const bullets = (slide.bullets || []).map((b: string) => `<div class="bullet">${b}</div>`).join('\n');
  return `<div class="slide">
  <div class="slide-title">${slide.title} <span class="accent">${slide.subtitle || ''}</span></div>
  <div class="slide-subtitle">${slide.subtitle || ''}</div>
  <div class="card">${bullets}</div>
  ${slide.callToAction ? `<div style="margin-top:24px;padding:16px 24px;background:rgba(0,229,199,0.1);border:1px solid rgba(0,229,199,0.2);border-radius:12px;font-size:16px;color:var(--teal);font-weight:600;">${slide.callToAction}</div>` : ''}
  <div class="footer"><span>Vision Plan On Demand</span><span>${num}</span></div>
</div>`;
}

function buildPlanSlides(plan: any, offset: number, tier: string): string {
  return (plan.phases || []).map((phase: any, i: number) => {
    const tasks = (phase.tasks || []).map((t: string) => `<div class="bullet">${t}</div>`).join('\n');
    const milestones = (phase.milestones || []).map((m: string) => `<div class="bullet" style="color:var(--teal);">${m}</div>`).join('\n');
    return `<div class="slide">
  <div class="slide-title">${phase.name}</div>
  <div class="slide-subtitle">Weeks ${phase.weeks}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
    <div class="card"><h3 style="color:var(--teal);font-size:14px;letter-spacing:2px;margin-bottom:12px;">TASKS</h3>${tasks}</div>
    <div class="card"><h3 style="color:var(--gold);font-size:14px;letter-spacing:2px;margin-bottom:12px;">MILESTONES</h3>${milestones}</div>
  </div>
  <div class="footer"><span>Vision Plan On Demand</span><span>${offset + i + 1}</span></div>
</div>`;
  }).join('\n');
}

function buildFinancialSlides(financials: any, offset: number, tier: string): string {
  // Build financial slides from LEDGER output
  const costRows = (financials.startupCosts?.items || []).map((item: any) =>
    `<tr><td style="padding:8px 0;color:var(--light);">${item.name}</td><td style="text-align:right;color:var(--teal);">$${item.low?.toLocaleString()} – $${item.high?.toLocaleString()}</td></tr>`
  ).join('');

  return `<div class="slide">
  <div class="slide-title">Startup <span class="accent">Costs</span></div>
  <div class="slide-subtitle">Investment required to launch</div>
  <div class="card"><table style="width:100%;border-collapse:collapse;">${costRows}
    <tr style="border-top:2px solid var(--teal);"><td style="padding:12px 0;color:var(--teal);font-weight:700;">Total</td><td style="text-align:right;color:var(--teal);font-weight:700;font-size:20px;">$${financials.startupCosts?.totalLow?.toLocaleString()} – $${financials.startupCosts?.totalHigh?.toLocaleString()}</td></tr>
  </table></div>
  <div class="footer"><span>Vision Plan On Demand</span><span>${offset + 1}</span></div>
</div>
<div class="slide">
  <div class="slide-title">Revenue <span class="accent">Projections</span></div>
  <div class="slide-subtitle">Conservative estimates based on market data</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;">
    <div class="card" style="text-align:center;"><div style="font-size:14px;color:var(--gray);margin-bottom:8px;">MONTH 3</div><div style="font-size:36px;font-weight:900;color:var(--teal);">$${financials.revenueProjections?.month3?.toLocaleString()}</div></div>
    <div class="card" style="text-align:center;"><div style="font-size:14px;color:var(--gray);margin-bottom:8px;">MONTH 6</div><div style="font-size:36px;font-weight:900;color:var(--teal);">$${financials.revenueProjections?.month6?.toLocaleString()}</div></div>
    <div class="card" style="text-align:center;"><div style="font-size:14px;color:var(--gray);margin-bottom:8px;">MONTH 12</div><div style="font-size:36px;font-weight:900;color:var(--gold);">$${financials.revenueProjections?.month12?.toLocaleString()}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;">
    <div class="card"><div style="color:var(--gray);font-size:14px;margin-bottom:4px;">BREAK EVEN</div><div style="font-size:24px;font-weight:700;">${financials.breakEven}</div></div>
    <div class="card"><div style="color:var(--gray);font-size:14px;margin-bottom:4px;">ROI</div><div style="font-size:24px;font-weight:700;color:var(--teal);">${financials.roi}</div></div>
  </div>
  <div class="footer"><span>Vision Plan On Demand</span><span>${offset + 2}</span></div>
</div>`;
}

function buildClosingSlide(title: string): string {
  return `<div class="slide" style="display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 30% 50%, #0a1a2e 0%, #06080d 70%);">
  <div>
    <div style="font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--white);line-height:1.1;margin-bottom:24px;">Your Plan<br>Starts <span style="color:var(--teal);">Now</span></div>
    <div style="width:60px;height:3px;background:var(--teal);margin:24px auto;"></div>
    <div style="font-size:16px;color:var(--gray);max-width:500px;margin:0 auto;">Built by The Deckster 6 — Vision Plan On Demand</div>
    <div style="font-size:12px;color:var(--gray);margin-top:16px;letter-spacing:3px;">VISIONPLANONDEMAND.COM</div>
  </div>
</div>`;
}

function countSlides(html: string): number {
  return (html.match(/class="slide"/g) || []).length;
}
```

**Step 2: Create CANVAS agent (assembles deck)**

`src/lib/agents/canvas.ts`:
```ts
import { buildDeckHTML } from '../deck-templates/base';
import type { PipelineResult } from './pipeline';

export function runCanvas(title: string, category: string, tier: string, pipeline: PipelineResult): string {
  return buildDeckHTML(title, category, tier, pipeline);
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: CANVAS agent — HTML deck template engine with dark luxury design"
```

---

## Task 10: PRESS — PDF Rendering + R2 Upload

**Files:**
- Create: `src/lib/agents/press.ts`
- Create: `src/lib/storage.ts`

**Step 1: Create R2 storage utility**

`src/lib/storage.ts`:
```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadPDF(key: string, buffer: Buffer): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  }));
  return key;
}

export async function getSignedPDFUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  }), { expiresIn: 86400 }); // 24 hours
}
```

**Step 2: Create PRESS agent (PDF rendering)**

`src/lib/agents/press.ts`:
```ts
import puppeteer from 'puppeteer-core';
import { uploadPDF, getSignedPDFUrl } from '../storage';
import { v4 as uuid } from 'uuid';

export async function runPress(html: string, sessionId: string): Promise<{ pdfKey: string; pdfUrl: string }> {
  // Write HTML to temp file
  const fs = await import('fs/promises');
  const path = await import('path');
  const tmpDir = '/tmp';
  const htmlPath = path.join(tmpDir, `vpod-${sessionId}.html`);
  await fs.writeFile(htmlPath, html, 'utf-8');

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1536, height: 864 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 2000)); // settle

    const pdfBuffer = await page.pdf({
      width: '16in',
      height: '9in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    // Upload to R2
    const pdfKey = `decks/${sessionId}/${uuid()}.pdf`;
    await uploadPDF(pdfKey, Buffer.from(pdfBuffer));
    const pdfUrl = await getSignedPDFUrl(pdfKey);

    // Cleanup
    await fs.unlink(htmlPath).catch(() => {});

    return { pdfKey, pdfUrl };
  } finally {
    await browser.close();
  }
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: PRESS agent — Puppeteer PDF rendering + R2 upload"
```

---

## Task 11: Generate Deck API — Full Pipeline

**Files:**
- Create: `src/app/api/generate/route.ts`

**Step 1: Create generation endpoint (ties all agents together)**

`src/app/api/generate/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/agents/pipeline';
import { runCanvas } from '@/lib/agents/canvas';
import { runPress } from '@/lib/agents/press';

export const maxDuration = 120; // 2 min max for Vercel

export async function POST(req: NextRequest) {
  try {
    const { sessionId, vision, category, tier, title } = await req.json();
    if (!vision || !sessionId) {
      return NextResponse.json({ error: 'Missing vision or sessionId' }, { status: 400 });
    }

    const deckTitle = title || 'My Vision Plan';
    const deckCategory = category || 'anything';
    const deckTier = tier || 'free';

    // Phase 1: Run SCRIBE + ARCHITECT + LEDGER in parallel
    const pipeline = await runPipeline(vision, deckCategory, deckTier);

    // Phase 2: CANVAS assembles HTML
    const html = runCanvas(deckTitle, deckCategory, deckTier, pipeline);

    // Phase 3: PRESS renders PDF + uploads to R2
    const { pdfKey, pdfUrl } = await runPress(html, sessionId);

    return NextResponse.json({
      success: true,
      pdfUrl,
      pdfKey,
      slideCount: (pipeline.slides?.slides?.length || 0) + (pipeline.plan?.phases?.length || 0) + (pipeline.financials ? 2 : 0) + 2,
      tier: deckTier,
    });
  } catch (e: any) {
    console.error('Generate error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: /api/generate — full agent pipeline (SCRIBE+ARCHITECT+LEDGER → CANVAS → PRESS)"
```

---

## Task 12: Stripe Checkout — 3 Tiers

**Files:**
- Create: `src/app/api/checkout/route.ts`
- Create: `src/app/api/stripe/webhook/route.ts`
- Create: `src/app/checkout/success/page.tsx`

**Step 1: Create checkout endpoint**

`src/app/api/checkout/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { tier, sessionId, email } = await req.json();

  const priceId = tier === 'premium' ? process.env.STRIPE_PRICE_PREMIUM : process.env.STRIPE_PRICE_STANDARD;
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&vpod_session=${sessionId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
    customer_email: email || undefined,
    metadata: { vpod_session: sessionId, tier },
  });

  return NextResponse.json({ url: session.url });
}
```

**Step 2: Create webhook**

`src/app/api/stripe/webhook/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const vpodSession = session.metadata?.vpod_session;
    const tier = session.metadata?.tier;
    // Payment confirmed — session is now authorized for paid tier generation
    // In production: store in database. For MVP: validated via session_id on success page.
    console.log(`Payment confirmed: session=${vpodSession}, tier=${tier}, amount=${session.amount_total}`);
  }

  return NextResponse.json({ received: true });
}
```

**Step 3: Create success page**

`src/app/checkout/success/page.tsx`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const timer = setTimeout(() => {
      const vpodSession = params.get('vpod_session');
      router.push(vpodSession ? `/chat?session=${vpodSession}&paid=true` : '/chat');
    }, 3000);
    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`text-center transition-all duration-500 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal to-teal2 rounded-full flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h1 className="font-display text-3xl font-black text-white mb-3">Payment Confirmed</h1>
        <p className="text-gray mb-6">Taking you back to build your deck...</p>
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: Stripe checkout — 3 tiers, webhook, success redirect"
```

---

## Task 13: Email Delivery (Resend)

**Files:**
- Create: `src/lib/email.ts`

**Step 1: Create email utility**

`src/lib/email.ts`:
```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeckEmail(to: string, title: string, pdfUrl: string, tier: string) {
  await resend.emails.send({
    from: 'Vision Plan On Demand <plans@visionplanondemand.com>',
    to,
    subject: `Your Vision Plan is Ready: ${title}`,
    html: `
      <div style="background:#06080d;color:#fff;padding:40px;font-family:Inter,sans-serif;">
        <div style="max-width:500px;margin:0 auto;text-align:center;">
          <h1 style="font-size:28px;margin-bottom:8px;">Your Plan is Ready</h1>
          <p style="color:#7a8494;margin-bottom:32px;">${title} — ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</p>
          <a href="${pdfUrl}" style="display:inline-block;background:#00e5c7;color:#06080d;font-weight:800;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">Download Your Deck</a>
          <p style="color:#7a8494;font-size:12px;margin-top:32px;">This link expires in 24 hours. Open it from your chat anytime.</p>
          <hr style="border-color:rgba(255,255,255,0.05);margin:32px 0;" />
          <p style="color:#7a8494;font-size:11px;">Vision Plan On Demand — Every dream deserves a plan.<br/>A product of IDMG · Supporting the Mike Page Foundation 501(c)(3)</p>
        </div>
      </div>
    `,
  });
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: Resend email delivery for completed decks"
```

---

## Task 14: Shareable Deck Links (Premium)

**Files:**
- Create: `src/app/deck/[id]/page.tsx`
- Create: `src/app/api/deck/[id]/route.ts`

**Step 1: Create deck viewer API (serves stored HTML)**

`src/app/api/deck/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await s3.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `decks/${id}/deck.html`,
    }));
    const html = await res.Body?.transformToString();
    if (!html) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }
}
```

**Step 2: Create beautiful deck viewer page**

`src/app/deck/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deck/${id}`, { cache: 'no-store' });
  if (!res.ok) notFound();
  const html = await res.text();

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-[1536px] mx-auto">
        <iframe srcDoc={html} className="w-full h-screen border-0" title="Vision Plan Deck" />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: shareable deck links for Premium tier — /deck/[id]"
```

---

## Task 15: Wire Chat → Generate → Deliver Flow

**Files:**
- Modify: `src/components/chat/ChatWindow.tsx`
- Modify: `src/app/api/chat/route.ts`
- Create: `src/components/chat/DeckDelivery.tsx`

**Step 1: Create DeckDelivery component**

`src/components/chat/DeckDelivery.tsx`:
```tsx
'use client';
import { useChatStore } from '@/store/chatStore';

export default function DeckDelivery() {
  const { session } = useChatStore();
  if (!session.deck?.pdfUrl) return null;

  return (
    <div className="bg-gradient-to-b from-teal/10 to-teal/5 border border-teal/20 rounded-2xl p-6 mx-4 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06080d" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <div>
          <div className="text-white font-bold">Your deck is ready!</div>
          <div className="text-teal text-sm">{session.deck.slideCount} slides · {session.deck.tier} plan</div>
        </div>
      </div>
      <div className="flex gap-3">
        <a
          href={session.deck.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-teal text-dark font-bold py-3 rounded-xl text-center hover:bg-teal2 transition"
        >
          Download PDF
        </a>
        {session.deck.tier === 'premium' && session.deck.htmlUrl && (
          <a
            href={session.deck.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-card border border-white/10 text-white font-bold py-3 rounded-xl text-center hover:bg-white/5 transition"
          >
            Share Pitch Link
          </a>
        )}
      </div>
      {session.deck.tier === 'free' && (
        <div className="mt-4 bg-card rounded-xl p-4 border border-gold/20">
          <p className="text-light text-sm">Want financials, revenue projections, and a shareable pitch link?</p>
          <button className="mt-2 text-gold font-bold text-sm hover:underline">Upgrade to Standard ($49) →</button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Update ChatWindow to show delivery + trigger generation**

Add DeckDelivery import and render it when `session.phase === 'delivered'` (after messages, before input). Add generation trigger when phase becomes 'generating':

Wire the `/api/generate` call from the chat component when `readyToGenerate` comes back true from Prime. Update agent statuses in real-time as pipeline progresses.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: wire full flow — chat → generate → deliver with DeckDelivery component"
```

---

## Task 16: Vercel Deploy + Domain

**Step 1: Initialize Vercel project**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/vpod
vercel link
```

**Step 2: Add environment variables to Vercel**

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add OPENAI_API_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_PRICE_STANDARD production
vercel env add STRIPE_PRICE_PREMIUM production
vercel env add R2_ACCOUNT_ID production
vercel env add R2_ACCESS_KEY_ID production
vercel env add R2_SECRET_ACCESS_KEY production
vercel env add R2_BUCKET_NAME production
vercel env add RESEND_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

**Step 3: Deploy**

```bash
vercel --prod
```

**Step 4: Add domain**

```bash
vercel domains add visionplanondemand.com
```

**Step 5: Verify**

```bash
for p in / /chat; do echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://visionplanondemand.com$p)"; done
```

---

## Task Summary

| Task | Description | Deps |
|------|-------------|------|
| 1 | Scaffold Next.js 15 + deps + design tokens | — |
| 2 | PWA (manifest, SW, install hook) | 1 |
| 3 | Zustand store (session, chat, agents) | 1 |
| 4 | Landing page (7 sections) | 1, 3 |
| 5 | Chat UI (window, input, voice, agents, categories) | 3 |
| 6 | Whisper transcription API | 1 |
| 7 | Deckster Prime (Claude chat orchestrator) | 3 |
| 8 | Agent pipeline (SCRIBE + ARCHITECT + LEDGER) | 7 |
| 9 | CANVAS (HTML deck template engine) | 8 |
| 10 | PRESS (PDF rendering + R2 upload) | 9 |
| 11 | Generate API (ties all agents) | 8, 9, 10 |
| 12 | Stripe checkout (3 tiers) | 1 |
| 13 | Resend email delivery | 10 |
| 14 | Shareable deck links | 10 |
| 15 | Wire chat → generate → deliver | 5, 11, 12 |
| 16 | Deploy to Vercel + domain | all |
