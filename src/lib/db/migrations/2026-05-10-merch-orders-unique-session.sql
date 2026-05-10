-- 2026-05-10 — UNIQUE constraint on merch_orders.stripe_session_id
--
-- Background: K Possible's $152.95 order on 2026-05-09 hit a Printify 409 because the
-- Stripe webhook redelivered the same checkout.session.completed event twice. The
-- existing idempotency check in the webhook (SELECT then INSERT) had a race window —
-- two concurrent webhook handlers could both pass the check and both INSERT, then
-- both attempt Printify creation with the same external_id, hitting 409 on the
-- second attempt.
--
-- Fix: add a UNIQUE constraint so the database itself rejects duplicate inserts
-- atomically. Webhook code uses ON CONFLICT DO NOTHING (Postgres) — only the
-- first concurrent caller wins the insert; the second sees zero rows returned
-- and bails before touching Printify.
--
-- This is the structural fix. The webhook code change in the same deploy treats
-- the conflict as the bail signal.

-- Drop existing non-unique index (will be replaced by unique constraint's auto-index)
DROP INDEX IF EXISTS idx_merch_orders_session;

-- Add UNIQUE constraint (creates its own index automatically)
ALTER TABLE merch_orders
  ADD CONSTRAINT merch_orders_stripe_session_id_unique
  UNIQUE (stripe_session_id);

-- Verification query (run after applying):
--   SELECT conname, contype FROM pg_constraint
--   WHERE conrelid = 'merch_orders'::regclass AND conname = 'merch_orders_stripe_session_id_unique';
