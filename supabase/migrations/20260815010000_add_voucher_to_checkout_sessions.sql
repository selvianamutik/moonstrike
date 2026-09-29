ALTER TABLE checkout_sessions
  ADD COLUMN IF NOT EXISTS voucher_code TEXT,
  ADD COLUMN IF NOT EXISTS voucher_discount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (voucher_discount >= 0);
