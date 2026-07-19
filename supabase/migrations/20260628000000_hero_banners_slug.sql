-- Add slug column to hero_banners for human-readable routing
ALTER TABLE hero_banners ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing rows from their title
UPDATE hero_banners
SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL;

-- Prevent NULL slugs at DB level
ALTER TABLE hero_banners ALTER COLUMN slug SET NOT NULL;