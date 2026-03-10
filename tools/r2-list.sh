#!/bin/bash
# R2 Object Listing Tool
# Usage: ./r2-list.sh [prefix]
# Example: ./r2-list.sh tracks/
# Example: ./r2-list.sh fantasy
#
# NOTE: `wrangler r2 object list` does NOT exist in wrangler 4.66+
# This script uses the S3-compatible API directly via AWS CLI

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/env.sh" 2>/dev/null

# Load from .env.local if not in environment
if [ -z "$R2_ACCESS_KEY_ID" ]; then
  ENV_FILE="$SCRIPT_DIR/../.env.local"
  if [ -f "$ENV_FILE" ]; then
    export R2_ACCESS_KEY_ID=$(grep R2_ACCESS_KEY_ID "$ENV_FILE" | cut -d'"' -f2)
    export R2_SECRET_ACCESS_KEY=$(grep R2_SECRET_ACCESS_KEY "$ENV_FILE" | cut -d'"' -f2)
    export R2_ACCOUNT_ID=$(grep R2_ACCOUNT_ID "$ENV_FILE" | cut -d'"' -f2)
  fi
fi

BUCKET="mystation-audio"
PREFIX="${1:-}"
ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Use aws CLI with S3 compatibility
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

if [ -n "$PREFIX" ]; then
  aws s3 ls "s3://${BUCKET}/${PREFIX}" --endpoint-url "$ENDPOINT" 2>/dev/null || echo "aws CLI not found or error. Install: brew install awscli"
else
  aws s3 ls "s3://${BUCKET}/" --endpoint-url "$ENDPOINT" 2>/dev/null || echo "aws CLI not found or error. Install: brew install awscli"
fi
