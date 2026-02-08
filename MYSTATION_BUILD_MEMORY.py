#!/usr/bin/env python3
"""
MYSTATION BUILD MEMORY
======================
Complete system-of-record for MyStation app.
Run this file to print the full build state.
Import MYSTATION_STATE to use in other scripts.

Last Updated: Feb 7, 2026
"""

MYSTATION_STATE = {

    # ===== IDENTITY =====
    "name": "MyStation",
    "tagline": "Your music. Your station. Your way.",
    "url": "https://mystation.vercel.app",
    "domain": "mystationlive.com",
    "repo": "https://github.com/kirbylane505/mystation.git",
    "local_path": "/Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation",
    "entity": "MYSTATION LLC",
    "state": "Wyoming",
    "ein": "41-4002675",
    "built": "2026-02-02",
    "branch": "main",

    # ===== TECH STACK =====
    "stack": {
        "framework": "Next.js 14 (App Router)",
        "react": "18.2.0",
        "styling": "Tailwind CSS 3.3.0",
        "state": "Zustand 4.4.0 (persisted)",
        "database": "Supabase (PostgreSQL + RLS)",
        "auth": "Supabase Auth",
        "payments": "Stripe (checkout sessions + webhooks)",
        "merch_fulfillment": "Printful API (print-on-demand)",
        "audio": "Howler.js 2.2.4",
        "video": "Mux (@mux/mux-node + mux-player-react)",
        "storage": "Cloudflare R2 (audio files via S3 SDK)",
        "live_streaming": "Agora SDK (infrastructure ready)",
        "icons": "Lucide React 0.294.0",
        "animations": "Canvas Confetti 1.9.4",
        "hosting": "Vercel",
        "dns": "GoDaddy → Vercel",
    },

    # ===== ENV VARS =====
    "env_vars": [
        "NEXT_PUBLIC_BASE_URL",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "NEXT_PUBLIC_R2_PUBLIC_URL",
        "NEXT_PUBLIC_CASHAPP_TAG",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "PRINTFUL_API_KEY",
        "AGORA_APP_ID",
        "AGORA_APP_CERTIFICATE",
    ],

    # ===== PAGES (25) =====
    "pages": {
        "/":                    "Home — hero, featured song, albums grid, catalog, email capture",
        "/music":               "Music browse — dynamic OG tags for link previews",
        "/merch":               "Merch store — IDMG catalog + Printful + kids + MPF (NO MUGS)",
        "/about":               "Foundation info — 501(c)(3) nonprofit",
        "/live":                "Live streaming — Agora/Mux",
        "/fan-zone":            "Community / fan engagement",
        "/videos":              "Video content library",
        "/vault":               "Unreleased music — PIN: 0505, 90-day streak unlock",
        "/artists":             "Artist directory",
        "/artist/[slug]":       "Individual artist profile",
        "/lotl":                "Love on the Lawn Festival",
        "/make-a-hit":          "Interactive music feature",
        "/contact":             "Contact form",
        "/privacy":             "Privacy policy",
        "/terms":               "Terms of service",
        "/password":            "Password reset",
        "/checkout":            "Stripe checkout with shipping",
        "/checkout/success":    "Post-payment success",
        "/subscribe/success":   "Post-subscription success",
        "/track/[id]":          "Track detail with autoplay",
        "/station/create":      "Create creator station (beta)",
        "/station/[username]":  "Public creator station page",
        "/station/dashboard":   "Creator dashboard",
        "/artists/dashboard":   "Artist management",
        "/artists/dashboard/upload": "Upload music files",
    },

    # ===== API ROUTES (17) =====
    "api_routes": {
        "auth": [
            "POST /api/auth/login",
            "POST /api/auth/signup",
            "POST /api/auth/logout",
            "GET  /api/auth/session",
        ],
        "payments": [
            "POST /api/checkout — Create Stripe checkout session (merch)",
            "POST /api/stripe/webhook — Webhook → Printful order creation",
        ],
        "orders": [
            "POST   /api/orders — Create order",
            "GET    /api/orders — List orders",
            "POST   /api/orders/[id] — Confirm/update order",
            "DELETE /api/orders/[id] — Cancel order",
        ],
        "printful": [
            "GET  /api/printful/products — List synced products",
            "GET  /api/printful/products/[id] — Single product",
            "GET  /api/printful/catalog — Browse catalog",
            "POST /api/printful/estimate — Cost estimate",
            "POST /api/printful/webhook — Printful events",
        ],
        "other": [
            "POST /api/shipping — Calculate rates",
            "POST /api/live/create-stream — Create stream",
            "POST /api/live/tip — Process tips",
        ],
    },

    # ===== COMPONENTS (30) =====
    "components": {
        "player": [
            "Player.jsx — Premium mobile-first audio player (play/pause, progress, volume, shuffle, repeat, share)",
            "AudioPlayer.jsx — Additional audio variant",
            "PlayCount.jsx — Track play stats",
        ],
        "engagement": [
            "SubscribeModal.jsx — 3-song free → $4.99/mo subscription wall",
            "DailySpin.jsx — Daily reward spin wheel",
            "StreakBadges.jsx — Streak badge display",
            "LoyaltyProgress.jsx — Tier progression bar",
            "UnlockProgress.jsx — Vault unlock tracker (90 days)",
            "VaultRewards.jsx — Vault content showcase",
            "VaultPreview.jsx — Vault teaser",
        ],
        "music": [
            "TrackList.jsx — Filterable/sortable track table",
            "Hero.jsx — Homepage hero",
            "FeaturedSong.jsx — Song of the week",
            "SongReactions.jsx — Reaction emojis/scoring",
        ],
        "community": [
            "FanWall.jsx — Community feed",
            "CommentSection.jsx — Track comments + replies",
            "ActivityFeed.jsx — User activity log",
            "ShareTrack.jsx — Multi-platform share (Twitter, TikTok, WhatsApp, copy link)",
            "ShareButtons.jsx — Social share buttons (custom modal, NOT navigator.share)",
        ],
        "shopping": [
            "Cart.jsx — Shopping cart drawer",
            "MerchMockup.jsx — Product mockup display",
            "EmailCapture.jsx — Newsletter signup",
        ],
        "admin": [
            "AuthModal.jsx — Login/signup modal",
            "CreatePlaylistModal.jsx — Create playlist dialog",
            "InstallPWA.jsx — Install app prompt",
        ],
        "navigation": [
            "Navbar.jsx — Top nav bar",
            "ClientProviders.jsx — Zustand providers + hydration",
            "VideoPlayer.jsx — Mux video player",
            "AdBanner.jsx — Ad space banner",
            "AlarmClock.jsx — Alarm/reminder",
        ],
    },

    # ===== STORES (Zustand) =====
    "stores": {
        "playerStore.js": "currentTrack, queue, playCount, subscription status",
        "authStore.js": "user login/signup, session management",
        "cartStore.js": "shopping cart, item management",
        "useUserStore": "profile, subscription tier, favorites",
    },

    # ===== DATABASE TABLES =====
    "database": {
        "profiles": "User profiles (name, avatar, artist flag, admin flag, total_plays, streak_days)",
        "tracks": "Released music (title, artist, album, audio_url, cover_image, play_count)",
        "albums": "Album metadata (title, artist, cover_image, release_year, track_count)",
        "plays": "Play analytics (track_id, user_id, duration_listened, completed)",
        "vault_tracks": "Unreleased music (status: vault/registered/released)",
        "subscribers": "Email subscribers (newsletter)",
        "orders": "Merch orders (user_id, items, total, status, shipping_address)",
        "user_loyalty": "Streaks (current_streak, longest_streak, total_plays, tier, vault_unlocked)",
        "daily_plays": "Daily play log for streak calculation",
        "playlists": "User playlists (user_id, track_ids, is_public)",
        "comments": "Song comments (track_id, user_id, content, likes, parent_id)",
        "comment_likes": "Comment like tracking",
        "artist_profiles": "Artist pages (artist_name, slug, bio, genres, followers, subscription_tier)",
        "artist_tracks": "Tracks by artists (artist_id, audio_url, bpm, key)",
        "artist_followers": "Follow relationships",
    },

    # ===== BUSINESS LOGIC =====
    "business": {
        "free_tier": "3 unique tracks per session",
        "paid_tier": "$4.99/mo unlimited streaming",
        "replay_rule": "Already-played tracks don't count toward limit",
        "vault_pin": "0505",
        "vault_unlock": "90-day consecutive streak",
        "loyalty_tiers": {
            "Newcomer": "0-29 days",
            "Supporter": "30-59 days",
            "Dedicated": "60-89 days",
            "Vault Member": "90+ days",
        },
        "merch_flow": "Cart → Stripe → Webhook → Printful prints & ships",
        "cashapp": "$RIDE4PAGEMUSIC847",
    },

    # ===== MUSIC CATALOG =====
    "catalog": {
        "Cindy's Son (2022)": "20 tracks (main album)",
        "Favorite Person (2026)": "1 track (featured single)",
        "iDMG Coke Wave Beats (2026)": "13 instrumental beats",
        "Singles (2020-2025)": "17 tracks",
        "Vault": "26+ unreleased tracks",
    },

    # ===== REVENUE MODEL =====
    "revenue": {
        "listener_subs": "$4.99/mo",
        "creator_subs_future": "$9.99-$49.99/mo",
        "transaction_fee": "8-10% on merch/products",
        "donations": "CashApp $RIDE4PAGEMUSIC847",
    },

    # ===== MERCH CATALOG (Feb 7 2026) =====
    "merch_items": [
        "IDMG Short Set Collection (9 colorways)",
        "IDMG Short Set - Modeled (White/Black/Red)",
        "IDMG Tracksuit Collection (4 colors)",
        "IDMG Onesie Collection (4 colors)",
        "IDMG Short Set - White (solo)",
        "IDMG His & Hers Set",
        "MPF Hoodies - Black & White",
        "MPF Crewneck - Black",
        "MPF Essentials Trio",
        "IDMG Kids Onesie",
        "LOTL Kids Tee ($15.99)",
        "LOTL Kids Sweater ($24.99)",
        "LOTL Kids Tee V2 ($15.99)",
        "MPF Kids Sweater ($19.99)",
        # Printful synced items load dynamically (NO MUGS)
    ],

    # ===== WHAT'S WORKING =====
    "features_live": [
        "Music streaming with 3-song free limit",
        "Supabase auth (signup/login/session)",
        "Stripe subscription ($4.99/mo)",
        "Printful merch + Stripe checkout + webhook fulfillment",
        "Player (play/pause, shuffle, repeat, progress, volume, queue)",
        "Daily spin wheel rewards",
        "Streak tracking + loyalty tiers",
        "Vault (PIN 0505, 26+ tracks)",
        "Comment system with replies",
        "Favorites & playlist creation",
        "Social sharing (custom modal — NOT navigator.share)",
        "Dynamic OG tags for link previews",
        "PWA install prompt",
        "LOTL 2026 promo banner (spend $26+ → 25% off tickets)",
    ],

    # ===== IN PROGRESS =====
    "in_progress": [
        "Creator stations (beta — /station/create, /station/[username], /station/dashboard)",
        "Artist upload dashboard (/artists/dashboard/upload)",
        "Live streaming (Agora integration — infrastructure ready)",
    ],

    # ===== ROADMAP =====
    "roadmap": [
        "R2 audio upload endpoint",
        "Mobile apps (React Native)",
        "Offline downloads for subscribers",
        "Advanced analytics dashboard",
        "Affiliate/referral system",
        "Creator subscriptions ($9.99-$49.99/mo)",
    ],

    # ===== RECENT COMMITS (last 10) =====
    "recent_commits": [
        "e1eee08 Fix IDMG black tee image and remove mug from store",
        "3d7620b Merch page: one unified shop with all new IDMG catalog + MPF + kids photos",
        "4e12a4f Merch page: add Printful image fallbacks + LOTL 2026 ticket promo banner",
        "2f384af Add MPF Kids Sweater product + fix IDMG label tee image",
        "bfca334 Fix kids merch checkout + IDMG Label Tee image",
        "7da376e Fix mug logo display - use Printful front-facing images",
        "f28d7ad Flip mug images to show LOTL logo on front",
        "c557fc8 Add LOTL branded baby photos to kids merch section",
        "cc962ac Fix share button and add baby photos to kids merch",
        "ac67c4f Force redeploy - MPF page updated",
    ],

    # ===== KNOWN GOTCHAS =====
    "gotchas": [
        "navigator.share FAILS silently on desktop — always use custom modal",
        "jamo_click/hazel_click breaks on zoomed pages — use execute + querySelector().click()",
        "Vercel dashboard needs login — use CLI: npx vercel --prod --yes",
        "Stripe webhook needs proper STRIPE_WEBHOOK_SECRET in Vercel env",
        "Printful order matching falls back to product name if metadata missing",
        "Demo checkout mode active when Stripe not configured",
        "Re-apply browser zoom after every navigation",
        "Quote ? in zsh URLs",
    ],

    # ===== DEPLOY =====
    "deploy": {
        "command": "npx vercel --prod --yes",
        "build": "npm run build",
        "dev": "npm run dev (port 3000)",
        "vercel_project": "mystation",
    },

    # ===== THEME =====
    "theme": {
        "mode": "Dark (navy/black premium)",
        "accent": "#3b82f6 (blue)",
        "fonts": "Montserrat / Inter",
        "effects": "Gradient overlays, orb animations",
    },
}


