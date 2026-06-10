-- =============================================================================
-- Track completion time for the post-completion refund window.
-- Users may request refunds up to 7 days after an order is marked completed.
-- =============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE orders
SET completed_at = COALESCE(completed_at, updated_at)
WHERE status = 'completed'
  AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders (completed_at);
