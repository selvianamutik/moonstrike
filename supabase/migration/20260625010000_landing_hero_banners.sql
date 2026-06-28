-- =============================================================================
-- Landing hero banner CMS
-- Multiple scheduled storefront hero banners with structured CTA targets.
-- =============================================================================

ALTER TYPE cms_status ADD VALUE IF NOT EXISTS 'archived';

CREATE TABLE IF NOT EXISTS hero_banners (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT        NOT NULL DEFAULT '',
  image          TEXT        NOT NULL DEFAULT '',
  thumbnail      TEXT        NOT NULL DEFAULT '',
  storage_path   TEXT        NOT NULL DEFAULT '',
  thumbnail_path TEXT        NOT NULL DEFAULT '',
  badges         TEXT[]      NOT NULL DEFAULT '{}',
  cta_label      TEXT        NOT NULL DEFAULT 'View Details',
  cta_type       TEXT        NOT NULL DEFAULT 'custom'
    CHECK (cta_type IN ('game', 'service', 'custom')),
  cta_href       TEXT        NOT NULL DEFAULT '/games',
  cta_title      TEXT        NOT NULL DEFAULT '',
  cta_meta       TEXT        NOT NULL DEFAULT '',
  status         cms_status  NOT NULL DEFAULT 'draft',
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  created_by     UUID        NOT NULL REFERENCES admin_users (id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hero_banners_schedule_order CHECK (
    ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at
  )
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_status
  ON hero_banners (status);

CREATE INDEX IF NOT EXISTS idx_hero_banners_schedule
  ON hero_banners (starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_hero_banners_sort_order
  ON hero_banners (sort_order, updated_at DESC);

ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_manage_hero_banners" ON hero_banners;

CREATE POLICY "service_role_manage_hero_banners"
ON hero_banners FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
