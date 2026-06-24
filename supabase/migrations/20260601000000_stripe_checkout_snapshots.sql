-- =============================================================================
-- Stripe checkout snapshots and idempotent order fulfillment
-- =============================================================================

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id                  TEXT             PRIMARY KEY,
  cart_id             UUID             NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
  user_id             UUID             NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  currency            currency_code    NOT NULL,
  provider            payment_provider NOT NULL DEFAULT 'stripe',
  status              TEXT             NOT NULL DEFAULT 'created',
  items               JSONB            NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  fulfilled_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_cart_id ON checkout_sessions (cart_id);

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_manage_checkout_sessions" ON checkout_sessions;

CREATE POLICY "service_role_manage_checkout_sessions"
ON checkout_sessions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DO $$
BEGIN
  WITH duplicate_orders AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY checkout_session_id, cart_item_id
        ORDER BY created_at ASC, id ASC
      ) AS duplicate_rank
    FROM orders
    WHERE cart_item_id IS NOT NULL
  )
  DELETE FROM orders
  WHERE id IN (
    SELECT id
    FROM duplicate_orders
    WHERE duplicate_rank > 1
  );

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_order_per_checkout_cart_item'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT unique_order_per_checkout_cart_item
      UNIQUE (checkout_session_id, cart_item_id);
  END IF;
END $$;
