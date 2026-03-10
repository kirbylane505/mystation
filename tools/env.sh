#!/bin/bash
# ENV LOADER — Reliable .env.local key extraction
# Usage: source tools/env.sh
# Then use: $SK (Stripe), $SUPA_KEY (Supabase service role), $SUPA_URL, $PRINTIFY_KEY

ENV_FILE="/Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation/.env.local"

export SK=$(grep 'STRIPE_SECRET_KEY' "$ENV_FILE" | head -1 | cut -d'"' -f2)
export SUPA_KEY=$(grep 'SUPABASE_SERVICE_ROLE_KEY' "$ENV_FILE" | head -1 | cut -d'"' -f2)
export SUPA_URL=$(grep 'NEXT_PUBLIC_SUPABASE_URL' "$ENV_FILE" | head -1 | cut -d'"' -f2)
export SUPA_ANON=$(grep 'NEXT_PUBLIC_SUPABASE_ANON_KEY' "$ENV_FILE" | head -1 | cut -d'"' -f2)
export PRINTIFY_KEY=$(grep 'PRINTIFY_API_KEY' "$ENV_FILE" | head -1 | cut -d'"' -f2)
export SPOTIFY_ID=$(grep 'SPOTIFY_CLIENT_ID' "$ENV_FILE" | head -1 | cut -d'"' -f2)
export SPOTIFY_SECRET=$(grep 'SPOTIFY_CLIENT_SECRET' "$ENV_FILE" | head -1 | cut -d'"' -f2)
