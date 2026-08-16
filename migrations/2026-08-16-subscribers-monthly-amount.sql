-- 2026-08-16 PWYW pivot: add monthly_amount_cents to subscribers
-- Design ref: docs/plans/2026-08-16-pwyw-pivot-design.md (v2)
--
-- Backfills grandfathered subs based on their existing tier so they keep
-- charging at their original price and /account can display "You support
-- at $X/mo". New PWYW subs will write their chosen amount via the
-- extended Stripe webhook (P2-T3).

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS monthly_amount_cents integer;

CREATE INDEX IF NOT EXISTS idx_subscribers_monthly_amount
  ON public.subscribers(monthly_amount_cents);

-- Backfill from existing tier values.
UPDATE public.subscribers SET monthly_amount_cents = 499  WHERE tier = 'premium'   AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 999  WHERE tier = 'creator'   AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 1499 WHERE tier = 'diamond'   AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 499  WHERE tier = 'supporter' AND monthly_amount_cents IS NULL;

-- Validate future writes: min $1/mo, max $999/mo.
ALTER TABLE public.subscribers
  DROP CONSTRAINT IF EXISTS subscribers_monthly_amount_cents_range;
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_monthly_amount_cents_range
  CHECK (monthly_amount_cents IS NULL OR (monthly_amount_cents >= 100 AND monthly_amount_cents <= 99900));

-- Verification query (run after apply):
-- SELECT tier, count(*), min(monthly_amount_cents), max(monthly_amount_cents)
--   FROM public.subscribers GROUP BY tier ORDER BY tier;
