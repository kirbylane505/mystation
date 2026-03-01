# Pool Dual Upgrade — Design Document
**Date:** 2026-03-01
**Status:** Approved

## Overview
Split pool into two game modes + add How to Play guides across ALL 7 Lounge games.

## Architecture
Two separate components sharing a common physics engine:
1. **ArcadePoolGame.jsx** — "Pooking Billiards" solo arcade (Rookie to Pro)
2. **PoolGame.jsx** (upgraded) — "Ultimate 8-Ball" multiplayer with premium visuals
3. **HowToPlayModal.jsx** — Universal guide modal for ALL 7 games

### Shared Physics: `poolPhysics.js`
Extracted from current PoolGame.jsx:
- `stepPhysics(balls, config)` — core simulation loop with sub-stepping
- `checkPockets(balls, pockets)` — pocket detection
- `ballCollision(b1, b2)` — elastic collision resolution
- `wallCollision(ball, bounds)` — cushion bounce
- Constants: FRICTION, BALL_R, WALL_BOUNCE, BALL_BOUNCE, MIN_VEL, etc.

## Game 1: Arcade Pool (ArcadePoolGame.jsx)

### Difficulty Tiers — Rookie to Pro
| Tier | Levels | Pockets | Aim Guide | Balls | Star Threshold |
|------|--------|---------|-----------|-------|----------------|
| Rookie (1-8) | Easy clears | 1.5x size | Full trajectory + ball prediction | 3-8 balls | Very generous |
| Street (9-16) | Standard play | Normal size | Trajectory only | Full 15 | Standard |
| Hustler (17-24) | Time + obstacles | Normal size | Short guide | Full 15 | Tight |
| Pro (25-30) | Trick shots | 0.85x size | Direction only | Full 15 + combos | Very tight |

### Level Types
- **Clear Table:** Pocket all balls within X shots
- **Time Attack:** Clear before timer runs out
- **Trick Shot:** Specific ball into specific pocket
- **Combo Challenge:** Pocket 2+ balls in one shot

### Kid-Friendly UX
- Big colorful feedback: "NICE SHOT!", "GREAT!", "PERFECT!"
- Confetti particle burst on level clear
- 1-3 star rating with animated fill
- Friendly retry: "Try Again!" button (no punishment)
- Progress saved to localStorage
- First 3 levels have optional slow-motion toggle
- Unlock system: Complete a tier to access the next

### Arcade-Specific Features
- Level select screen with star display per level
- Best score tracking per level
- Total stars counter (out of 90 max)

## Game 2: Ultimate 8-Ball Pool (PoolGame.jsx — upgraded)

### Visual Upgrades (Premium Canvas 2D)
- Cloth felt texture via canvas pattern fill (not random noise dots)
- Enhanced ball rendering: deeper 3D gradient, subtle rotation indication
- Smooth pocket drop animation: ball shrinks + fades into pocket over 300ms
- Shot trail particles: fading dots behind fast-moving balls
- Impact spark effects on hard ball-ball collisions
- Power glow on cue stick tip when charging
- Better ambient lighting gradient on felt

### Sound Upgrades
- Richer cushion thuds (noise buffer + low-pass filter, tuned)
- Deeper pocket drop (two-stage: splash + thud)
- Crowd "ooh" on great shots (3+ balls pocketed or long-distance pocket)

### Mobile Experience
- Larger touch target for cue ball (100px radius vs current 80px)
- Clear visual drag indicator
- Touch-action: none already set (good)

### Server Logic
- pool.js stays UNCHANGED — same rules, same API

## How to Play Guide — ALL 7 Games

### HowToPlayModal.jsx
- Portal-based modal (consistent with GameModeModal pattern)
- Shows on first game launch (localStorage flag per game)
- "?" button in every game's top-right corner for re-access
- Swipeable slides (mobile-friendly)

### Content Per Game (3-5 slides each, 10-year-old reading level)
| Game | Slides |
|------|--------|
| Arcade Pool | 1. Drag back to aim 2. Release to shoot 3. Clear all balls 4. Earn stars |
| 8-Ball Pool | 1. Solids vs Stripes 2. Aim & shoot 3. Pocket yours first 4. Sink the 8 last 5. Scratching |
| Blackjack | 1. Goal: get to 21 2. Hit or Stand 3. Aces = 1 or 11 4. Beat the dealer |
| Slides & Ladders | 1. Roll dice 2. Ladders = up 3. Slides = down 4. First to 100 |
| Spades | 1. Bid your tricks 2. Play cards 3. Spades are trump 4. Hit your bid |
| Dominoes | 1. Match numbers 2. Can't play? Draw 3. Empty hand wins |
| Quiz | 1. Pick the answer 2. Speed = bonus 3. Streaks = multiplier |

### Guide Data: `howToPlayData.js`
Each game entry:
```js
{
  gameId: 'pool',
  title: '8-Ball Pool',
  slides: [
    { heading: '...', body: '...', diagram: 'aim' },
    ...
  ]
}
```
Diagrams drawn on a small canvas within the modal (no image assets needed).

## Files

### New Files
- `src/components/lounge/ArcadePoolGame.jsx` — Arcade mode component
- `src/lib/games/poolPhysics.js` — Shared physics engine
- `src/lib/games/arcadeLevels.js` — 30 level definitions
- `src/components/lounge/HowToPlayModal.jsx` — Universal guide modal
- `src/lib/games/howToPlayData.js` — Guide content for all 7 games

### Modified Files
- `src/components/lounge/PoolGame.jsx` — Visual/sound upgrade, use shared physics
- `src/components/lounge/GameModeModal.jsx` — Pool sub-selector (Arcade vs 8-Ball)
- `src/lib/games/constants.js` — Add arcadePool game type
- All 7 game components — Add "?" help button linking to HowToPlayModal

## Non-Goals
- No Three.js / WebGL (staying Canvas 2D)
- No Supabase for arcade progress (localStorage only)
- No changes to pool.js server logic
- No new Supabase tables
