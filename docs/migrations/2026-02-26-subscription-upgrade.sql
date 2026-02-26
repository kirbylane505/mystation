-- MYSTATION — Subscription Upgrade Migration
-- Run this in Supabase Dashboard → SQL Editor
-- Date: 2026-02-26
-- Purpose: Add Stripe subscription tracking columns to subscribers table
--
-- SAFE TO RUN MULTIPLE TIMES (all statements use IF NOT EXISTS)

-- Add Stripe customer ID (for linking to Stripe customer)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe subscription ID (for upgrade/downgrade/cancel)
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add subscription period end date
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Add cancel at period end flag
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Index for fast lookups by Stripe IDs
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_sub ON subscribers(stripe_subscription_id);

-- Verify: show all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscribers'
ORDER BY ordinal_position;
