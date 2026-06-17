-- =============================================================================
-- Admin settings fields
-- Keeps operational settings in the singleton system_settings row.
-- Secrets stay in environment variables/provider dashboards.
-- =============================================================================

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS session_timeout_hours integer NOT NULL DEFAULT 8 CHECK (session_timeout_hours BETWEEN 1 AND 168),
  ADD COLUMN IF NOT EXISTS refund_window_days integer NOT NULL DEFAULT 7 CHECK (refund_window_days BETWEEN 0 AND 30),
  ADD COLUMN IF NOT EXISTS auto_complete_days integer NOT NULL DEFAULT 7 CHECK (auto_complete_days BETWEEN 0 AND 30),
  ADD COLUMN IF NOT EXISTS notify_order_created boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_refund_requested boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_order_completed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE system_settings
SET
  session_timeout_hours = COALESCE(session_timeout_hours, 8),
  refund_window_days = COALESCE(refund_window_days, 7),
  auto_complete_days = COALESCE(auto_complete_days, 7),
  notify_order_created = COALESCE(notify_order_created, true),
  notify_refund_requested = COALESCE(notify_refund_requested, true),
  notify_order_completed = COALESCE(notify_order_completed, true),
  updated_at = now()
WHERE id = 'singleton';
