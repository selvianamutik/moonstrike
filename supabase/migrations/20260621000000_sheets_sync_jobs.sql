-- =============================================================================
-- Google Sheets sync jobs
-- Queue-style marker table for syncing order/transaction changes to Google
-- Sheets without blocking checkout, refund, or admin status updates.
-- =============================================================================

CREATE TABLE IF NOT EXISTS sheets_sync_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  target        TEXT        NOT NULL UNIQUE CHECK (target IN ('orders', 'transactions', 'all')),
  status        TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  attempts      INTEGER     NOT NULL DEFAULT 0,
  last_error    TEXT,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_at TIMESTAMPTZ,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sheets_sync_jobs_status_requested
  ON sheets_sync_jobs(status, requested_at);

ALTER TABLE sheets_sync_jobs ENABLE ROW LEVEL SECURITY;
