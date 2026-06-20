-- =============================================================================
-- In-app notifications
-- Persisted notification feed for customers and admin. Chat unread badges remain
-- separate and are not stored in this table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type  TEXT        NOT NULL CHECK (recipient_type IN ('customer', 'admin')),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id        UUID        REFERENCES admin_users(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL DEFAULT '',
  href            TEXT        NOT NULL DEFAULT '',
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key      TEXT        UNIQUE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_recipient_matches_type CHECK (
    (recipient_type = 'customer' AND user_id IS NOT NULL AND admin_id IS NULL)
    OR
    (recipient_type = 'admin' AND admin_id IS NOT NULL AND user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_customer_created
  ON notifications(user_id, created_at DESC)
  WHERE recipient_type = 'customer';

CREATE INDEX IF NOT EXISTS idx_notifications_admin_created
  ON notifications(admin_id, created_at DESC)
  WHERE recipient_type = 'admin';

CREATE INDEX IF NOT EXISTS idx_notifications_customer_unread
  ON notifications(user_id, read_at)
  WHERE recipient_type = 'customer' AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_admin_unread
  ON notifications(admin_id, read_at)
  WHERE recipient_type = 'admin' AND read_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
