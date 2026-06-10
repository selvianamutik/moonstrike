-- =============================================================================
-- Audit log event categorization
-- Keeps status as severity/result and adds event_type for filtering/review.
-- =============================================================================

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'admin_action';

UPDATE audit_logs
SET event_type = CASE
  WHEN lower(action) LIKE '%checkout%' THEN 'checkout'
  WHEN lower(action) LIKE '%webhook%' THEN 'payment_webhook'
  WHEN lower(action) LIKE '%refund%' THEN 'refund'
  WHEN lower(action) LIKE '%auto-complete%' OR lower(action) LIKE '%cron%' THEN 'cron'
  WHEN lower(action) LIKE '%settings%' OR lower(action) LIKE '%password%' OR lower(action) LIKE '%avatar%' THEN 'settings'
  WHEN lower(action) LIKE '%login%' OR lower(action) LIKE '%logout%' OR lower(action) LIKE '%rate limit%' THEN 'auth'
  WHEN lower(action) LIKE '%game%' OR lower(action) LIKE '%service%' OR lower(action) LIKE '%content%' OR lower(action) LIKE '%genre%' OR lower(action) LIKE '%category%' OR lower(action) LIKE '%cms%' OR lower(action) LIKE '%upload%' THEN 'cms'
  WHEN lower(action) LIKE '%order%' OR lower(action) LIKE '%completion%' OR lower(action) LIKE '%delivered%' THEN 'order_lifecycle'
  WHEN status IN ('blocked', 'critical') THEN 'security'
  ELSE event_type
END
WHERE event_type = 'admin_action';

DO $$
BEGIN
  ALTER TABLE audit_logs
    ADD CONSTRAINT audit_logs_event_type_check
    CHECK (
      event_type IN (
        'auth',
        'admin_action',
        'checkout',
        'payment_webhook',
        'refund',
        'order_lifecycle',
        'cms',
        'settings',
        'cron',
        'security'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs (event_type);
