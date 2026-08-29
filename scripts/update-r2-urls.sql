-- Update R2 URLs from pub-*.r2.dev to media.moonstrike.pro
-- Run this in your Supabase SQL Editor

-- Update games table
UPDATE games 
SET image = REPLACE(image, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    updated_at = NOW()
WHERE image LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

UPDATE games 
SET hero_image = REPLACE(hero_image, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    updated_at = NOW()
WHERE hero_image LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

-- Update services table
UPDATE services 
SET image = REPLACE(image, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    updated_at = NOW()
WHERE image LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

-- Update hero_banners table
UPDATE hero_banners 
SET image = REPLACE(image, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    updated_at = NOW()
WHERE image LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

UPDATE hero_banners 
SET thumbnail = REPLACE(thumbnail, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    updated_at = NOW()
WHERE thumbnail LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

-- Update content_blocks table
UPDATE content_blocks 
SET thumbnail = REPLACE(thumbnail, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    modified_at = NOW()
WHERE thumbnail LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

-- Update content_blocks data JSON field
UPDATE content_blocks 
SET data = REPLACE(data::text, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro')::jsonb,
    modified_at = NOW()
WHERE data::text LIKE '%https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

-- Update custom_pages table
UPDATE custom_pages 
SET image = REPLACE(image, 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev', 'https://media.moonstrike.pro'),
    updated_at = NOW()
WHERE image LIKE 'https://pub-6fb6b9f9e4d44451abb219b65914a713.r2.dev%';

-- Check results
SELECT 'games' AS table_name, COUNT(*) AS count FROM games WHERE image LIKE 'https://media.moonstrike.pro%' OR hero_image LIKE 'https://media.moonstrike.pro%'
UNION ALL
SELECT 'services', COUNT(*) FROM services WHERE image LIKE 'https://media.moonstrike.pro%'
UNION ALL
SELECT 'hero_banners', COUNT(*) FROM hero_banners WHERE image LIKE 'https://media.moonstrike.pro%' OR thumbnail LIKE 'https://media.moonstrike.pro%'
UNION ALL
SELECT 'content_blocks', COUNT(*) FROM content_blocks WHERE thumbnail LIKE 'https://media.moonstrike.pro%' OR data::text LIKE '%https://media.moonstrike.pro%'
UNION ALL
SELECT 'custom_pages', COUNT(*) FROM custom_pages WHERE image LIKE 'https://media.moonstrike.pro%';
