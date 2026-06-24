-- =============================================================================
-- Admin chat unread tracking
-- =============================================================================

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS admin_last_read_at timestamptz NOT NULL DEFAULT now();

UPDATE support_tickets
SET admin_last_read_at = now()
WHERE admin_last_read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_tickets_admin_last_read_at
  ON support_tickets (admin_last_read_at);

CREATE INDEX IF NOT EXISTS idx_messages_ticket_sender_sent
  ON messages (ticket_id, sender_role, sent_at);
