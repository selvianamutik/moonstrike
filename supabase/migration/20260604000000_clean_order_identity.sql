-- =============================================================================
-- Clean order identity and ownership
-- Orders now store lifecycle only. Items and payment details live in
-- order_items and transactions.
-- =============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_ref TEXT;

WITH ordered AS (
  SELECT
    id,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS sequence_number
  FROM orders
  WHERE order_ref IS NULL OR order_ref = ''
)
UPDATE orders
SET order_ref =
  'MS-' ||
  TO_CHAR(ordered.created_at AT TIME ZONE 'UTC', 'YYYYMMDD') ||
  '-' ||
  LPAD(ordered.sequence_number::TEXT, 6, '0')
FROM ordered
WHERE orders.id = ordered.id;

ALTER TABLE orders
  ALTER COLUMN order_ref SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_ref_key
  ON orders (order_ref);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_checkout_session_id_fkey'
      AND conrelid = 'orders'::regclass
  )
  AND NOT EXISTS (
    SELECT 1
    FROM orders
    LEFT JOIN checkout_sessions
      ON checkout_sessions.id = orders.checkout_session_id
    WHERE checkout_sessions.id IS NULL
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_checkout_session_id_fkey
      FOREIGN KEY (checkout_session_id)
      REFERENCES checkout_sessions (id)
      ON DELETE RESTRICT;
  END IF;
END $$;

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_service_id_fkey,
  DROP CONSTRAINT IF EXISTS orders_cart_item_id_fkey;

ALTER TABLE orders
  DROP COLUMN IF EXISTS cart_item_id,
  DROP COLUMN IF EXISTS service_id,
  DROP COLUMN IF EXISTS selected_options_snapshot,
  DROP COLUMN IF EXISTS total,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS payment_provider,
  DROP COLUMN IF EXISTS stripe_payment_intent_id,
  DROP COLUMN IF EXISTS nowpayments_payment_id,
  DROP COLUMN IF EXISTS crypto_refund_address;

CREATE INDEX IF NOT EXISTS idx_orders_order_ref ON orders (order_ref);
