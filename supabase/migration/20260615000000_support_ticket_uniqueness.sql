-- =============================================================================
-- Support ticket uniqueness
-- Prevent duplicate general/order chat tickets caused by concurrent get-or-create
-- requests from the chat bubble, profile chat, or order chat entry points.
--
-- This migration intentionally does not merge or delete existing duplicates.
-- During testing, clear chat history explicitly before applying this if duplicate
-- support_tickets already exist:
--   npm run chat:cleanup -- --confirm
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uniq_support_tickets_customer_general
  ON support_tickets(user_id)
  WHERE user_id IS NOT NULL AND order_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_support_tickets_customer_order
  ON support_tickets(order_id)
  WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_support_tickets_anonymous_general
  ON support_tickets(session_id)
  WHERE user_id IS NULL AND session_id IS NOT NULL AND order_id IS NULL;
