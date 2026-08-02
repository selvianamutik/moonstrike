-- Create social_media_settings table
CREATE TABLE IF NOT EXISTS social_media_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(50) NOT NULL UNIQUE,
  url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default platforms
INSERT INTO social_media_settings (platform, url, display_order, is_active) VALUES
  ('instagram', NULL, 1, false),
  ('youtube', NULL, 2, false),
  ('tiktok', NULL, 3, false),
  ('twitter', NULL, 4, false),
  ('discord', NULL, 5, false),
  ('facebook', NULL, 6, false),
  ('phone', NULL, 7, false),
  ('email', NULL, 8, false)
ON CONFLICT (platform) DO NOTHING;

-- Create index for active platforms
CREATE INDEX IF NOT EXISTS idx_social_media_active ON social_media_settings(is_active, display_order);
