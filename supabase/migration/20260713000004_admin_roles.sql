-- Migrate admin_users.role from old CHECK (role = 'ADMIN') to role-based system
-- Steps:
--   1. Drop old CHECK constraint (if exists)
--   2. Normalize existing values to lowercase
--   3. Add new CHECK constraint for role-based access

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

UPDATE admin_users
  SET role = LOWER(role);

ALTER TABLE admin_users
  ALTER COLUMN role SET DEFAULT 'admin';

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('super_admin', 'admin', 'support'));
