-- Phone OTP auth migration (design: 2026-04-17-phone-otp-premium-redesign-design.md)
-- Adds phone column + migration tracking to profiles.
-- SAFE: all operations use IF NOT EXISTS; fully idempotent.

-- Add phone column for phone-OTP auth (unique, indexed for fast lookup)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Track whether email auth was retired after a user migrated to phone
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_auth_retired BOOLEAN NOT NULL DEFAULT FALSE;

-- Phone-only accounts created post-migration may never have an email
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Audit which auth path the user came in through
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_method TEXT
  CHECK (auth_method IN ('email', 'phone', 'migrated'))
  DEFAULT 'email';
