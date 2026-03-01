-- MyStation Performance Indexes
-- Run in Supabase SQL Editor

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_sub ON subscribers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_user_trials_email ON user_trials(email);
CREATE INDEX IF NOT EXISTS idx_merch_orders_session ON merch_orders(stripe_session_id);
