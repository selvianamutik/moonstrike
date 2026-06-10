-- =============================================================================
-- Remove default currency setting
-- Currency is a storefront/user display preference, not an admin system setting.
-- =============================================================================

ALTER TABLE system_settings
  DROP COLUMN IF EXISTS default_currency;
