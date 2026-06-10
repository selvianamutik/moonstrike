-- =============================================================================
-- Drop region data
-- Currency is display-only and order/service availability is no longer region
-- gated, so order items and promo banners no longer keep region fields.
-- =============================================================================

ALTER TABLE order_items
  DROP COLUMN IF EXISTS region;

ALTER TABLE promo_banners
  DROP COLUMN IF EXISTS region;

ALTER TABLE orders
  DROP COLUMN IF EXISTS region;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_depend
    WHERE refobjid = 'region_value'::regtype
      AND deptype IN ('n', 'a')
  ) THEN
    DROP TYPE IF EXISTS region_value;
  END IF;
END $$;
