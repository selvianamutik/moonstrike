-- Create helper function used by triggers
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

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
CREATE TABLE IF NOT EXISTS private_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  platform TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'boosting',
  price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  additional_info TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_private_offers_updated_at
  BEFORE UPDATE ON private_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE private_offers ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS custom_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_custom_pages_updated_at
  BEFORE UPDATE ON custom_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE custom_pages ENABLE ROW LEVEL SECURITY;
-- Migrate admin_users.role from old CHECK (role = 'ADMIN') to role-based system
-- Steps:
--   1. Drop old CHECK constraint (if exists)
--   2. Normalize existing values to lowercase
--   3. Add new CHECK constraint for role-based access

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

UPDATE admin_users
  SET role = LOWER(role);

ALTER TABLE admin_users
  ALTER COLUMN role SET DEFAULT 'admin';

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('super_admin', 'admin', 'support'));
