-- =============================================================================
-- Prepare for R2 Migration
-- Adds helper functions and tracking for migrating local images to R2
-- =============================================================================

-- Add a column to track original local paths (optional, for rollback capability)
ALTER TABLE games ADD COLUMN IF NOT EXISTS image_local_backup TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS hero_image_local_backup TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_local_backup TEXT;
ALTER TABLE hero_banners ADD COLUMN IF NOT EXISTS image_local_backup TEXT;
ALTER TABLE hero_banners ADD COLUMN IF NOT EXISTS thumbnail_local_backup TEXT;
ALTER TABLE custom_pages ADD COLUMN IF NOT EXISTS image_local_backup TEXT;

-- Create a function to backup current image paths before migration
CREATE OR REPLACE FUNCTION backup_image_paths()
RETURNS void AS $$
BEGIN
  -- Backup games images
  UPDATE games
  SET image_local_backup = image,
      hero_image_local_backup = hero_image
  WHERE (image LIKE '/cover-game/%' OR image LIKE '/public/%')
     OR (hero_image LIKE '/cover-game/%' OR hero_image LIKE '/public/%');

  -- Backup services images
  UPDATE services
  SET image_local_backup = image
  WHERE image LIKE '/cover-game/%' OR image LIKE '/public/%';

  -- Backup hero_banners images
  UPDATE hero_banners
  SET image_local_backup = image,
      thumbnail_local_backup = thumbnail
  WHERE (image LIKE '/public/%' OR image LIKE '/%')
     OR (thumbnail LIKE '/public/%' OR thumbnail LIKE '/%');

  -- Backup custom_pages images
  UPDATE custom_pages
  SET image_local_backup = image
  WHERE image LIKE '/public/%' OR image LIKE '/%';

  RAISE NOTICE 'Image paths backed up successfully';
END;
$$ LANGUAGE plpgsql;

-- Create a function to rollback to local paths if needed
CREATE OR REPLACE FUNCTION rollback_to_local_images()
RETURNS void AS $$
BEGIN
  -- Rollback games
  UPDATE games
  SET image = image_local_backup,
      hero_image = hero_image_local_backup
  WHERE image_local_backup IS NOT NULL OR hero_image_local_backup IS NOT NULL;

  -- Rollback services
  UPDATE services
  SET image = image_local_backup
  WHERE image_local_backup IS NOT NULL;

  -- Rollback hero_banners
  UPDATE hero_banners
  SET image = image_local_backup,
      thumbnail = thumbnail_local_backup
  WHERE image_local_backup IS NOT NULL OR thumbnail_local_backup IS NOT NULL;

  -- Rollback custom_pages
  UPDATE custom_pages
  SET image = image_local_backup
  WHERE image_local_backup IS NOT NULL;

  RAISE NOTICE 'Rolled back to local image paths';
END;
$$ LANGUAGE plpgsql;

-- Execute backup before any migration
SELECT backup_image_paths();

-- Create an index to track migration status
CREATE INDEX IF NOT EXISTS idx_games_r2_migrated 
  ON games((image LIKE 'https://%'));

CREATE INDEX IF NOT EXISTS idx_services_r2_migrated 
  ON services((image LIKE 'https://%'));

CREATE INDEX IF NOT EXISTS idx_hero_banners_r2_migrated 
  ON hero_banners((image LIKE 'https://%'));

CREATE INDEX IF NOT EXISTS idx_custom_pages_r2_migrated 
  ON custom_pages((image LIKE 'https://%'));

-- Migration tracking table
CREATE TABLE IF NOT EXISTS r2_migration_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  column_name TEXT NOT NULL,
  old_path TEXT NOT NULL,
  new_url TEXT NOT NULL,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  migrated_by UUID REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_r2_migration_log_table 
  ON r2_migration_log(table_name, record_id);
