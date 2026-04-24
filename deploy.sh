#!/usr/bin/env bash
# MyStation Deploy Script — Safe single-deploy pipeline
# Usage: ./deploy.sh [--force]
# Prevents concurrent builds (Vercel Hobby = 1 build limit)

set -euo pipefail
cd "$(dirname "$0")"

FORCE="${1:-}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== MYSTATION DEPLOY ===${NC}"
echo ""

# Step 1: Check for in-flight builds
echo -e "${YELLOW}[1/6] Checking for in-flight builds...${NC}"
BUILDING=$(vercel ls 2>&1 | grep -c "Building\|Queued" || true)
if [ "$BUILDING" -gt 0 ]; then
    if [ "$FORCE" = "--force" ]; then
        echo -e "${RED}Found $BUILDING in-flight build(s). Force flag set — waiting for them to finish or cancel...${NC}"
        echo "Kill them manually with: vercel rm <url> -y"
    else
        echo -e "${RED}ERROR: $BUILDING build(s) already in flight!${NC}"
        echo "Wait for them to finish, or run: ./deploy.sh --force"
        echo "Or kill them with: vercel rm <url> -y"
        exit 1
    fi
fi
echo -e "${GREEN}No conflicting builds.${NC}"

# Step 2: Clean previous build artifacts
echo -e "${YELLOW}[2/6] Cleaning build artifacts...${NC}"
rm -rf .vercel/output .next
echo "Cleaned .vercel/output and .next"

# Step 3: Install dependencies
echo -e "${YELLOW}[3/6] Installing dependencies...${NC}"
npm install --prefer-offline 2>&1 | tail -1

# Step 4: Pattern guards (catches PWA runtime bugs that build won't catch)
echo -e "${YELLOW}[4/6] Pattern guards...${NC}"
GUARD_FAIL=0
# ERR-0059: html{overflow} freezes iOS PWA scrolling (only put overflow on body)
if grep -rEn 'html\s*\{[^}]*overflow' app/ components/ styles/ 2>/dev/null; then
    echo -e "${RED}  overflow set on <html> detected — iOS PWA will freeze (ERR-0059)${NC}"
    GUARD_FAIL=1
fi
# ERR-0053: wrong admin email typo torches customer email routing
if grep -rn 'mystationllc1@' app/ lib/ pages/ 2>/dev/null; then
    echo -e "${RED}  mystationllc1@ typo detected — should be mystationlive@ (ERR-0053)${NC}"
    GUARD_FAIL=1
fi
if [ "$GUARD_FAIL" = "1" ] && [ "$FORCE" != "--force" ]; then
    echo -e "${RED}Pattern guard failed. Fix or run: ./deploy.sh --force${NC}"
    exit 1
fi
echo -e "${GREEN}Pattern guards clean.${NC}"

# Step 5: Build locally (explicit exit on failure — pipefail covers pipes,
# this adds a visible message so failures don't go silent)
echo -e "${YELLOW}[5/6] Building locally...${NC}"
BUILD_START=$(date +%s)
vercel build --prod 2>&1 | tail -3
if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    echo -e "${RED}BUILD FAILED — not deploying${NC}"
    exit 1
fi
BUILD_END=$(date +%s)
echo "Build completed in $((BUILD_END - BUILD_START)) seconds"

# Step 6: Deploy — full remote build (per CLAUDE.md rule, avoids ERR-0009
# "Cannot find module 'react'" from prebuilt filePathMap gap)
echo -e "${YELLOW}[6/6] Deploying to production (full remote build)...${NC}"
vercel --prod 2>&1

# Verify
echo ""
echo -e "${YELLOW}Verifying production...${NC}"
sleep 5
for page in "/" "/music" "/search" "/merch" "/events" "/events/lotl-2026"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mystationlive.com${page}")
    if [ "$STATUS" = "200" ]; then
        echo -e "  ${GREEN}${page} — ${STATUS} OK${NC}"
    else
        echo -e "  ${RED}${page} — ${STATUS} FAIL${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== DEPLOY COMPLETE ===${NC}"
