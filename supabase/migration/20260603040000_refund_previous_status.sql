-- =============================================================================
-- Refund previous status
-- Allows denied refund requests to restore the order workflow state.
-- =============================================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS refund_previous_status order_status;
