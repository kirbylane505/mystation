# IDMG Instagram Automation Playbook
# Last Updated: February 27, 2026

---

## TABLE OF CONTENTS

1. [Meta Graph API Setup for Reels Publishing](#1-meta-graph-api-setup-for-reels-publishing)
2. [Can Reels Be Posted via API in 2026?](#2-can-reels-be-posted-via-api-in-2026)
3. [Alternative: Meta Business Suite](#3-alternative-meta-business-suite)
4. [Python Script Template](#4-python-script-template)
5. [ManyChat DM Automation](#5-manychat-dm-automation)

---

## 1. META GRAPH API SETUP FOR REELS PUBLISHING

### Step 1: Create a Meta Developer App

1. Go to **https://developers.facebook.com/**
2. Log in with the Facebook account linked to your Instagram Business/Creator account
3. Click **My Apps** (top right) > **Create App**
4. Select app type: **Business**
5. Name it: `IDMG Instagram Publisher`
6. Select your Business Portfolio (or create one)
7. Click **Create App**

### Step 2: Add Instagram Graph API Product

1. In your app dashboard, click **Add Product** in the left sidebar
2. Find **Instagram Graph API** and click **Set Up**
3. This adds the Instagram API to your app

### Step 3: Connect IG Business Account to a Facebook Page

**REQUIREMENT:** Instagram API only works with **Business** or **Creator** accounts linked to a Facebook Page.

1. On Instagram: Settings > Account > Switch to Professional Account > Business
2. On Instagram: Settings > Account > Linked Accounts > Facebook > Link your FB Page
3. On Facebook Page: Settings > Instagram > Connect your Instagram account

### Step 4: Get Your Instagram Business Account ID

```
GET /me/accounts?access_token={USER_ACCESS_TOKEN}
```

This returns your Facebook Pages. Then for each page:

```
GET /{page-id}?fields=instagram_business_account&access_token={USER_ACCESS_TOKEN}
```

The `instagram_business_account.id` is your **IG User ID** (you need this for all publishing calls).

### Step 5: Required Permissions

Your app needs these permissions approved:

| Permission | Purpose |
|-----------|---------|
| `instagram_basic` | Read account info |
| `instagram_content_publish` | Publish Reels, posts, stories |
| `pages_read_engagement` | Read Page data (required for IG link) |
| `pages_show_list` | List pages you manage |
| `business_management` | Access Business Portfolio |

**For testing:** These work immediately in Development Mode for accounts that have a role on the app.

**For production:** You must submit for App Review (takes 1-5 business days).

### Step 6: Get a Long-Lived Access Token (60 Days)

**Phase A: Get Short-Lived Token (1 hour)**

Use the Graph API Explorer: https://developers.facebook.com/tools/explorer/

1. Select your app
2. Select **User Token**
3. Add permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_show_list`
4. Click **Generate Access Token**
5. Authorize the app
6. Copy the short-lived token

**Phase B: Exchange for Long-Lived Token (60 days)**

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={SHORT_LIVED_TOKEN}
```

Response:
```json
{
  "access_token": "EAAG...long_token_here...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

`expires_in` = 5,184,000 seconds = 60 days.

**Phase C: Auto-Refresh Before Expiry**

Refresh anytime after 24 hours but before expiry:

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={CURRENT_LONG_LIVED_TOKEN}
```

**Best practice:** Set a cron job to refresh every 50 days.

### Step 7: API Flow for Posting a Reel

The Reel publishing flow is a **3-step async process:**

#### Step 7a: Upload Video to a Public URL

The video MUST be hosted at a publicly accessible URL. Options:
- Cloudflare R2 (IDMG already has this: `pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev`)
- AWS S3 with public read
- Any public CDN

#### Step 7b: Create Media Container

```
POST https://graph.facebook.com/v21.0/{ig-user-id}/media
```

Parameters:

| Parameter | Value | Required |
|-----------|-------|----------|
| `media_type` | `REELS` | Yes |
| `video_url` | Public URL of your video | Yes |
| `caption` | Your caption text + hashtags | No |
| `share_to_feed` | `true` | No (default true) |
| `thumb_offset` | Milliseconds for thumbnail frame | No |
| `cover_url` | Public URL of custom cover image | No |
| `location_id` | Facebook Page location ID | No |
| `collaborators` | Array of IG usernames | No |
| `access_token` | Your long-lived token | Yes |

Response:
```json
{
  "id": "17889615691921648"
}
```

This `id` is the **container ID**.

#### Step 7c: Check Container Status (Poll Until Ready)

```
GET https://graph.facebook.com/v21.0/{container-id}
  ?fields=status_code
  &access_token={ACCESS_TOKEN}
```

Status codes:

| Status | Meaning |
|--------|---------|
| `IN_PROGRESS` | Video is still processing. Wait and poll again. |
| `FINISHED` | Ready to publish. Proceed to Step 7d. |
| `ERROR` | Something failed. Check `status` field for details. |
| `EXPIRED` | Container expired (24 hours). Create a new one. |

**Poll every 5-10 seconds.** Processing typically takes 30-120 seconds depending on video length.

#### Step 7d: Publish the Reel

```
POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
  ?creation_id={container-id}
  &access_token={ACCESS_TOKEN}
```

Response:
```json
{
  "id": "17920238413019877"
}
```

This `id` is the published Reel's media ID. The Reel is now LIVE on Instagram.

---

## 2. CAN REELS BE POSTED VIA API IN 2026?

### YES. Confirmed Working.

As of February 2026, the Instagram Content Publishing API fully supports Reels. Here is the current status:

| Feature | Supported | Notes |
|---------|-----------|-------|
| Publish Reels | YES | Since mid-2022, fully stable |
| Schedule Reels | YES | Via `published=false` + `scheduled_publish_time` |
| Reel analytics | YES | Views, likes, comments, shares, saves |
| Trial Reels | YES | New in 2025/2026 -- limited audience test |
| Delete media | YES | New endpoint added |
| Collaborator tagging | YES | Tag other IG users on Reels |
| Stories publishing | YES | Since 2023 |
| Carousel posts | YES | Multiple images/videos |

### Restrictions

- **Account type:** Must be Business or Creator account (not Personal)
- **Max video length via API:** 90 seconds (some accounts limited to 60s)
- **Max file size:** 1 GB (though 100 MB recommended for processing speed)
- **Rate limit:** 50 posts per user per 24-hour period (Reels + Stories + Feed combined)
- **API version:** Use v21.0 or latest
- **Video must be hosted at a public URL** -- you cannot upload a local file directly to the API

### Video Technical Requirements

| Spec | Requirement |
|------|-------------|
| Format | MP4 (MPEG-4 Part 14) or MOV |
| Video codec | H.264 or HEVC, progressive scan, closed GOP |
| Audio codec | AAC, max 48kHz sample rate, mono or stereo |
| Resolution (min) | 540 x 960 px |
| Resolution (recommended) | 1080 x 1920 px |
| Aspect ratio | 9:16 recommended (0.01:1 to 10:1 accepted) |
| Frame rate | Minimum 30 FPS |
| File structure | moov atom at front of file, no edit lists |

### Video Hosting Options for IDMG

Since IDMG already has Cloudflare R2:

```bash
# Upload reel video to R2
wrangler r2 object put mystation-audio/reels/my-reel.mp4 --file=./my-reel.mp4 --remote

# Public URL becomes:
# https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/reels/my-reel.mp4
```

This public URL can be passed directly to the `video_url` parameter.

---

## 3. ALTERNATIVE: META BUSINESS SUITE

### Can You Schedule Reels from Desktop?

**YES.** Meta Business Suite supports scheduling Reels from the desktop browser at https://business.facebook.com/

### Upload Flow for Reels via Business Suite

1. Go to **business.facebook.com** > **Content** > **Create Post**
2. Select the Instagram account
3. Click **Create Reel**
4. Upload your pre-recorded video file (drag & drop or browse)
5. Add caption, hashtags, location
6. Optionally set a cover image (thumbnail)
7. Click the **Schedule** button (clock icon) instead of Publish
8. Select date and time
9. Click **Schedule Reel**

### Scheduling Window

- Minimum: 20 minutes ahead
- Maximum: 29 days ahead (some sources say up to 75 days)

### Limitations vs Native App

| Feature | Business Suite | Native App |
|---------|---------------|------------|
| Upload Reels | Yes | Yes |
| Schedule Reels | Yes | Yes (up to 75 days) |
| Add trending audio | NO | Yes |
| In-app effects/stickers | NO | Yes |
| AR filters | NO | Yes |
| Remix feature | NO | Yes |
| Bulk scheduling | NO | No |
| Max length | 90 seconds | 15 minutes |
| Video editing | Basic trim only | Full editor |
| Collaboration tags | Limited | Full |
| Draft saving | Yes | Yes |
| Analytics | Full insights | Full insights |
| Desktop use | Yes | No |

### Bottom Line on Business Suite

Good for: Scheduling pre-produced content from desktop, managing multiple accounts.

Bad for: Content that needs trending audio, effects, or in-app editing features.

**For IDMG:** Business Suite works well for pre-produced promotional Reels (music snippets, behind-the-scenes, event promo) that do not need trending audio.

---

## 4. PYTHON SCRIPT TEMPLATE

### Full Script: `instagram_reel_publisher.py`

```python
#!/usr/bin/env python3
"""
IDMG Instagram Reel Publisher
Posts a Reel to Instagram via Meta Graph API.

Requirements:
    pip install requests boto3

Usage:
    python instagram_reel_publisher.py \
        --video ./my-reel.mp4 \
        --caption "New music dropping Friday" \
        --hashtags "#IDMG #NewMusic #HipHop"
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

# =============================================================================
# CONFIGURATION — Set these as environment variables or hardcode for testing
# =============================================================================
GRAPH_API_VERSION = "v21.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

# From environment variables (recommended)
IG_USER_ID = os.environ.get("IG_USER_ID", "")                    # Your Instagram Business Account ID
ACCESS_TOKEN = os.environ.get("IG_ACCESS_TOKEN", "")              # Long-lived access token
R2_PUBLIC_BASE = os.environ.get("R2_PUBLIC_BASE",
    "https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev")       # Cloudflare R2 public URL
R2_BUCKET = os.environ.get("R2_BUCKET", "mystation-audio")        # R2 bucket name

# Meta App credentials (for token refresh)
META_APP_ID = os.environ.get("META_APP_ID", "")
META_APP_SECRET = os.environ.get("META_APP_SECRET", "")


def upload_to_r2(local_path: str, r2_key: str) -> str:
    """
    Upload video to Cloudflare R2 using wrangler CLI.
    Returns the public URL.

    Alternative: Use boto3 with S3-compatible endpoint for R2.
    """
    local_path = Path(local_path)
    if not local_path.exists():
        raise FileNotFoundError(f"Video file not found: {local_path}")

    file_size_mb = local_path.stat().st_size / (1024 * 1024)
    print(f"[UPLOAD] Uploading {local_path.name} ({file_size_mb:.1f} MB) to R2...")

    # Upload via wrangler
    cmd = [
        "wrangler", "r2", "object", "put",
        f"{R2_BUCKET}/{r2_key}",
        f"--file={local_path}",
        "--remote",
        "--content-type=video/mp4"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"R2 upload failed: {result.stderr}")

    public_url = f"{R2_PUBLIC_BASE}/{r2_key}"
    print(f"[UPLOAD] Public URL: {public_url}")
    return public_url


def upload_to_r2_boto3(local_path: str, r2_key: str) -> str:
    """
    Alternative: Upload to R2 using boto3 (S3-compatible API).
    Useful if wrangler is not installed.
    """
    import boto3
    from botocore.config import Config

    R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "c8e8ab691c0489c0dd51afd47a72d1b6")
    R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY", "")
    R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY", "")

    s3 = boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

    local_path = Path(local_path)
    print(f"[UPLOAD] Uploading {local_path.name} to R2 via boto3...")

    s3.upload_file(
        str(local_path),
        R2_BUCKET,
        r2_key,
        ExtraArgs={"ContentType": "video/mp4"}
    )

    public_url = f"{R2_PUBLIC_BASE}/{r2_key}"
    print(f"[UPLOAD] Public URL: {public_url}")
    return public_url


def create_reel_container(video_url: str, caption: str, hashtags: str = "") -> str:
    """
    Step 1: Create a media container for the Reel.
    Returns the container ID.
    """
    full_caption = caption
    if hashtags:
        full_caption = f"{caption}\n\n{hashtags}"

    url = f"{GRAPH_API_BASE}/{IG_USER_ID}/media"
    params = {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": full_caption,
        "share_to_feed": "true",
        "access_token": ACCESS_TOKEN,
    }

    print(f"[CONTAINER] Creating Reel container...")
    print(f"[CONTAINER] Video URL: {video_url}")
    print(f"[CONTAINER] Caption: {full_caption[:80]}...")

    response = requests.post(url, data=params)
    data = response.json()

    if "error" in data:
        error = data["error"]
        raise RuntimeError(
            f"Container creation failed: [{error.get('code')}] "
            f"{error.get('message')}\n"
            f"Type: {error.get('type')}\n"
            f"Subcode: {error.get('error_subcode')}"
        )

    container_id = data["id"]
    print(f"[CONTAINER] Created container: {container_id}")
    return container_id


def wait_for_container(container_id: str, max_wait: int = 300, poll_interval: int = 5) -> bool:
    """
    Step 2: Poll container status until FINISHED or ERROR.
    Returns True if ready to publish.
    """
    url = f"{GRAPH_API_BASE}/{container_id}"
    params = {
        "fields": "status_code,status",
        "access_token": ACCESS_TOKEN,
    }

    elapsed = 0
    print(f"[PROCESSING] Waiting for video processing...")

    while elapsed < max_wait:
        response = requests.get(url, params=params)
        data = response.json()

        status_code = data.get("status_code", "UNKNOWN")
        status = data.get("status", "")

        print(f"[PROCESSING] Status: {status_code} ({elapsed}s elapsed)")

        if status_code == "FINISHED":
            print(f"[PROCESSING] Video ready to publish!")
            return True
        elif status_code == "ERROR":
            raise RuntimeError(
                f"Video processing failed: {status}\n"
                f"Full response: {json.dumps(data, indent=2)}"
            )
        elif status_code == "EXPIRED":
            raise RuntimeError("Container expired (24-hour limit). Create a new one.")

        time.sleep(poll_interval)
        elapsed += poll_interval

    raise TimeoutError(f"Video processing timed out after {max_wait} seconds")


def publish_reel(container_id: str) -> str:
    """
    Step 3: Publish the processed Reel.
    Returns the published media ID.
    """
    url = f"{GRAPH_API_BASE}/{IG_USER_ID}/media_publish"
    params = {
        "creation_id": container_id,
        "access_token": ACCESS_TOKEN,
    }

    print(f"[PUBLISH] Publishing Reel...")
    response = requests.post(url, data=params)
    data = response.json()

    if "error" in data:
        error = data["error"]
        raise RuntimeError(
            f"Publish failed: [{error.get('code')}] {error.get('message')}"
        )

    media_id = data["id"]
    print(f"[PUBLISH] Reel published! Media ID: {media_id}")
    return media_id


def get_reel_permalink(media_id: str) -> str:
    """
    Get the permalink for the published Reel.
    """
    url = f"{GRAPH_API_BASE}/{media_id}"
    params = {
        "fields": "permalink,shortcode,timestamp",
        "access_token": ACCESS_TOKEN,
    }

    response = requests.get(url, params=params)
    data = response.json()

    permalink = data.get("permalink", "N/A")
    print(f"[LINK] Reel URL: {permalink}")
    return permalink


def refresh_access_token() -> str:
    """
    Refresh long-lived access token.
    Call this every 50 days to prevent expiry.
    Returns new token.
    """
    if not META_APP_ID or not META_APP_SECRET:
        raise ValueError("META_APP_ID and META_APP_SECRET required for token refresh")

    url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": META_APP_ID,
        "client_secret": META_APP_SECRET,
        "fb_exchange_token": ACCESS_TOKEN,
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "error" in data:
        raise RuntimeError(f"Token refresh failed: {data['error']['message']}")

    new_token = data["access_token"]
    expires_in = data.get("expires_in", 0)
    days_until_expiry = expires_in / 86400

    print(f"[TOKEN] Refreshed. Expires in {days_until_expiry:.0f} days.")
    return new_token


def validate_config():
    """Check required configuration."""
    errors = []
    if not IG_USER_ID:
        errors.append("IG_USER_ID not set")
    if not ACCESS_TOKEN:
        errors.append("IG_ACCESS_TOKEN not set")
    if errors:
        print("CONFIGURATION ERRORS:")
        for e in errors:
            print(f"  - {e}")
        print("\nSet environment variables:")
        print("  export IG_USER_ID='your-ig-user-id'")
        print("  export IG_ACCESS_TOKEN='your-long-lived-token'")
        sys.exit(1)


def post_reel(video_path: str, caption: str, hashtags: str = "") -> dict:
    """
    Full pipeline: Upload > Create Container > Wait > Publish.
    Returns dict with media_id and permalink.
    """
    validate_config()

    # Step 0: Upload video to public hosting
    video_file = Path(video_path)
    r2_key = f"reels/{video_file.name}"
    video_url = upload_to_r2(video_path, r2_key)

    # Step 1: Create container
    container_id = create_reel_container(video_url, caption, hashtags)

    # Step 2: Wait for processing
    wait_for_container(container_id)

    # Step 3: Publish
    media_id = publish_reel(container_id)

    # Step 4: Get permalink
    permalink = get_reel_permalink(media_id)

    print("\n" + "=" * 50)
    print("REEL PUBLISHED SUCCESSFULLY")
    print(f"  Media ID:  {media_id}")
    print(f"  Permalink: {permalink}")
    print("=" * 50)

    return {
        "media_id": media_id,
        "permalink": permalink,
        "container_id": container_id,
        "video_url": video_url,
    }


# =============================================================================
# CLI
# =============================================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Post a Reel to Instagram via Meta Graph API")
    parser.add_argument("--video", required=True, help="Path to video file (MP4, 9:16, max 90s)")
    parser.add_argument("--caption", required=True, help="Reel caption text")
    parser.add_argument("--hashtags", default="", help='Hashtags string (e.g. "#IDMG #NewMusic")')
    parser.add_argument("--refresh-token", action="store_true", help="Refresh access token and exit")

    args = parser.parse_args()

    if args.refresh_token:
        validate_config()
        new_token = refresh_access_token()
        print(f"\nNew token: {new_token[:20]}...{new_token[-10:]}")
        print("Update your IG_ACCESS_TOKEN environment variable.")
        sys.exit(0)

    result = post_reel(args.video, args.caption, args.hashtags)
```

### Environment Setup

```bash
# Install dependencies
pip install requests boto3

# Set environment variables (add to ~/.zshrc for persistence)
export IG_USER_ID="your-instagram-business-account-id"
export IG_ACCESS_TOKEN="your-60-day-long-lived-token"
export META_APP_ID="your-meta-app-id"
export META_APP_SECRET="your-meta-app-secret"

# Optional: R2 credentials for boto3 method
export R2_ACCESS_KEY="71e1ea09fcab59a24cd130fbbb137353"
export R2_SECRET_KEY="your-r2-secret-key"
export R2_ACCOUNT_ID="c8e8ab691c0489c0dd51afd47a72d1b6"
```

### Usage Examples

```bash
# Post a Reel
python instagram_reel_publisher.py \
    --video ./promo-reel.mp4 \
    --caption "New single out now. Link in bio." \
    --hashtags "#IDMG #ImpossibleDreamz #NewMusic #HipHop #ATL"

# Refresh your access token (run every 50 days)
python instagram_reel_publisher.py --refresh-token

# LOTL Festival promo
python instagram_reel_publisher.py \
    --video ./lotl-promo.mp4 \
    --caption "Love on the Lawn Day 2026. September 5th. Elgin, IL. 10,000 deep. Tickets at lotlfest.com" \
    --hashtags "#LOTL2026 #LoveOnTheLawn #Festival #ChicagoEvents #LiveMusic"
```

### Token Refresh Cron Job

```bash
# Add to crontab (crontab -e):
# Refresh IG token every 50 days at 3 AM
0 3 */50 * * cd /Users/impossibledreamzmusicgroup/MikePageEmpire && python3 instagram_reel_publisher.py --refresh-token >> /tmp/ig_token_refresh.log 2>&1
```

---

## 5. MANYCHAT DM AUTOMATION

### What is ManyChat?

ManyChat is the leading Instagram DM automation platform. It lets you set up auto-replies, keyword triggers, and engagement flows that respond to DMs, story replies, and comments automatically.

**Pricing:**
- Free Plan: 1,000 contacts, basic automation
- Pro Plan: $15/mo for unlimited contacts and advanced features

### Step 1: Create ManyChat Account

1. Go to **https://manychat.com/**
2. Sign up with the Facebook account linked to your IG Business account
3. Connect your Instagram Business account when prompted
4. Grant all requested permissions

### Step 2: Set Up Keyword Triggers

**Use Case: Fan sends "MIXTAPE" and gets a streaming link**

1. Go to **Automation** tab in ManyChat sidebar
2. Click **+ New Automation**
3. Click **+ Start From Scratch**
4. In the trigger selection, choose **A contact sends you a message with a keyword** (Instagram tab)
5. Set keyword: `MIXTAPE`
   - Choose **Message contains** (catches variations like "send me the mixtape")
   - Add alternate spellings: `MIXTAPE`, `MIX TAPE`, `mixtape`, `tape`
6. Add response node: **Send Message** (Instagram)
7. Write the message:

```
Hey! Thanks for hitting us up. Here's the new project:

Stream "Grammy Nights Vol. 1" now:
Spotify: [link]
Apple Music: [link]

MyStation: https://mystationlive.com/music

Follow @impossibledrreamzmusic for more drops.
```

8. Click **Publish**

### Step 3: More Keyword Triggers for IDMG

| Keyword | Auto-Reply |
|---------|-----------|
| `LINK` or `STREAM` | Streaming links to latest release |
| `TICKETS` or `LOTL` | "Get your LOTL Day 2026 tickets: lotlfest.com - Sept 5, Elgin IL" |
| `MERCH` | "Shop IDMG merch: mystationlive.com/merch - Limited drops." |
| `COLLAB` | "For collabs/features, email: idmgatl@gmail.com. Include your links." |
| `BOOKING` | "For booking/events: Contact@LOTLFEST.com" |
| `CUBIST` | Link to The Cubist's latest projects |

### Step 4: Comment-to-DM Automation (Growth Hack)

This is the biggest growth play. When someone comments a keyword on your post, ManyChat automatically DMs them.

**Setup:**

1. Go to **Automation** > **+ New Automation**
2. Select trigger: **User comments on your Post or Reel** (Instagram tab)
3. Select which post/reel to attach it to (or "All posts")
4. Set comment keyword trigger: e.g., "LINK" or "DROP"
5. Add first step: **Send Message** > select **Send as a Private Reply**
6. Write the DM:

```
You asked for it! Here's the link:

[Insert streaming/ticket/merch link]

Drop a follow to stay locked in.
```

7. IMPORTANT: Select **Send within 24 hours** (Meta requires this)
8. Write 5-7 message variations so it does not look robotic
9. Publish

**Execution Strategy for IDMG:**

1. Post a Reel with caption: "Comment LINK for the new drop"
2. ManyChat auto-DMs everyone who comments "LINK"
3. Each person who gets DM'd becomes a ManyChat subscriber
4. You can now message them about future releases

### Step 5: Story Reply Automation

When someone replies to your IG Story, ManyChat can auto-respond.

**Setup:**

1. Go to **Automation** > **+ New Automation**
2. Select trigger: **User replies to your Story** (Instagram tab)
3. Choose: **All stories** or a **Specific story**
4. Set trigger condition:
   - **Any message or reaction** (catch all engagement)
   - OR specific keyword (e.g., only replies containing "fire" or emoji reactions)
5. Add response flow:

```
Appreciate you rocking with us!

Check out the full project:
https://mystationlive.com/music

What's your favorite track?
```

6. Publish

**Growth Strategy:**

1. Post a Story with a question sticker or poll
2. Caption: "Reply with your fav track and we'll send you an exclusive"
3. Everyone who replies gets auto-DM'd into your subscriber list
4. Build audience you can message directly for drops, events, merch

### Step 6: Instagram Live / Broadcast Follow-Up

1. After going Live, set up a keyword trigger for `REPLAY`
2. Anyone who missed the Live DMs "REPLAY" and gets the link
3. Works for: live performances, listening parties, Q&As

### ManyChat Best Practices for Music Labels

1. **Respond fast** -- ManyChat replies instantly, which IG algorithm rewards
2. **Write 5-7 variations** of each response to avoid spam detection
3. **Use the 24-hour window** -- after someone DMs you, you have 24 hours to message them
4. **Segment your audience** -- tag contacts as "fans", "industry", "media" for targeted messaging
5. **Comply with Meta policies** -- never spam, always provide value, include opt-out option
6. **Track metrics** -- ManyChat dashboard shows open rates, click rates, subscriber growth

---

## QUICK REFERENCE CARD

### API Endpoints

```
# Create Reel container
POST https://graph.facebook.com/v21.0/{ig-user-id}/media
  media_type=REELS
  video_url={PUBLIC_VIDEO_URL}
  caption={TEXT}
  access_token={TOKEN}

# Check processing status
GET https://graph.facebook.com/v21.0/{container-id}?fields=status_code&access_token={TOKEN}

# Publish Reel
POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
  creation_id={CONTAINER_ID}
  access_token={TOKEN}

# Get Reel info
GET https://graph.facebook.com/v21.0/{media-id}?fields=permalink,like_count,comments_count&access_token={TOKEN}

# Refresh token
GET https://graph.facebook.com/v21.0/oauth/access_token
  grant_type=fb_exchange_token
  client_id={APP_ID}
  client_secret={APP_SECRET}
  fb_exchange_token={CURRENT_TOKEN}
```

### Video Specs Cheat Sheet

```
Format:     MP4 (H.264 + AAC)
Resolution: 1080x1920 (9:16)
FPS:        30 minimum
Length:     Up to 90 seconds via API
File size:  Under 100 MB recommended
Audio:      AAC, 48kHz max, stereo
```

### IDMG Hashtag Sets

```
# General IDMG
#IDMG #ImpossibleDreamz #ImpossibleDreamzMusicGroup #MikePage #NewMusic #HipHop #ATL

# LOTL Festival
#LOTL2026 #LoveOnTheLawn #LoveOnTheLawnDay #Festival #ChicagoEvents #LiveMusic #ElginIL

# MyStation
#MyStation #MusicStreaming #IndieMusic #SupportIndieArtists

# The Cubist / Tyrell Thornton
#TheCubist #TyrellThornton #Producer #HitMaker
```

---

## NEXT STEPS TO GO LIVE

1. [ ] Create Meta Developer App at developers.facebook.com
2. [ ] Ensure IG account is Business/Creator and linked to FB Page
3. [ ] Get IG User ID via Graph API Explorer
4. [ ] Generate long-lived access token (60 days)
5. [ ] Store credentials as environment variables
6. [ ] Test Python script with a short test video
7. [ ] Set up token refresh cron job
8. [ ] Create ManyChat account (free tier)
9. [ ] Set up keyword triggers: LINK, TICKETS, MERCH, COLLAB
10. [ ] Set up comment-to-DM automation on next Reel post
11. [ ] Set up story reply automation

---

*Document created: February 27, 2026*
*For: IDMG (Impossible Dreamz Music Group)*
*Maintained by: Mike Page Empire / CHANDLA System*
