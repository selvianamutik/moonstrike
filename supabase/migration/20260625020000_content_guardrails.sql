-- =============================================================================
-- Content guardrails
-- Keep landing Benefits single-active because the storefront renders one
-- Benefits section at a time.
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_blocks_one_active_benefits
  ON content_blocks (type)
  WHERE type = 'benefits_section' AND status = 'active';
