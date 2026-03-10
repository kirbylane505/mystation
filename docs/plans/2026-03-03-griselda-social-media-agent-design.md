# GRISELDA — Social Media Queen MCP Agent Design

**Date:** 2026-03-03
**Status:** Approved
**Author:** CHANDLA
**Priority:** HIGH — Revenue-generating agent

## Purpose

Build an MCP agent that automates daily content posting, fan engagement, and analytics tracking across Instagram, Facebook, and TikTok. Acts as Mike Page's A&R partner — deeply attuned to music promotion, platform algorithms, and fan engagement. All 3 platforms are now monetized, so every post = potential revenue.

## Platforms

- **Instagram** — @idmgatl via Meta Graph API v21.0
- **Facebook** — Mike Page personal + Love on the Lawn page via Meta Graph API
- **TikTok** — Via TikTok API for Business (future: Content Posting API)

## Architecture

```
/MikePageEmpire/tools/griselda-agent/
├── package.json
├── index.js              ← MCP server (15+ tools)
├── lib/
│   ├── meta-api.js       ← Meta Graph API v21.0 (IG + FB)
│   ├── scheduler.js      ← Content queue + optimal timing
│   ├── analytics.js      ← IG Insights + FB Page Insights
│   ├── content-engine.js ← Caption/hashtag generator
│   └── token-manager.js  ← Auto-refresh 60-day Meta tokens
├── data/
│   ├── content-queue.json  ← Scheduled posts
│   ├── posting-history.json ← What's been posted
│   └── analytics-cache.json ← Performance data
└── launchd/
    └── com.idmg.griselda.plist ← Auto-runs 3x daily
```

## MCP Tools

| Tool | Purpose |
|------|---------|
| `griselda_post_reel` | Post a Reel to IG + FB simultaneously |
| `griselda_post_photo` | Post image to IG feed + FB page |
| `griselda_post_story` | Post to IG Stories |
| `griselda_schedule` | Add content to auto-post queue |
| `griselda_queue_status` | View scheduled content |
| `griselda_analytics` | Pull engagement stats (reach, likes, shares, saves) |
| `griselda_top_posts` | Show best-performing content |
| `griselda_fan_growth` | Follower growth trends |
| `griselda_caption` | AI-generate caption + hashtags for content |
| `griselda_optimal_time` | Best posting time based on audience data |
| `griselda_cross_post` | Post same content to both IG + FB |
| `griselda_mixtape_promo` | Auto-create reel promo from mixtape track |
| `griselda_campaign` | Launch multi-day campaign (e.g., mixtape rollout) |
| `griselda_token_status` | Check Meta API token health |
| `griselda_refresh_token` | Refresh the 60-day token |

## Data Flow

1. Content enters queue (manual via tool or auto from campaign schedule)
2. `content-engine.js` generates caption, hashtags, CTA
3. Video/image uploaded to Cloudflare R2 (public URL for Meta API)
4. Meta Graph API publishes to IG + FB simultaneously
5. Analytics tracked in `analytics-cache.json`
6. JARVIS brain notified for dashboard reporting

## Auto-Schedule (launchd)

- **12:00 PM EST** — Afternoon post (music clip / behind-the-scenes)
- **6:00 PM EST** — Evening post (reel / engagement content)
- **9:00 PM EST** — Night post (fan interaction / story)

## Accounts Connected

- **Instagram:** @idmgatl (IDMG main) via Meta Business Suite
- **Facebook:** Mike Page personal + Love on the Lawn page
- **TikTok:** Mike Page TikTok (Creativity Program active)

## Content Sources

- `/Desktop/MIXTAPE_REELS/` — 13 pre-made mixtape track reels
- MyStation assets — logo, flyers, promo images
- LOTL assets — festival branding, announcements
- Album art — `/public/images/albums/`
- Merch photos — Printify product images

## Environment Variables Required

```
IG_USER_ID=           # Instagram Business Account ID
IG_ACCESS_TOKEN=      # Meta long-lived token (60-day)
META_APP_ID=          # Meta Developer App ID
META_APP_SECRET=      # Meta Developer App secret
FB_PAGE_ID=           # Facebook Page ID (LOTL page)
FB_PAGE_TOKEN=        # Facebook Page access token
R2_PUBLIC_BASE=       # Cloudflare R2 public URL
R2_BUCKET=            # mystation-audio bucket
```

## Existing Foundation

- `instagram_reel_publisher.py` — Proven Meta Graph API integration
- `IG_WEAPON_SYSTEM.md` — Operational playbook
- `30-day-promo-blitz-campaign.md` — 120+ posts planned
- `IDMG Posting Guide` — 15-day schedule with times
- MOB agent framework — GRISELDA role fully documented

## Success Metrics

- Daily posts going out on schedule (3/day minimum)
- Follower growth: +500/month across platforms
- Engagement rate: >3% on Reels
- MyStation subscription conversions tracked
- Revenue from FB/IG/TikTok monetization

## Dependencies

- Meta Developer App (existing)
- Cloudflare R2 (existing)
- Node.js + MCP SDK (existing pattern)
- launchd (existing pattern from JARVIS brain)

## Security

- All tokens stored in `.env.local` (gitignored)
- Token auto-refresh before expiry
- Rate limiting: 25 posts/24hrs, 200 API calls/hour
- No cold DM automation (violates Meta TOS)

## Phase 1 (Build Now)

1. MCP server skeleton with Meta Graph API
2. Post Reel, Photo, Story tools
3. Cross-post IG + FB
4. Content queue + scheduler
5. Caption/hashtag generator
6. launchd auto-posting

## Phase 2 (Next)

1. Analytics dashboard (IG Insights + FB Insights)
2. A/B testing post formats
3. TikTok Content Posting API integration
4. Fan growth tracking + reports
5. Campaign manager (multi-day rollouts)

## Phase 3 (Future)

1. AI-powered content recommendations
2. Engagement response automation
3. Fan re-engagement via PHANTOM (DMs)
4. Cross-platform analytics aggregation
5. Revenue tracking per platform
