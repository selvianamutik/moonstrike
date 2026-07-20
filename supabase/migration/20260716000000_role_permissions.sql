CREATE TABLE IF NOT EXISTS role_permissions (
  role TEXT PRIMARY KEY CHECK (role IN ('super_admin', 'admin', 'support')),
  description TEXT NOT NULL DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO role_permissions (role, description, permissions) VALUES
  ('super_admin', 'Full access to all features and settings', '["dashboard", "users", "games", "services", "orders", "transactions", "content", "messages", "logs", "settings", "admins"]'),
  ('admin', 'Can manage services, orders, and content', '["dashboard", "games", "services", "orders", "content", "messages"]'),
  ('support', 'Can view orders and respond to messages', '["dashboard", "orders", "messages"]')
ON CONFLICT (role) DO NOTHING;

CREATE TRIGGER set_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();
