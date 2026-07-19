-- =============================================================================
-- Game hero banner image
-- =============================================================================

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS hero_image TEXT NOT NULL DEFAULT '';
