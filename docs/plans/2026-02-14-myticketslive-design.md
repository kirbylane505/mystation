# MyTicketsLive — Built Into MyStation
## Design Document | February 14, 2026

---

## Vision

Build a full-service ticketing platform directly into mystationlive.com. One platform for music streaming, merch, AND ticket sales — owned entirely by IDMG. No Universe fees. No Stripe branding. Every customer email captured in our database. Used by all Mike Page Empire companies: LOTL, IDMG, Mike Page Foundation, MyStation.

## Problem

- Universe charges $1.99 + 2.5% + 2.9% + $0.30 per ticket (~12% total)
- Buyer email data locked in Universe's dashboard
- No cross-sell between tickets, merch, and music
- Paying $28/mo for Render services that duplicate what Vercel already provides
- Can't email past buyers specials/discounts without exporting from Universe

## Solution

Add ticketing as a first-class feature of mystationlive.com alongside music and merch.

## Revenue Model

- Platform fee: 3% + $1.50 per ticket (goes to IDMG)
- Payment processing: 2.9% + $0.30 (Stripe, unavoidable)
- On $50 ticket: customer pays $53.00, IDMG nets $51.16 after Stripe
- On 10,000 tickets at $50 avg: **$511,600 net to IDMG**

## Architecture

### New Routes

```
/events                    — Event listings (all orgs)
/events/[slug]             — Event detail + ticket purchase
/events/[slug]/checkout    — Stripe Checkout session
/tickets                   — My Tickets (QR codes, history)
/admin/events              — Create/edit events
/admin/events/[id]/orders  — Order management
/admin/check-in            — QR scanner for gate staff
/admin/email-campaigns     — Email blast to ticket buyers
```

### New API Routes

```
/api/events                — GET list, POST create
/api/events/[id]           — GET detail, PUT update, DELETE
/api/tickets/purchase      — POST: create Stripe Checkout session
/api/tickets/webhook       — Stripe webhook: create tickets on payment
/api/tickets/verify        — POST: verify QR code at gate (mark used)
/api/tickets/transfer      — POST: transfer ticket to another email
/api/tickets/my            — GET: user's tickets
/api/email/campaign        — POST: send email blast to segment
```

### Database Schema (Supabase/Vercel Postgres)

