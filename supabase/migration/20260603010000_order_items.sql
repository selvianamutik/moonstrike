-- =============================================================================
-- Order items
-- One order now represents one checkout. Services inside that checkout live here.
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_items (
  id                        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                  UUID           NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  cart_item_id              UUID,
  service_id                UUID           NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  selected_options_snapshot JSONB          NOT NULL DEFAULT '{}',
  total                     NUMERIC(10, 2) NOT NULL,
  currency                  currency_code  NOT NULL,
  region                    region_value   NOT NULL,
  created_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_order_item_per_cart_item UNIQUE (order_id, cart_item_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items (service_id);

DO $$
BEGIN
  WITH ranked_orders AS (
    SELECT
      id,
      FIRST_VALUE(id) OVER (
        PARTITION BY checkout_session_id
        ORDER BY created_at ASC, id ASC
      ) AS parent_order_id,
      cart_item_id,
      service_id,
      selected_options_snapshot,
      total,
      currency,
      region,
      checkout_session_id,
      created_at
    FROM orders
  )
  INSERT INTO order_items (
    order_id,
    cart_item_id,
    service_id,
    selected_options_snapshot,
    total,
    currency,
    region,
    created_at
  )
  SELECT
    parent_order_id,
    cart_item_id,
    service_id,
    selected_options_snapshot,
    total,
    currency,
    region,
    created_at
  FROM ranked_orders
  ON CONFLICT (order_id, cart_item_id) DO NOTHING;

  WITH ranked_orders AS (
    SELECT
      id,
      FIRST_VALUE(id) OVER (
        PARTITION BY checkout_session_id
        ORDER BY created_at ASC, id ASC
      ) AS parent_order_id
    FROM orders
  )
  UPDATE support_tickets
  SET order_id = ranked_orders.parent_order_id
  FROM ranked_orders
  WHERE support_tickets.order_id = ranked_orders.id
    AND ranked_orders.id <> ranked_orders.parent_order_id;

  WITH order_totals AS (
    SELECT
      order_id,
      SUM(total) AS total
    FROM order_items
    GROUP BY order_id
  )
  UPDATE orders
  SET total = order_totals.total,
      selected_options_snapshot = '{}'
  FROM order_totals
  WHERE orders.id = order_totals.order_id;

  WITH ranked_orders AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY checkout_session_id
        ORDER BY created_at ASC, id ASC
      ) AS duplicate_rank
    FROM orders
  )
  DELETE FROM orders
  WHERE id IN (
    SELECT id
    FROM ranked_orders
    WHERE duplicate_rank > 1
  );

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_order_per_checkout_session'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT unique_order_per_checkout_session
      UNIQUE (checkout_session_id);
  END IF;
END $$;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_read_own_order_items" ON order_items;
DROP POLICY IF EXISTS "service_role_manage_order_items" ON order_items;

CREATE POLICY "customer_read_own_order_items"
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "service_role_manage_order_items"
ON order_items FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
