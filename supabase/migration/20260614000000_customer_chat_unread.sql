-- =============================================================================
-- Customer chat unread tracking
-- Tracks the last time a customer viewed each support ticket so admin replies can
-- show durable unread badges across refreshes, tabs, and devices.
-- =============================================================================

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS customer_last_read_at timestamptz NOT NULL DEFAULT now();

UPDATE support_tickets
SET customer_last_read_at = COALESCE(customer_last_read_at, now());

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_last_read
  ON support_tickets(customer_last_read_at);
