-- =============================================================================
-- Transaction ledger
-- Stores provider-level payment records after checkout fulfillment.
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id                    UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id   TEXT             NOT NULL UNIQUE REFERENCES checkout_sessions (id) ON DELETE RESTRICT,
  user_id               UUID             NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  provider              payment_provider NOT NULL,
  provider_payment_id   TEXT             NOT NULL,
  provider_session_id   TEXT,
  amount                NUMERIC(10, 2)   NOT NULL,
  currency              currency_code    NOT NULL,
  method                TEXT             NOT NULL DEFAULT 'Stripe Checkout',
  status                TEXT             NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'pending', 'disputed', 'refunded', 'failed')),
  refund_status         TEXT             NOT NULL DEFAULT 'none'
    CHECK (refund_status IN ('none', 'requested', 'approved', 'rejected', 'refunded')),
  refunded_at           TIMESTAMPTZ,
  raw_provider_payload  JSONB            NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id             ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_payment_id ON transactions (provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status              ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at          ON transactions (created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_transactions" ON transactions;
DROP POLICY IF EXISTS "service_role_manage_transactions" ON transactions;

CREATE POLICY "customer_read_own_transactions"
ON transactions FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "service_role_manage_transactions"
ON transactions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