# ===== QUICK QUERIES =====

def show_state():
    """Print full MyStation state."""
    import json
    print(json.dumps(MYSTATION_STATE, indent=2, default=str))

def show_pages():
    """List all pages."""
    for path, desc in MYSTATION_STATE["pages"].items():
        print(f"  {path:30s} → {desc}")

def show_api():
    """List all API routes."""
    for group, routes in MYSTATION_STATE["api_routes"].items():
        print(f"\n  [{group.upper()}]")
        for r in routes:
            print(f"    {r}")

def show_components():
    """List all components."""
    for group, items in MYSTATION_STATE["components"].items():
        print(f"\n  [{group.upper()}]")
        for c in items:
            print(f"    {c}")

def show_status():
    """Quick status summary."""
    live = len(MYSTATION_STATE["features_live"])
    wip = len(MYSTATION_STATE["in_progress"])
    road = len(MYSTATION_STATE["roadmap"])
    pages = len(MYSTATION_STATE["pages"])
    apis = sum(len(v) for v in MYSTATION_STATE["api_routes"].values())
    comps = sum(len(v) for v in MYSTATION_STATE["components"].values())
    tables = len(MYSTATION_STATE["database"])
    merch = len(MYSTATION_STATE["merch_items"])

    print(f"""
╔══════════════════════════════════════════╗
║        MYSTATION BUILD STATUS            ║
╠══════════════════════════════════════════╣
║  URL:   {MYSTATION_STATE['url']:32s} ║
║  Repo:  {MYSTATION_STATE['repo']:32s} ║
║  EIN:   {MYSTATION_STATE['ein']:32s} ║
╠══════════════════════════════════════════╣
║  Pages:       {pages:3d}                        ║
║  API Routes:  {apis:3d}                        ║
║  Components:  {comps:3d}                        ║
║  DB Tables:   {tables:3d}                        ║
║  Merch Items: {merch:3d}                        ║
╠══════════════════════════════════════════╣
║  Features Live:   {live:3d}                     ║
║  In Progress:     {wip:3d}                     ║
║  Roadmap:         {road:3d}                     ║
╚══════════════════════════════════════════╝
""")


if __name__ == "__main__":
    show_status()
    print("\n─── LIVE FEATURES ───")
    for f in MYSTATION_STATE["features_live"]:
        print(f"  ✓ {f}")
    print("\n─── IN PROGRESS ───")
    for f in MYSTATION_STATE["in_progress"]:
        print(f"  ⟳ {f}")
    print("\n─── ROADMAP ───")
    for f in MYSTATION_STATE["roadmap"]:
        print(f"  ○ {f}")
    print("\n─── PAGES ───")
    show_pages()
    print("\n─── API ROUTES ───")
    show_api()
    print()
