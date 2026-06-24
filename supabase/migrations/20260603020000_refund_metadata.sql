-- =============================================================================
-- Refund metadata
-- Stores Moon Strike refund review fields and Stripe refund references.
-- =============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS provider_refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS refund_currency currency_code,
  ADD COLUMN IF NOT EXISTS refund_category TEXT,
  ADD COLUMN IF NOT EXISTS refund_note TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_provider_refund_id ON transactions (provider_refund_id);
