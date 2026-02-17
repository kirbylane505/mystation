# MyStation 10/10 Upgrade Design

**Date:** February 17, 2026
**Status:** APPROVED
**Priority:** Everything parallel

## Vision
Take MyStation from good to DOMINANT. Clean navigation, curated content, shareable merch links, social gaming hub. Built to bring in the money and serve the fan base.

## 1. Navigation: 15 tabs to 6 core tabs

### New Nav Structure
| # | Tab | Route | Absorbs |
|---|-----|-------|---------|
| 1 | Home | / | News feed |
| 2 | Music | /music | /playlists, /search (page removed) |
| 3 | Merch | /merch | Product pages at /merch/[slug] |
| 4 | Lounge | /lounge | /fan-zone, /make-a-hit, /street-team |
| 5 | Events | /events | /lotl (becomes /events/lotl-2026) |
| 6 | Videos | /videos | Standalone |

### Footer Links
Foundation (/about), Contact, Privacy, Terms

### Removed as Standalone Pages
- /search (nav dropdown only)
- /fan-zone (absorbed into Lounge)
- /make-a-hit (game in Lounge)
- /street-team (community in Lounge)
- /news (section on homepage)
- /lotl (sub-route of events)
- /playlists (tab within /music)

## 2. Homepage: Curated Showcase

### Sections (top to bottom)
1. Hero: Featured release (album art, play button, "Listen Now")
2. Live Activity: "X fans listening right now"
3. New Releases: 6 tracks, horizontal scroll
4. Albums & Projects: 4 album cards
5. Trending: 6 most-played tracks this week
6. Merch Drop: 4 newest products, "Shop All" link
7. Lounge: Active game rooms, "Join Now"
8. Vault Teaser: Subscribe CTA
9. LOTL Countdown: Next event banner

No more 60-track Full Catalog dump.

## 3. Merch: Full Product Pages

### Route: /merch/[slug]
- Product image gallery
- Color & size selectors
- Price + Add to Cart
- Description & details
- Share button (copy link, social)
- Related products
- Back to All Merch

### Shareable URLs
mystationlive.com/merch/idmg-flip-flops

## 4. Lounge: Full Social Gaming Hub

### Current Games (keep)
Blackjack, Pool, Spades, Slides & Ladders

### New Features
- Voice chat in rooms (WebRTC/daily.co)
- Spectator mode
- Tournament brackets
- Point betting (engagement points)
- Leaderboards (by game, overall, weekly)
- Quick match auto-join
- Fan Zone sidebar (activity feed, reactions)
- Make A Hit as a game option
- Street Team missions/challenges

## 5. Page Upgrades

| Page | Upgrade |
|------|---------|
| Music | Tabbed: All Songs, Albums, Playlists. Filter/sort/grid toggle |
| Events | Rich cards, LOTL featured, ticket flow |
| Videos | Netflix-style browser with categories |

## Execution Waves

### Wave 1 (Session 1)
- Nav overhaul (6 tabs)
- Homepage redesign (curated)
- Merch product pages (/merch/[slug])

### Wave 2 (Session 2)
- Music page tabbed view
- Lounge social features
- Events page upgrade

### Wave 3 (Polish)
- Videos Netflix-style
- Universal search (music + merch + events)
- Performance + animations
