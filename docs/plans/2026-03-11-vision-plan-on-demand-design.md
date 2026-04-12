# Vision Plan On Demand — Design Document

**Date:** March 11, 2026
**Status:** Approved
**Tagline:** "Every dream deserves a plan."

---

## Overview

Vision Plan On Demand is a standalone web service where anyone — entrepreneurs, creators, students, parents, dreamers — uploads a text description or voice memo of their vision, and receives a professional, visually stunning 90-day action plan deck in 90 minutes or less.

**Domain:** visionplanondemand.com
**Revenue Model:** Tiered (Free / $49 Standard / $149 Premium)

---

## The Deckster 6 — Agent Team

| Agent | Role | Responsibility |
|-------|------|----------------|
| DECKSTER PRIME | Orchestrator | Classifies vision, dispatches team, manages chat flow |
| SCRIBE | Content Writer | Headlines, bullets, descriptions, CTAs for every slide |
| ARCHITECT | Plan Structurer | 90-day plan: milestones, phases, dependencies, timeline |
| LEDGER | Financial Analyst | Startup costs, revenue projections, ROI, break-even, market sizing |
| CANVAS | Visual Designer | HTML/CSS deck layout, industry-specific color themes |
| PRESS | Publisher/QC | PDF rendering, overflow checks, quality verification, delivery |

---

## Pipeline

```
User opens chat → picks category or just starts talking
        ↓
[Whisper API] → transcription (if voice input)
        ↓
[DECKSTER PRIME] → classifies vision category + asks 2-3 follow-ups
        ↓
Dispatches 3 agents IN PARALLEL:
├── [SCRIBE] → slide content
├── [ARCHITECT] → 90-day plan structure
└── [LEDGER] → financials & projections
        ↓
[CANVAS] → assembles HTML deck from all 3 outputs
        ↓
[PRESS] → renders PDF via Deckster engine, QC check
        ↓
Delivered in chat + email. 90 minutes or less.
```

---

## Vision Categories

- Business Startup (restaurant, clinic, barber shop, tech)
- Creative Project (album, film, fashion line, art)
- College Plan (4-year path, scholarships, career goals)
- Nonprofit (foundation launch, fundraising)
- Health & Wellness ("Get back in shape — heal yourself in 90 days", nutrition, fitness transformation)
- Real Estate (flip, development, rental portfolio)
- Event Planning (festival, wedding, conference)
- Financial Freedom (debt payoff, savings plan, investment roadmap)
- Tech Startup (app, SaaS, platform)
- Anything ("I have a dream and I need a plan")

---

## Pricing Tiers

| Tier | Price | Deliverable |
|------|-------|-------------|
| Free | $0 | 5-slide basic outline: vision summary, 3 phases, next steps. No financials. |
| Standard | $49 | 10-slide deck: full 90-day plan, team structure, timeline, basic costs |
| Premium | $149 | 13+ slide deck: financials, revenue projections, ROI, market analysis, licensing, exit strategy |

---

## Core UX — Chat-First

No forms. Users interact through a live chatbot (Deckster Prime):
- Text input or voice (mic button → Whisper transcription)
- Quick-start category buttons
- 2-3 smart follow-up questions
- Real-time progress: "SCRIBE is writing... LEDGER is crunching numbers..."
- Deck delivered as download button in chat
- Upsell prompt for Premium after Free/Standard delivery

### "Fix It" — Live Revisions
After delivery, user can request changes in chat:
- "Change the budget to $300K"
- "Add a marketing section"
- Deckster regenerates affected slides only

### Pitch Link
Premium decks get a shareable web URL: `visionplanondemand.com/deck/abc123`
Beautiful web version for texting to investors, banks, partners.

### 30-Day Check-In
Automated email at Day 30: "How's your plan going? Want to update your deck?"
Brings users back, drives revisions revenue.

---

## Tech Stack

- **Frontend:** Next.js 15 (Vercel)
- **Chatbot Engine:** Claude API (powers all 6 agents)
- **Transcription:** Whisper API (OpenAI)
- **Deck Rendering:** Deckster engine (Puppeteer → Chrome headless → PDF)
- **Payments:** Stripe Checkout (3 tiers)
- **Storage:** Cloudflare R2 (PDF storage + delivery)
- **Email:** Resend (delivery + 30-day check-in)
- **Domain:** visionplanondemand.com
- **Auth:** Email-based (no complex auth needed)

---

## Design Language

- Dark luxury aesthetic (black/charcoal base)
- Electric teal/cyan primary accent
- Gold secondary accent
- Playfair Display headers + Inter body
- Cinematic hero with particle/gradient animation
- Floating chatbot (bottom-right, always visible)
- Responsive: mobile-first (voice input is phone-native)

### Site Sections
1. Hero — "Every dream deserves a plan" + chatbot CTA
2. How It Works — 3 steps (Talk → Build → Deliver)
3. Sample Decks — gallery of 6-8 categories
4. Pricing — 3 tiers
5. Testimonials/Social Proof
6. FAQ
7. Footer

---

## Competitive Advantage

No existing product combines:
- Voice-first input
- Live chatbot UX (not forms)
- Universal categories (not just business plans)
- 6-agent team with visible progress
- Luxury visual deck output (not PowerPoint)
- Full financial projections
- Chat-based revisions
- Shareable pitch links

**We are one of one.**

---

## Success Metrics

- Time to first deck: ≤ 90 minutes
- Free → Paid conversion: target 15%+
- Customer satisfaction: deck quality rating
- Repeat usage: revision requests + 30-day returns
- Revenue: $10K MRR within 90 days of launch
