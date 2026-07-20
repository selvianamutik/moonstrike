ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0;

-- Backfill base_price from order_items total for existing orders
UPDATE orders o
SET base_price = COALESCE((
  SELECT SUM(oi.total) FROM order_items oi WHERE oi.order_id = o.id
), 0)
WHERE o.base_price = 0 OR o.base_price IS NULL;
