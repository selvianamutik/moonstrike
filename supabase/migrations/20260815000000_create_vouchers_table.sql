-- =============================================================================
-- Vouchers Table Migration
-- Creates the vouchers table for storing promotional discount codes
-- Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
-- =============================================================================

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT          NOT NULL UNIQUE,
  discount_percentage NUMERIC(5,2)  NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  expires_at          TIMESTAMPTZ   NOT NULL,
  created_by          UUID          NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add CHECK constraint for case-insensitive uniqueness on code
-- Note: UNIQUE constraint on code column handles case-sensitive uniqueness
-- The UPPER(code) functional index below handles case-insensitive lookups
ALTER TABLE vouchers ADD CONSTRAINT vouchers_code_unique UNIQUE (code);

-- Create functional index on UPPER(code) for case-insensitive uniqueness
-- This ensures 'SAVE20' and 'save20' cannot both exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code_upper_unique ON vouchers ((UPPER(code)));

-- Create index on expires_at for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON vouchers (expires_at);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers (created_at DESC);

-- Enable Row Level Security
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any (for idempotency)
DROP POLICY IF EXISTS "service_role_manage_vouchers" ON vouchers;

-- Create service_role policy for full CRUD access
-- This allows the Next.js API routes (using service role) to manage vouchers
CREATE POLICY "service_role_manage_vouchers"
ON vouchers FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create trigger for updated_at timestamp
-- Uses the existing set_current_timestamp_updated_at() function
CREATE TRIGGER set_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add comment for documentation
COMMENT ON TABLE vouchers IS 'Stores promotional voucher codes with discount percentages and expiration dates';
COMMENT ON COLUMN vouchers.code IS 'Unique voucher code (case-insensitive)';
COMMENT ON COLUMN vouchers.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN vouchers.expires_at IS 'Expiration timestamp after which voucher is invalid';
COMMENT ON COLUMN vouchers.created_by IS 'Admin user who created the voucher';