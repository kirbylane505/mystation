# MyStation iOS App Store Submission

## Overview
Wrap mystationlive.com in a native iOS shell using Capacitor 8.1 (already configured).
The app loads the live site with native features: background audio, push notifications, haptics.

## Apple Developer Account
- **Enrollment ID:** MXC79D65GW
- **Order:** #W1462758313
- **Cost:** $106.67 ($99 + tax)
- **Account:** Impossible Dreamz Music Group (idmgatl@gmail.com)
- **Entity Type:** Individual / Sole Proprietor
- **Status:** Pending activation (24-48hrs)

## App Details
- **App Name:** MyStation
- **Bundle ID:** com.idmg.mystation
- **Version:** 1.0.0
- **Category:** Music
- **Secondary Category:** Entertainment
- **Price:** Free (subscription in-app via Stripe web checkout)

## App Store Listing

### Name
MyStation - IDMG Music

### Subtitle (30 chars max)
Stream. Support. Subscribe.

### Description
MyStation is the official music streaming app from Impossible Dreamz Music Group (IDMG). Stream exclusive tracks from Mike Page and IDMG artists, browse and purchase official merchandise, and stay connected with the IDMG community.

Features:
- Stream exclusive IDMG music with background playback
- Browse 100M+ songs via Spotify-powered search
- Shop official IDMG merchandise
- Access exclusive content with a $4.99/month subscription
- 2 free tracks for all users
- Push notifications for new releases and events
- Support youth programs through Mike Page Foundation

Whether you're a longtime fan or just discovering IDMG, MyStation puts the entire empire in your pocket.

### Keywords (100 chars max)
music,streaming,hip-hop,IDMG,Mike Page,merch,independent,rap,R&B,festival

### Support URL
https://mystationlive.com

### Privacy Policy URL
https://mystationlive.com/privacy

### Screenshots Needed
- 6.7" (iPhone 15 Pro Max): 1290 x 2796
- 6.5" (iPhone 11 Pro Max): 1242 x 2688
- iPad Pro 12.9": 2048 x 2732

### What's New (Version 1.0.0)
Welcome to MyStation! Stream exclusive IDMG music, shop official merch, and join the community.

## Technical Setup (Already Done)
- [x] Capacitor 8.1 installed + configured
- [x] iOS project scaffolded
- [x] App icon (1024x1024 IDMG logo)
- [x] Splash screen (IDMG logo on dark background)
- [x] Background audio mode in Info.plist
- [x] Push notifications configured
- [x] Haptics plugin installed
- [x] Server URL points to mystationlive.com

## Remaining Steps
1. [ ] Xcode download completes (~12GB)
2. [ ] Apple Developer account activates (24-48hrs)
3. [ ] Open iOS project in Xcode, set signing team
4. [ ] Build and test on simulator
5. [ ] Create privacy policy page at /privacy
6. [ ] Take App Store screenshots (iPhone + iPad)
7. [ ] Create App Store Connect listing
8. [ ] Archive and upload build via Xcode
9. [ ] Submit for App Review (1-3 days)

## Privacy Policy Requirements
MyStation collects:
- Email address (subscription/login)
- Usage data (analytics via PostHog)
- No third-party tracking
- No data sold to third parties

## App Review Notes
- App uses WKWebView to load mystationlive.com with native enhancements
- Background audio playback for music streaming
- Push notifications for new content
- Subscription handled via Stripe web checkout (not IAP — physical goods/services exemption for merch)
- Music streaming is the core functionality, not just a website wrapper
