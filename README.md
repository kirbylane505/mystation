# MyStation

**A Mike Page Foundation Initiative**

Free music streaming platform where fans can listen to Mike Page's entire catalog and donate directly to the Mike Page Foundation (501c3).

## Features

- **Free Music Streaming** - Full catalog, no ads, ever
- **Donation System** - Pay what you want, 100% to Foundation
- **Live Streaming** - Real-time performances with live donations
- **Foundation Integration** - All donations are tax-deductible

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Payments:** Stripe
- **Icons:** Lucide React

## Quick Start

```bash
# Navigate to the app directory
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Stripe keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
mystation/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.jsx          # Root layout
│   │   ├── page.jsx            # Home page
│   │   ├── music/page.jsx      # Music browse page
│   │   ├── live/page.jsx       # Live streaming page
│   │   ├── about/page.jsx      # Foundation page
│   │   └── api/
│   │       └── donate/route.js # Stripe donation API
│   ├── components/
│   │   ├── Player.jsx          # Audio player
│   │   ├── TrackList.jsx       # Track listing
│   │   ├── DonationButton.jsx  # Donation modal
│   │   ├── Hero.jsx            # Hero section
│   │   └── Navbar.jsx          # Navigation
│   ├── store/
│   │   └── playerStore.js      # Zustand state management
│   ├── data/
│   │   └── tracks.js           # Track catalog (50+ songs)
│   └── styles/
│       └── globals.css         # Global styles
├── docs/
│   └── MYSTATION_BLUEPRINT.md  # Full architecture doc
├── package.json
├── tailwind.config.js
├── next.config.js
└── .env.example
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Dashboard
3. Add keys to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Set up webhook for production:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Track Catalog

The app includes Mike Page's full catalog:
- **Cindy's Son** (2022) - 20 tracks
- **iDMG Coke Wave Beats** (2026) - 13 instrumentals
- **Singles** (2020-2025) - 17 tracks
- **Vault/Exclusives** - 2+ tracks

Total: 50+ tracks ready for launch

## Foundation Info

Mike Page Foundation (501c3)
- Youth Music Programs
- Scholarships
- Love on the Lawn Festival
- Community Sponsorships

100% of net donations go to these programs.

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t mystation .
docker run -p 3000:3000 mystation
```

## Coming Soon

- [ ] Audio file integration (AWS S3)
- [ ] User authentication
- [ ] Offline downloads for supporters
- [ ] Mobile apps (React Native)
- [ ] Live streaming integration (Agora/Mux)

---

*MyStation - A Mike Page Foundation Initiative*
*"Music for the people, by the people, giving back to the people."*
