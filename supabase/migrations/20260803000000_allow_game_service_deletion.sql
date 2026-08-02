-- =============================================================================
-- Allow games and services to be deleted even when referenced
-- Changes ON DELETE RESTRICT to ON DELETE SET NULL for soft deletion
-- =============================================================================

-- First, make columns nullable before changing constraints
ALTER TABLE services ALTER COLUMN game_id DROP NOT NULL;
ALTER TABLE cart_items ALTER COLUMN service_id DROP NOT NULL;

-- Drop existing foreign key constraints that prevent deletion
DO $$ 
DECLARE
  constraint_record RECORD;
BEGIN
  -- Drop all foreign key constraints on services.game_id
  FOR constraint_record IN 
    SELECT c.conname 
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'services'::regclass 
    AND c.contype = 'f'
    AND a.attname = 'game_id'
  LOOP
    EXECUTE 'ALTER TABLE services DROP CONSTRAINT ' || constraint_record.conname;
  END LOOP;

  -- Drop all foreign key constraints on cart_items.service_id
  FOR constraint_record IN 
    SELECT c.conname 
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE c.conrelid = 'cart_items'::regclass 
    AND c.contype = 'f'
    AND a.attname = 'service_id'
  LOOP
    EXECUTE 'ALTER TABLE cart_items DROP CONSTRAINT ' || constraint_record.conname;
  END LOOP;
END $$;

-- Recreate constraints with ON DELETE SET NULL
ALTER TABLE services
  ADD CONSTRAINT services_game_id_fkey
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE SET NULL;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

-- Create indexes for better query performance on nullable foreign keys
CREATE INDEX IF NOT EXISTS idx_services_game_id_null ON services(game_id) WHERE game_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_service_id_null ON cart_items(service_id) WHERE service_id IS NULL;

-- Add a view to easily find orphaned records
CREATE OR REPLACE VIEW orphaned_services AS
SELECT id, title, slug, status, created_at
FROM services
WHERE game_id IS NULL;

CREATE OR REPLACE VIEW orphaned_cart_items AS
SELECT id, cart_id, created_at
FROM cart_items
WHERE service_id IS NULL;

COMMENT ON VIEW orphaned_services IS 'Services whose game has been deleted';
COMMENT ON VIEW orphaned_cart_items IS 'Cart items whose service has been deleted';
