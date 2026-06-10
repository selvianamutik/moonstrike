-- =============================================================================
-- Add human-readable transaction references
-- transactions.id remains the database UUID. transaction_ref is the internal
-- support/customer-facing transaction identifier.
-- =============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS transaction_ref TEXT;

WITH ordered AS (
  SELECT
    id,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence_number
  FROM transactions
  WHERE transaction_ref IS NULL OR transaction_ref = ''
)
UPDATE transactions
SET transaction_ref =
  'TXN-' ||
  TO_CHAR(ordered.created_at AT TIME ZONE 'UTC', 'YYYYMMDD') ||
  '-' ||
  LPAD(ordered.sequence_number::TEXT, 6, '0')
FROM ordered
WHERE transactions.id = ordered.id;

ALTER TABLE transactions
  ALTER COLUMN transaction_ref SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_transaction_ref_key
  ON transactions (transaction_ref);

CREATE INDEX IF NOT EXISTS idx_transactions_transaction_ref
  ON transactions (transaction_ref);
