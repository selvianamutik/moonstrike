-- =============================================================================
-- Voucher Redemptions Migration
-- Tracks each successful use of a voucher so codes become single-use
-- after a completed order. Requirements: single-use voucher enforcement.
-- =============================================================================

CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id           UUID          NOT NULL REFERENCES vouchers (id) ON DELETE CASCADE,
  user_id              UUID          NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  checkout_session_id  TEXT          NOT NULL,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT voucher_redemptions_voucher_session_unique UNIQUE (voucher_id, checkout_session_id)
);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON voucher_redemptions (voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user_id ON voucher_redemptions (user_id);

ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_manage_voucher_redemptions" ON voucher_redemptions;
CREATE POLICY "service_role_manage_voucher_redemptions"
ON voucher_redemptions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');