```sql
-- Events (multi-org)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization TEXT NOT NULL,  -- 'lotl', 'idmg', 'foundation', 'mystation'
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  venue TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket Types (phase pricing: early bird, regular, late, VIP)
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- 'Early Bird GA', 'VIP', 'VIP Tent Package'
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  sale_starts TIMESTAMPTZ,
  sale_ends TIMESTAMPTZ,
  phase TEXT,                   -- 'early_bird', 'regular', 'late', 'door'
  is_active BOOLEAN DEFAULT true,
  perks JSONB,                  -- ["VIP parking", "Exclusive bathroom", "Bar server"]
  badge TEXT,                   -- 'Best Deal', 'Limited', 'Sold Out'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tickets (individual issued tickets)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID REFERENCES ticket_types(id),
  event_id UUID REFERENCES events(id),
  order_id TEXT NOT NULL,       -- Stripe session ID
  qr_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid','used','transferred','refunded','cancelled')),
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ,
  transferred_to_email TEXT,
  transferred_at TIMESTAMPTZ,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Access Codes (discount codes, VIP unlock codes, sponsor codes)
CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed', 'unlock')),
  discount_value DECIMAL(10,2),  -- percent off or dollar amount
  unlocks_ticket_type_id UUID REFERENCES ticket_types(id),  -- for 'unlock' type
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email contacts (master list from all sources)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT,                  -- 'ticket_purchase', 'universe_import', 'merch', 'subscription', 'manual'
  first_purchase_date TIMESTAMPTZ,
  total_spent DECIMAL(10,2) DEFAULT 0,
  ticket_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',      -- ["lotl_2024", "vip", "repeat_buyer", "merch_customer"]
  unsubscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Key Features

**1. Event Pages (/events/[slug])**
- Full-width cover image
- Event details: date, venue, description, lineup
- Ticket tier cards with phase pricing and urgency badges
- Quantity selector per tier
- Access code / discount code input
- "GET TICKETS" CTA → Stripe Checkout
- Organization branding (LOTL, IDMG, Foundation)
- Share buttons (copy link, social)
- Related merch cross-sell section

**2. Checkout Flow (Stripe)**
- Stripe Checkout hosted page (PCI compliant, no card handling)
- Line items: ticket type x quantity + platform fee
- Success → ticket confirmation page + email with QR code
- Webhook creates ticket records in DB
- Customer branded as "IDMG Checkout" via Stripe branding settings

**3. My Tickets (/tickets)**
- List of all purchased tickets with QR codes
- Ticket details: event, tier, date, venue, status
- Transfer ticket (enter recipient email)
- Add to Apple/Google Wallet
- Download QR as image

**4. QR Check-In (/admin/check-in)**
- Camera-based QR scanner (no app install needed)
- Scan → verify → show ticket details → mark as used
- Visual: green flash for valid, red for already used/invalid
- Attendee search by name/email fallback
- Re-entry toggle (allow multiple scans)
- Real-time check-in count

**5. Admin Dashboard (/admin/events)**
- Create/edit events with rich text description
- Manage ticket types (add phases, set quantities, adjust pricing)
- View orders and attendee list
- Export CSV of all buyers (names, emails, tiers, amounts)
- Revenue dashboard: total sales, by tier, by day
- Check-in progress: X/Y scanned

**6. Email Marketing (/admin/email-campaigns)**
- Contact list with segments: by event, by tier, by source
- Campaign builder: subject, body, segment
- Templates: early bird announcement, lineup reveal, last chance, merch bundle
- Send via Resend API (3K free/mo)
- Unsubscribe handling (CAN-SPAM compliant)
- Import CSV (for Universe data migration)

**7. Access Codes**
- Discount codes: percent off or fixed amount
- Unlock codes: reveal hidden VIP ticket types
- Sponsor codes: free or discounted tickets for partners
- Usage limits and expiration dates
- Track which code drove which sales

### Integration Points

- **Stripe:** Checkout Sessions, Webhooks, Payment Intents
- **Resend:** Transactional emails (confirmations) + marketing campaigns
- **Existing MyStation:** merch cross-sell, music discovery, user accounts
- **lotlfest.com:** Embeddable ticket widget (iframe or link to /events/lotl-2026)

### Migration Plan

1. Build the ticketing module into MyStation
2. Export Universe buyer data (2024 + 2025 CSVs)
3. Import into contacts table with source='universe_import'
4. Create LOTL 2026 event on MyStation
5. Point lotlfest.com "Buy Tickets" to mystationlive.com/events/lotl-2026
6. Cancel Render services ($28/mo saved)
7. Email all past buyers: "Get your LOTL 2026 tickets — early bird pricing"

### Cost Analysis

| Item | Current (Universe) | New (MyStation) |
|------|-------------------|-----------------|
| Platform fee per ticket | $1.99 + 2.5% | $0 (yours) |
| Payment processing | 2.9% + $0.30 | 2.9% + $0.30 (Stripe) |
| Hosting | $28/mo (Render) | $0 (Vercel free tier) |
| Email | Not included | $0 (Resend free 3K/mo) |
| On $35 ticket | You keep $30.81 | You keep $33.49 |
| On 10K tickets | You keep $308,100 | You keep $334,900 |
| **Annual savings** | — | **$26,800 + $336 hosting** |

### Timeline

- Phase 1: Database + API routes + event pages (2-3 days)
- Phase 2: Stripe checkout + ticket generation + QR codes (1-2 days)
- Phase 3: Admin dashboard + check-in scanner (1-2 days)
- Phase 4: Email marketing + Universe data import (1 day)
- Phase 5: Deploy + test + go live

### Hybrid Payment System (Zelle + CashApp + Stripe)

**STATUS: APPROVED — BUILD ON USER'S COMMAND**

Three payment options at checkout:
1. **Credit Card (Stripe)** — 2.9% + $0.30, instant ticket
2. **Zelle** — $0 fees, manual admin verification, ticket after approval
3. **CashApp** — $0 fees, manual admin verification, ticket after approval

Flow for Zelle/CashApp:
- Customer selects payment method → sees IDMG Zelle email or CashApp $tag
- Unique reference code per order (e.g., LOTL-7X4K)
- Customer sends payment, clicks "I Sent It" → order goes PENDING
- Admin verifies in bank/CashApp → clicks APPROVE in dashboard
- Ticket + QR code auto-generated and emailed to buyer
- 24-hour expiration on unverified orders (auto-cancel)

Revenue impact on 10K tickets at $50 avg:
- All Stripe: $511,600 net (lose $18,400 to processing)
- All Zelle/CashApp: $530,000 net ($0 processing)
- 50/50 split: $520,800 net

Requirements:
- IDMG business Zelle (through business bank account)
- CashApp Business account ($MYSTATIONLIVE or similar)
- Admin dashboard pending orders view with approve/deny

### Success Criteria

- LOTL 2026 tickets sold through mystationlive.com
- All buyer emails captured in contacts table
- QR check-in working at the gate
- Email campaigns sent to 10K+ past buyers
- $0 Universe fees on 2026 ticket sales
- $28/mo Render bill eliminated
