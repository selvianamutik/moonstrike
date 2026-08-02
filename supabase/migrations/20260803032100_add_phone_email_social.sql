-- Add phone and email contact platforms to social_media_settings
INSERT INTO social_media_settings (platform, url, display_order, is_active) VALUES
  ('phone', NULL, 7, false),
  ('email', NULL, 8, false)
ON CONFLICT (platform) DO NOTHING;
