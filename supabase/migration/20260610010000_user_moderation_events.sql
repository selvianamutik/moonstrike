-- =============================================================================
-- Storefront customer moderation history
-- Records structured ban/unban events separately from free-form audit logs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('banned', 'unbanned')),
  reason text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_moderation_events_user_id_created_at
  ON user_moderation_events (user_id, created_at DESC);

ALTER TABLE user_moderation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only_user_moderation_events" ON user_moderation_events;
CREATE POLICY "service_role_only_user_moderation_events"
ON user_moderation_events FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
