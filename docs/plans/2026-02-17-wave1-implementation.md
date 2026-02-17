# Wave 1: MyStation 10/10 Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform MyStation from 15-tab clutter to a clean 6-tab premium platform with curated homepage and shareable merch product pages.

**Architecture:** Next.js App Router. Modify Navbar.jsx for nav, rewrite page.jsx for homepage, create /merch/[slug] dynamic route for product pages. All existing routes stay functional (just removed from nav).

**Tech Stack:** Next.js 14, React, Tailwind CSS, Zustand stores, Printful/Printify API, Lucide icons

---

## Task 1: Navigation Overhaul (Navbar.jsx)

**Files:**
- Modify: `src/components/Navbar.jsx`

**Changes:**
1. Reduce navItems array from 15 visible to 6 core tabs:
   - Home (/), Music (/music), Merch (/merch), Lounge (/lounge), Events (/events), Videos (/videos)
2. Remove from nav: fan-zone, about, make-a-hit, news, playlists, search, contact, street-team, lotl
3. Keep: Search dropdown in nav bar, Cart button, Subscribe CTA, Sign In
4. Add "More" dropdown for: Foundation (/about), Contact (/contact), News (/news), Street Team (/street-team)
5. Update mobile menu to match 6 core tabs + More section

**Commit:** "feat: slim nav to 6 core tabs with More dropdown"

---

## Task 2: Homepage Curated Showcase (page.jsx)

**Files:**
- Modify: `src/app/page.jsx` (currently 76KB — major rewrite)

**Changes:**
1. Keep: Hero section
2. Keep: IDMG Marquee
3. Keep: New Releases section (already has 6-8 tracks, good)
4. Keep: Albums & Projects grid
5. REMOVE: Full Catalog section (the 60+ track dump)
6. REMOVE: Discover Music CTA (search is in nav)
7. ADD: Trending section (6 most-played tracks, use engagement data)
8. ADD: Merch Drop section (4 newest products with "Shop All" link)
9. ADD: Lounge Activity section ("X active game rooms — Join Now")
10. ADD: Vault Teaser section (subscribe CTA for exclusive content)
11. Keep: About Mike Page section (shortened)
12. Keep: LOTL Countdown
13. Keep: Email Capture at bottom

**Goal:** Page goes from infinite scroll to tight, visual, action-driving sections.

**Commit:** "feat: curated homepage — remove catalog dump, add trending/merch/lounge sections"

---

## Task 3: Merch Product Pages (/merch/[slug])

**Files:**
- Create: `src/app/merch/[slug]/page.jsx` — individual product page
- Modify: `src/app/merch/page.jsx` — add links to individual pages
- Create: `src/lib/merch-utils.js` — slug generation, product lookup utilities

**Changes:**
1. Generate slug from product title (e.g., "IDMG Flip Flops" -> "idmg-flip-flops")
2. Product page shows: image gallery, color/size selectors, price, Add to Cart, description
3. Share button with copy-link functionality
4. Related products section (4 items)
5. Back to All Merch link
6. SEO: Dynamic <title> and OpenGraph meta for each product
7. On merch grid page: each product card links to /merch/[slug]

**Shareable URL:** mystationlive.com/merch/idmg-flip-flops

**Commit:** "feat: individual merch product pages with shareable URLs"

---

## Execution: Subagent-Driven, Parallel

All 3 tasks execute simultaneously via fresh subagents.
Each subagent gets full context and works independently.
Review after each task completes.
