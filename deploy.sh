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
echo -e "${YELLOW}[1/5] Checking for in-flight builds...${NC}"
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
echo -e "${YELLOW}[2/5] Cleaning build artifacts...${NC}"
rm -rf .vercel/output .next
echo "Cleaned .vercel/output and .next"

# Step 3: Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
npm install --prefer-offline 2>&1 | tail -1

# Step 4: Build locally
echo -e "${YELLOW}[4/5] Building locally...${NC}"
BUILD_START=$(date +%s)
vercel build --prod 2>&1 | tail -3
BUILD_END=$(date +%s)
echo "Build completed in $((BUILD_END - BUILD_START)) seconds"

# Step 5: Deploy prebuilt
echo -e "${YELLOW}[5/5] Deploying to production...${NC}"
DEPLOY_OUTPUT=$(vercel deploy --prebuilt --prod 2>&1)
echo "$DEPLOY_OUTPUT"

# Check if deploy succeeded
if echo "$DEPLOY_OUTPUT" | grep -q "Error"; then
    echo -e "${RED}Prebuilt deploy failed. Falling back to full remote build...${NC}"
    vercel --prod 2>&1
fi

# Verify
echo ""
echo -e "${YELLOW}Verifying production...${NC}"
sleep 5
for page in "/" "/music" "/search" "/merch"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mystationlive.com${page}")
    if [ "$STATUS" = "200" ]; then
        echo -e "  ${GREEN}${page} — ${STATUS} OK${NC}"
    else
        echo -e "  ${RED}${page} — ${STATUS} FAIL${NC}"
    fi
done

echo ""
echo -e "${GREEN}=== DEPLOY COMPLETE ===${NC}"
