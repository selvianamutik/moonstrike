-- Add the 'vouchers' permission to existing role_permissions rows.
-- The base migration uses ON CONFLICT DO NOTHING, so this backfills
-- the 'vouchers' key for roles that were seeded before the permission existed.

UPDATE role_permissions
SET permissions = permissions || '["vouchers"]'::jsonb
WHERE role IN ('super_admin', 'admin')
  AND NOT permissions @> '["vouchers"]'::jsonb;