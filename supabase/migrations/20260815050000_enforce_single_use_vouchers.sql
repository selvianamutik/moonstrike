-- A voucher is globally single-use.
CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_unique
  ON voucher_redemptions (voucher_id);
